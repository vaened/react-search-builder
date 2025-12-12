import { beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import type { Field } from "../field";
import type { PersistenceAdapter } from "../persistence/PersistenceAdapter";
import { FieldStore } from "./FieldStore";
import { createFieldStore } from "./create";
import { createEventEmitter, type EventEmitter, type Events } from "./event-emitter";

const createTestField = (name: string, value = "default"): Field<"string", string> => ({
  name,
  type: "string",
  value,
  serializer: {
    serialize: (v) => v,
    unserialize: (v) => v,
  },
  humanize: (v) => v,
});

const createMockPersistence = (initialData = {}): PersistenceAdapter => ({
  read: vi.fn().mockReturnValue(initialData),
  write: vi.fn(),
  subscribe: vi.fn().mockReturnValue(() => {}),
});

describe("FieldStore", () => {
  let store: FieldStore;
  let persistence: PersistenceAdapter;
  let emitter: EventEmitter<Events>;
  let emitSpy: MockInstance;

  beforeEach(() => {
    persistence = createMockPersistence();
    emitter = createEventEmitter();
    emitSpy = vi.spyOn(emitter, "emit");
    store = createFieldStore({ persistence, emitter });
  });

  describe("1. Registration and Lifecycle", () => {
    it("should register a new field correctly and emit change", () => {
      const field = createTestField("search", "");
      store.register(field);

      expect(store.get("search")?.value).toBe("");

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "register",
          touched: ["search"],
        })
      );
    });

    it("should throw error on duplicate registration", () => {
      const field = createTestField("duplicated");
      store.register(field);

      expect(() => store.register(field)).toThrow(/DUPLICATE FIELD REGISTRATION/);
    });

    it("should remove field and emit change on unregister", () => {
      store.register(createTestField("toDelete"));
      emitSpy.mockClear();

      store.unregister("toDelete");

      expect(store.get("toDelete")).toBeUndefined();

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "unregister",
          touched: ["toDelete"],
        })
      );
    });
  });

  describe("2. State Manipulation (Set/Update/Reset/Clean)", () => {
    it("should update value with set() and emit event", () => {
      store.register(createTestField("query", "initial"));
      emitSpy.mockClear();

      store.set("query", "updated");

      expect(store.get("query")?.value).toBe("updated");

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "set",
          touched: ["query"],
        })
      );
    });

    it("should NOT emit event if value is identical", () => {
      store.register(createTestField("query", "same"));
      emitSpy.mockClear();

      store.set("query", "same");

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should update metadata and emit event", () => {
      store.register(createTestField("query", "val"));
      emitSpy.mockClear();

      store.update("query", { submittable: true });

      expect(store.get("query")?.submittable).toBe(true);

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "update",
          touched: ["query"],
        })
      );
    });

    it("should throw error when updating non-existent field", () => {
      expect(() => store.update("ghost", { submittable: true })).toThrow(/does not exist/);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should reset values and emit 'reset' operation", () => {
      const field = createTestField("filter", "defaultVal");
      store.register(field);
      store.set("filter", "changedVal");
      emitSpy.mockClear();

      store.reset();

      expect(store.get("filter")?.value).toBe("defaultVal");

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "reset",
          touched: ["filter"],
        })
      );
    });

    it("should reset state from dictionary and emit 'reset'", () => {
      store.register(createTestField("category", "default"));
      emitSpy.mockClear();

      const newValues = { category: "fantasy" };
      const result = store.reset(newValues);

      expect(store.get("category")?.value).toBe("fantasy");

      expect(result).toBeDefined();

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "reset",
          touched: ["category"],
        })
      );
    });

    it("should NOT reset if values are identical", () => {
      store.register(createTestField("category", "default"));
      emitSpy.mockClear();

      const result = store.reset({ category: "default" });

      expect(result).toBeUndefined();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should clean the entire state", () => {
      store.register(createTestField("temp", "data"));

      store.clean();

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: null,
          touched: [],
        })
      );
    });
  });

  describe("3. Persistence (Rehydrate/Persist)", () => {
    it("should write to persistence and emit 'persist' on persist()", () => {
      store.register(createTestField("q", "test"));
      emitSpy.mockClear();

      store.persist();

      expect(persistence.write).toHaveBeenCalledWith(expect.objectContaining({ q: "test" }), expect.any(Array));

      expect(emitSpy).toHaveBeenCalledWith("persist", expect.anything());
    });

    it("should rehydrate from persistence and emit change", async () => {
      store.register(createTestField("category", "books"));
      emitSpy.mockClear();

      persistence.read = vi.fn().mockReturnValue({ category: "movies" });

      await store.rehydrate();

      expect(store.get("category")?.value).toBe("movies");

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "rehydrate",
          touched: ["category"],
        })
      );
    });

    it("should subscribe to persistence changes", () => {
      const persistenceUnsub = vi.fn();
      persistence.subscribe = vi.fn().mockReturnValue(persistenceUnsub);

      const unsub = store.onPersistenceChange(vi.fn());

      expect(persistence.subscribe).toHaveBeenCalled();

      unsub();
      expect(persistenceUnsub).toHaveBeenCalled();
    });
  });

  describe("4. React Integration", () => {
    it("should trigger React subscribers on change", () => {
      const reactListener = vi.fn();
      const unsubscribe = store.subscribe(reactListener);

      store.register(createTestField("test", "A"));

      expect(reactListener).toHaveBeenCalled();

      store.set("test", "B");
      expect(reactListener).toHaveBeenCalledTimes(2);

      unsubscribe();
    });

    it("should provide a stable selector for React via listen()", () => {
      store.register(createTestField("reactive", "initial"));
      const selector = store.listen("reactive");

      expect(selector).toBeTypeOf("function");
      expect(selector()?.value).toBe("initial");

      store.set("reactive", "changed");

      expect(selector()?.value).toBe("changed");
    });
  });
});
