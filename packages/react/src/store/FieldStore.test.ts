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
      expect(store.get("search")?.submitted).toBe("");
      expect(store.get("search")?.isDirty).toBe(false);

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
      expect(store.get("query")?.submitted).toBe("initial");
      expect(store.get("query")?.isDirty).toBe(true);

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "set",
          touched: ["query"],
          context: expect.objectContaining({
            autoSubmit: true,
          }),
        })
      );
    });

    it("should allow set() without auto-submit for a single update", () => {
      store.register(createTestField("query", "initial"));
      emitSpy.mockClear();

      store.set("query", "updated", { autoSubmit: false });

      expect(store.get("query")?.value).toBe("updated");

      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "set",
          touched: ["query"],
          context: expect.objectContaining({
            autoSubmit: false,
          }),
        })
      );
    });

    it("should batch multiple updates into a single change event", () => {
      store.register(createTestField("page", "2"));
      store.register(createTestField("query", "initial"));
      emitSpy.mockClear();

      const touched = store.batch(
        (transaction) => {
          transaction.set("page", "1");
          transaction.set("query", "updated");
        },
        { autoSubmit: true }
      );

      expect(store.get("page")?.value).toBe("1");
      expect(store.get("query")?.value).toBe("updated");
      expect(store.get("page")?.submitted).toBe("2");
      expect(store.get("query")?.submitted).toBe("initial");
      expect(store.get("page")?.isDirty).toBe(true);
      expect(store.get("query")?.isDirty).toBe(true);
      expect(touched).toEqual(["page", "query"]);
      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(
        "change",
        expect.objectContaining({
          operation: "batch",
          touched: ["page", "query"],
          context: expect.objectContaining({
            autoSubmit: true,
          }),
        })
      );
    });

    it("should NOT emit a batch event when no queued value changes", () => {
      store.register(createTestField("query", "same"));
      emitSpy.mockClear();

      const touched = store.batch((transaction) => {
        transaction.set("query", "same");
      });

      expect(touched).toBeUndefined();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should NOT emit event if value is identical", () => {
      store.register(createTestField("query", "same"));
      emitSpy.mockClear();

      store.set("query", "same");

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it("should expose only fields that remain dirty", () => {
      store.register(createTestField("page", "1"));
      store.register(createTestField("query", ""));

      store.set("query", "john");
      store.set("page", "2");

      expect(store.dirtyFields()).toEqual(["page", "query"]);

      store.markSubmitted({ query: "john" });

      expect(store.dirtyFields()).toEqual(["page"]);

      store.set("page", "1");

      expect(store.dirtyFields()).toEqual([]);
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

    it("should mark current values as submitted explicitly", () => {
      store.register(createTestField("query", "initial"));
      store.set("query", "updated");

      store.markSubmitted({ query: "updated" });

      expect(store.get("query")?.value).toBe("updated");
      expect(store.get("query")?.submitted).toBe("updated");
      expect(store.get("query")?.isDirty).toBe(false);
    });

    it("should reset isDirty when value returns to submitted", () => {
      store.register(createTestField("query", "initial"));

      store.set("query", "updated");
      expect(store.get("query")?.isDirty).toBe(true);

      store.set("query", "initial");
      expect(store.get("query")?.isDirty).toBe(false);
    });

    it("should keep isDirty unchanged when a partial submitted snapshot does not include the field", () => {
      store.register(createTestField("query", "initial"));
      store.set("query", "updated");

      store.markSubmitted({});

      expect(store.get("query")?.submitted).toBe("initial");
      expect(store.get("query")?.isDirty).toBe(true);
    });

    it("should report whether the store has dirty fields", () => {
      store.register(createTestField("query", "initial"));

      expect(store.hasDirtyFields()).toBe(false);

      store.set("query", "updated");
      expect(store.hasDirtyFields()).toBe(true);

      store.markSubmitted({ query: "updated" });
      expect(store.hasDirtyFields()).toBe(false);
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

      const unsub = store.onRehydrated(vi.fn());

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
