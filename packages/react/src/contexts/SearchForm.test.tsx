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
import { SearchBuilderContextState, SearchFormProvider, useSearchBuilder } from "./SearchForm";

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
        <SearchFormProvider store={store} onSearch={onSearch} autoStartDelay={autoStartDelay}>
          <div />
        </SearchFormProvider>
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
        <SearchFormProvider store={store} onSearch={onSearch} manualStart={true} autoStartDelay={autoStartDelay}>
          <div />
        </SearchFormProvider>
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
        <SearchFormProvider store={store} manualStart>
          <TestInspector onState={inspector} />
        </SearchFormProvider>
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
        <SearchFormProvider store={store} onSearch={onSearch} autoStartDelay={autoStartDelay} manualStart>
          <TestInspector onState={inspector} />
          <button type="submit" data-testid="submit">
            Search
          </button>
        </SearchFormProvider>
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("submit"));
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
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={true} manualStart>
          <div />
        </SearchFormProvider>
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
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={false} manualStart>
          <div />
        </SearchFormProvider>
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
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={false} manualStart>
          <div />
        </SearchFormProvider>
      );

      await act(async () => {
        store.set("category", "books");
      });

      expect(onSearch).toHaveBeenCalled();
    });

    it("should NOT auto-submit a single set() call when { autoSubmit: false } is provided", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      store.register({ name: "q", type: "string", value: "", submittable: true });

      render(
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={true} manualStart>
          <div />
        </SearchFormProvider>
      );

      await act(async () => {
        store.set("q", "first", { autoSubmit: false });
      });

      expect(onSearch).not.toHaveBeenCalled();

      await act(async () => {
        store.set("q", "second");
      });

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it("should skip auto-submit for submittable field when set() receives { autoSubmit: false }", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      store.register({
        name: "category",
        type: "string",
        value: "",
        submittable: true,
      });

      render(
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={false} manualStart>
          <div />
        </SearchFormProvider>
      );

      await act(async () => {
        store.set("category", "books", { autoSubmit: false });
      });

      expect(onSearch).not.toHaveBeenCalled();
    });

    it("should submit a batch once when { autoSubmit: true } is provided", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      store.register({ name: "page", type: "number", value: 3 });
      store.register({ name: "q", type: "string", value: "" });

      render(
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={false} manualStart>
          <div />
        </SearchFormProvider>
      );

      await act(async () => {
        store.batch(
          (transaction) => {
            transaction.set("page", 1);
            transaction.set("q", "hello");
          },
          { autoSubmit: true }
        );
      });

      expect(store.get("page")?.value).toBe(1);
      expect(store.get("q")?.value).toBe("hello");
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch.mock.calls[0]?.[0].toValues()).toEqual(
        expect.objectContaining({
          page: 1,
          q: "hello",
        })
      );
    });

    it("should NOT auto-submit a batch by default", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      store.register({ name: "page", type: "number", value: 2 });
      store.register({ name: "q", type: "string", value: "" });

      render(
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={true} manualStart>
          <div />
        </SearchFormProvider>
      );

      await act(async () => {
        store.batch((transaction) => {
          transaction.set("page", 1);
          transaction.set("q", "hello");
        });
      });

      expect(store.get("page")?.value).toBe(1);
      expect(store.get("q")?.value).toBe("hello");
      expect(onSearch).not.toHaveBeenCalled();
    });

    it("should normalize the final payload in beforeSubmit before searching and persisting", async () => {
      const write = vi.fn();
      const onSearch = vi.fn();
      const beforeSubmit = vi.fn(({ dirtyFields, transaction }) => {
        if (dirtyFields.includes("q")) {
          transaction.set("page", 1);
        }
      });
      const store = createFieldStore({
        persistence: {
          read: () => ({}),
          write,
          subscribe: () => () => {},
        },
      });

      store.register({ name: "page", type: "number", value: 3 });
      store.register({ name: "q", type: "string", value: "" });

      render(
        <SearchFormProvider
          store={store}
          onSearch={onSearch}
          beforeSubmit={beforeSubmit}
          submitOnChange={true}
          manualStart>
          <div />
        </SearchFormProvider>
      );

      await act(async () => {
        store.set("q", "hello");
      });

      expect(beforeSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          dirtyFields: ["q"],
          trigger: "set",
        })
      );
      expect(store.get("page")?.value).toBe(1);
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch.mock.calls[0]?.[0].toValues()).toEqual(
        expect.objectContaining({
          page: 1,
          q: "hello",
        })
      );
      expect(write).toHaveBeenCalledWith(expect.objectContaining({ page: "1", q: "hello" }), expect.any(Array));
    });

    it("should accumulate changed fields until manual submit and expose them to beforeSubmit", async () => {
      const onSearch = vi.fn();
      const beforeSubmit = vi.fn(({ dirtyFields, transaction }) => {
        if (dirtyFields.some((name: string) => name !== "page")) {
          transaction.set("page", 1);
        }
      });
      const store = createFieldStore({ persistInUrl: false });

      store.register({ name: "page", type: "number", value: 5 });
      store.register({ name: "q", type: "string", value: "" });
      store.register({ name: "status", type: "string", value: "" });

      render(
        <SearchFormProvider
          store={store}
          onSearch={onSearch}
          beforeSubmit={beforeSubmit}
          submitOnChange={false}
          manualStart>
          <button type="submit">Search</button>
        </SearchFormProvider>
      );

      await act(async () => {
        store.set("q", "john");
        store.set("status", "active");
      });

      await act(async () => {
        fireEvent.click(screen.getByText("Search"));
      });

      expect(beforeSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          dirtyFields: expect.arrayContaining(["q", "status"]),
          trigger: "set",
        })
      );
      expect(store.get("page")?.value).toBe(1);
      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch.mock.calls[0]?.[0].toValues()).toEqual(
        expect.objectContaining({
          page: 1,
          q: "john",
          status: "active",
        })
      );
    });
  });

  describe("4. Manual Actions & Refresh", () => {
    it("should sync submitted values after a successful search", async () => {
      const onSearch = vi.fn();
      const store = createFieldStore({ persistInUrl: false });

      store.register({ name: "q", type: "string", value: "" });

      render(
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={true} manualStart>
          <div />
        </SearchFormProvider>
      );

      await act(async () => {
        store.set("q", "hello");
      });

      expect(store.get("q")?.value).toBe("hello");
      expect(store.get("q")?.submitted).toBe("hello");
      expect(store.get("q")?.isDirty).toBe(false);
    });

    it("should NOT sync submitted values when search returns false", async () => {
      const onSearch = vi.fn().mockReturnValue(false);
      const store = createFieldStore({ persistInUrl: false });

      store.register({ name: "q", type: "string", value: "" });

      render(
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={true} manualStart>
          <div />
        </SearchFormProvider>
      );

      await act(async () => {
        store.set("q", "hello");
      });

      expect(store.get("q")?.value).toBe("hello");
      expect(store.get("q")?.submitted).toBe("");
      expect(store.get("q")?.isDirty).toBe(true);
    });

    it("should sync submitted with the successful submit snapshot, not with later local edits", async () => {
      const { promise, resolve } = createControlledPromise<void>();
      const onSearch = vi.fn().mockReturnValue(promise);
      const store = createFieldStore({ persistInUrl: false });

      store.register({ name: "q", type: "string", value: "" });

      render(
        <SearchFormProvider store={store} onSearch={onSearch} submitOnChange={true} manualStart>
          <div />
        </SearchFormProvider>
      );

      await act(async () => {
        store.set("q", "foo");
      });

      await act(async () => {
        store.set("q", "bar", { autoSubmit: false });
      });

      await act(async () => {
        resolve();
      });

      expect(onSearch).toHaveBeenCalledTimes(1);
      expect(onSearch.mock.calls[0]?.[0].toValues()).toEqual(
        expect.objectContaining({
          q: "foo",
        })
      );
      expect(store.get("q")?.value).toBe("bar");
      expect(store.get("q")?.submitted).toBe("foo");
      expect(store.get("q")?.isDirty).toBe(true);
    });

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
        <SearchFormProvider store={store} onSearch={onSearch} manualStart>
          <Consumer />
        </SearchFormProvider>
      );

      await act(async () => {
        refreshFn!({ page: 2 });
      });

      expect(store.get("page")?.value).toBe(2);
      expect(onSearch).toHaveBeenCalled();
    });
  });
});
