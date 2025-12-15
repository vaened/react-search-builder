/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrimitiveValue, ValueFilterDictionary } from "../field";
import { PersistenceAdapter } from "../persistence/PersistenceAdapter";
import { createFieldStore } from "../store";
import { createControlledPromise } from "../test-utils";
import { SearchBuilderContextState, SearchForm, useSearchBuilder } from "./SearchForm";

function TestInspector({ onState }: { onState: (state: SearchBuilderContextState) => void }) {
  const context = useSearchBuilder();
  onState(context);
  return null;
}

const autoStartDelay = 200;

const mockPersistence = (initialData: Record<string, PrimitiveValue> = {}): PersistenceAdapter => ({
  read: () => initialData,
  write: () => {},
  subscribe: () => () => {},
});

describe("SearchForm Integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("1. Initialization & Auto-Start", () => {
    it("should trigger auto-search on mount (Default Behavior)", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      render(
        <SearchForm store={store} onSearch={onSearch} autoStartDelay={autoStartDelay}>
          <div />
        </SearchForm>
      );

      expect(onSearch).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(autoStartDelay);
      });

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it("should NOT trigger search on mount if 'manualStart' is true", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      render(
        <SearchForm store={store} onSearch={onSearch} manualStart={true} autoStartDelay={autoStartDelay}>
          <div />
        </SearchForm>
      );

      await act(async () => {
        vi.advanceTimersByTime(autoStartDelay);
      });

      expect(onSearch).not.toHaveBeenCalled();
    });
  });

  describe("2. Loading States", () => {
    it("should report isLoading=true while hydrating, then false", async () => {
      const { promise, resolve } = createControlledPromise<string>();

      const store = createFieldStore({
        persistence: mockPersistence({ asyncField: "raw_value" }),
      });

      await act(async () => {
        store.register({
          name: "asyncField",
          type: "string",
          value: "default" as string,
          serializer: { serialize: (v) => v, unserialize: () => promise },
        });
      });

      const inspector = vi.fn();

      render(
        <SearchForm store={store} manualStart>
          <TestInspector onState={inspector} />
        </SearchForm>
      );

      expect(inspector.mock.lastCall?.[0].isLoading).toBe(true);

      await act(async () => {
        resolve("loaded");
      });

      expect(inspector.mock.lastCall?.[0].isLoading).toBe(false);
    });

    it("should report isLoading=true during search execution", async () => {
      const { promise, resolve } = createControlledPromise<void>();
      const onSearch = vi.fn().mockReturnValue(promise);
      const store = createFieldStore({ persistInUrl: false });
      const inspector = vi.fn();

      render(
        <SearchForm store={store} onSearch={onSearch} autoStartDelay={autoStartDelay} manualStart>
          <TestInspector onState={inspector} />
          <button type="submit" data-testid="submit">
            Search
          </button>
        </SearchForm>
      );

      fireEvent.click(screen.getByTestId("submit"));

      await act(async () => {
        vi.advanceTimersByTime(autoStartDelay);
      });

      expect(inspector.mock.lastCall?.[0].isLoading).toBe(true);

      await act(async () => {
        resolve();
      });

      expect(inspector.mock.lastCall?.[0].isLoading).toBe(false);
    });
  });

  describe("3. Auto-Submit Logic", () => {
    it("should submit automatically when store changes if 'submitOnChange' is true", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      store.register({ name: "q", type: "string", value: "" });

      render(
        <SearchForm store={store} onSearch={onSearch} submitOnChange={true} manualStart>
          <div />
        </SearchForm>
      );

      await act(async () => {
        store.set("q", "hello");
      });

      expect(onSearch).toHaveBeenCalled();
      expect(store.get("q")?.value).toBe("hello");
    });

    it("should NOT submit when store changes if 'submitOnChange' is false", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      store.register({ name: "q", type: "string", value: "" });

      render(
        <SearchForm store={store} onSearch={onSearch} submitOnChange={false} manualStart>
          <div />
        </SearchForm>
      );

      await act(async () => {
        store.set("q", "hello");
      });

      expect(onSearch).not.toHaveBeenCalled();
    });

    it("should submit specific fields marked as 'submittable' even if global submitOnChange is false", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      store.register({
        name: "category",
        type: "string",
        value: "",
        submittable: true,
      });

      render(
        <SearchForm store={store} onSearch={onSearch} submitOnChange={false} manualStart>
          <div />
        </SearchForm>
      );

      await act(async () => {
        store.set("category", "books");
      });

      expect(onSearch).toHaveBeenCalled();
    });
  });

  describe("4. Manual Actions & Refresh", () => {
    it("should allow manual refresh via context which updates store and submits", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });
      let refreshFn: (data: ValueFilterDictionary) => void;

      function Consumer() {
        const { refresh } = useSearchBuilder();
        refreshFn = refresh;
        return null;
      }

      store.register({
        name: "page",
        type: "number",
        value: 1,
      });

      render(
        <SearchForm store={store} onSearch={onSearch} manualStart>
          <Consumer />
        </SearchForm>
      );

      await act(async () => {
        refreshFn!({ page: 2 });
      });

      expect(store.get("page")?.value).toBe(2);
      expect(onSearch).toHaveBeenCalled();
    });
  });
});
