/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { empty } from "../persistence";
import { createFieldStore } from "../store";
import { useFilterField } from "./useFilterField";

const createStore = () => createFieldStore({ persistence: empty() });

describe("useFilterField", () => {
  it("should register the field on mount", () => {
    const store = createStore();

    const { result } = renderHook(() =>
      useFilterField(store, {
        name: "username",
        type: "string",
        defaultValue: "guest",
      })
    );

    expect(result.current.value).toBe("guest");

    expect(store.get("username")?.value).toBe("guest");
  });

  it("should update the value when set() is called", () => {
    const store = createStore();

    const { result } = renderHook(() =>
      useFilterField(store, {
        name: "age",
        type: "number",
        defaultValue: 18 as number,
      })
    );

    act(() => {
      result.current.set(25);
    });

    expect(result.current.value).toBe(25);
    expect(store.get("age")?.value).toBe(25);
  });

  it("should react to external store changes", () => {
    const store = createStore();

    const { result } = renderHook(() =>
      useFilterField(store, {
        name: "status",
        type: "string",
        defaultValue: "pending",
      })
    );

    act(() => {
      store.set("status", "approved");
    });

    expect(result.current.value).toBe("approved");
  });

  it("should unregister the field on unmount", () => {
    const store = createStore();

    const { unmount } = renderHook(() =>
      useFilterField(store, {
        name: "temp",
        type: "string",
        defaultValue: "",
      })
    );

    expect(store.exists("temp")).toBe(true);

    unmount();

    expect(store.exists("temp")).toBe(false);
  });

  it("should handle complex types (arrays)", () => {
    const store = createStore();

    const { result } = renderHook(() =>
      useFilterField(store, {
        name: "tags",
        type: "string[]",
        defaultValue: [],
      })
    );

    act(() => {
      result.current.set(["react", "vitest"]);
    });

    expect(result.current.value).toEqual(["react", "vitest"]);
    expect(store.get("tags")?.value).toEqual(["react", "vitest"]);
  });

  it("should auto-resolve the correct serializer based on type", () => {
    const store = createStore();

    renderHook(() =>
      useFilterField(store, {
        name: "createdAt",
        type: "date",
        defaultValue: new Date(),
      })
    );

    const field = store.get("createdAt");

    expect(field?.serializer).toBeDefined();

    const testDate = new Date("2023-01-01");

    expect(field?.serializer?.serialize(testDate)).toBe("2023-01-01");
    expect(field?.serializer?.unserialize("2023-01-01")).toBeInstanceOf(Date);
  });

  it("should prefer custom serializer over auto-resolved one", () => {
    const store = createStore();

    const customSerializer = {
      serialize: (v: string) => `CUSTOM:${v}`,
      unserialize: (v: string) => v.replace("CUSTOM:", ""),
    };

    renderHook(() =>
      useFilterField(store, {
        name: "customField",
        type: "string",
        defaultValue: "test",
        serializer: customSerializer,
      })
    );

    const field = store.get("customField");

    expect(field?.serializer?.serialize("hello")).toBe("CUSTOM:hello");
    expect(field?.serializer?.unserialize("CUSTOM:world")).toBe("world");
  });
});
