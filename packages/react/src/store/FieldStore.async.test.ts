/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Serializer } from "../field";
import { empty } from "../persistence";
import { createControlledPromise, nextTick } from "../test-utils";
import { SearchBuilderFieldValidator } from "../validations/SearchBuilderFieldValidator";
import { ErrorManager } from "./ErrorManager";
import { createEventEmitter } from "./event-emitter";
import { FieldStore } from "./FieldStore";
import { TaskMonitor } from "./TaskMonitor";

describe("Asynchronous FieldStore", () => {
  let store: FieldStore;
  let adapter: ReturnType<typeof empty>;

  beforeEach(() => {
    const emitter = createEventEmitter();
    const validator = new SearchBuilderFieldValidator();
    const errorManager = new ErrorManager();
    const tracker = new TaskMonitor();

    adapter = empty();

    vi.spyOn(adapter, "read").mockReturnValue({
      asyncField: "raw",
      demo: "raw",
      faultyField: "bad_data",
      slowField: "data",
    });

    store = new FieldStore(adapter, validator, errorManager, tracker, emitter);
  });

  describe("1. Hydration Flow & Semaphore", () => {
    it("should enter hydrating state when a field requires async unserialization", async () => {
      const { promise, resolve } = createControlledPromise<string>();

      const asyncSerializer: Serializer<string> = {
        serialize: (v) => v,
        unserialize: () => promise,
      };

      store.register({
        name: "asyncField",
        type: "string",
        value: "default",
        serializer: asyncSerializer,
      });

      expect(store.isHydrating()).toBe(true);
      expect(store.get("asyncField")?.value).toBe("default");
      expect(store.get("asyncField")?.isHydrating).toBe(true);

      resolve("resolved-value");
      await nextTick();

      expect(store.isHydrating()).toBe(false);
      expect(store.get("asyncField")?.value).toBe("resolved-value");
    });

    it("should queue operations while hydrating and execute them after hydration", async () => {
      const { promise, resolve } = createControlledPromise<string>();

      const asyncSerializer: Serializer<string> = {
        serialize: (v) => v,
        unserialize: () => promise,
      };

      store.register({
        name: "demo",
        type: "string",
        value: "initial",
        serializer: asyncSerializer,
      });

      expect(store.isHydrating()).toBe(true);

      const task = vi.fn();
      store.whenReady("test-task", task);

      expect(task).not.toHaveBeenCalled();

      resolve("final-value");
      await nextTick();

      expect(store.isHydrating()).toBe(false);
      expect(task).toHaveBeenCalled();
    });
  });

  describe("2. Edge Cases & Error Handling", () => {
    it("should handle Async Error: fallback to default value and release lock", async () => {
      const { promise, reject } = createControlledPromise<string>();

      const faultySerializer: Serializer<string> = {
        serialize: (v) => v,
        unserialize: () => promise,
      };

      store.register({
        name: "faultyField",
        type: "string",
        value: "default_fallback",
        serializer: faultySerializer,
      });

      expect(store.isHydrating()).toBe(true);

      reject(new Error("Network Error"));
      await nextTick();

      expect(store.isHydrating()).toBe(false);
      expect(store.get("faultyField")?.value).toBe("default_fallback");
    });

    it("should handle Unregister during Hydration: release lock immediately", async () => {
      const { promise } = createControlledPromise<string>();

      const slowSerializer: Serializer<string> = {
        serialize: (v) => v,
        unserialize: () => promise,
      };

      store.register({
        name: "slowField",
        type: "string",
        value: "default",
        serializer: slowSerializer,
      });

      expect(store.isHydrating()).toBe(true);

      store.unregister("slowField");

      expect(store.isHydrating()).toBe(false);
      expect(store.get("slowField")).toBeUndefined();
    });
  });

  describe("3. Rehydration from persistence updates", () => {
    it("should enter hydrating state when rehydrating triggers an async update", async () => {
      const { promise, resolve } = createControlledPromise<string>();

      const hybridSerializer = {
        serialize: (v) => v,
        unserialize: (v) => (v === "new_url_value" ? promise : v),
      } as Serializer<string>;

      store.register({
        name: "asyncField",
        type: "string",
        value: "default",
        serializer: hybridSerializer,
      });

      expect(store.isHydrating()).toBe(false);
      expect(store.get("asyncField")?.value).toBe("raw");

      vi.spyOn(adapter, "read").mockReturnValue({ asyncField: "new_url_value" });

      const rehydrationProcess = store.rehydrate();

      await nextTick();

      expect(store.isHydrating()).toBe(true);
      expect(store.get("asyncField")?.isHydrating).toBe(true);

      expect(store.get("asyncField")?.value).toBe("raw");

      resolve("resolved_value");
      await nextTick();
      await rehydrationProcess;

      expect(store.isHydrating()).toBe(false);
      expect(store.get("asyncField")?.value).toBe("resolved_value");
    });
  });
});
