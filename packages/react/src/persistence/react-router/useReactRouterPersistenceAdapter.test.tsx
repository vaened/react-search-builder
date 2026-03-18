import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useReactRouterPersistenceAdapter, type ReactRouterLocationLike } from "./useReactRouterPersistenceAdapter";

const createLocation = (search = "", pathname = "/search", hash = ""): ReactRouterLocationLike => ({
  pathname,
  search,
  hash,
});

describe("useReactRouterPersistenceAdapter", () => {
  it("should read scalar and array values from the current location", () => {
    const navigate = vi.fn();
    const { result } = renderHook(() =>
      useReactRouterPersistenceAdapter({
        location: createLocation("?q=hello&status[]=active&status[]=pending"),
        navigate,
      })
    );

    expect(result.current.read()).toEqual({
      q: "hello",
      status: ["active", "pending"],
    });
  });

  it("should write a new location using navigate", () => {
    const navigate = vi.fn();
    const { result } = renderHook(() =>
      useReactRouterPersistenceAdapter({
        location: createLocation("?utm=google", "/customers", "#summary"),
        navigate,
      })
    );

    act(() => {
      result.current.write({ q: "john", status: ["pending", "active"] }, ["q", "status"]);
    });

    expect(navigate).toHaveBeenCalledWith("/customers?utm=google&q=john&status%5B%5D=active&status%5B%5D=pending#summary", {
      replace: false,
      state: undefined,
    });
  });

  it("should notify subscribers when the router location changes", async () => {
    const navigate = vi.fn();
    const callback = vi.fn();

    const { result, rerender } = renderHook(
      ({ location }) =>
        useReactRouterPersistenceAdapter({
          location,
          navigate,
        }),
      {
        initialProps: {
          location: createLocation("?q=one"),
        },
      }
    );

    const unsubscribe = result.current.subscribe(callback);

    rerender({
      location: createLocation("?q=two"),
    });

    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    });

    unsubscribe();
  });

  it("should not notify subscribers on the initial render", async () => {
    const navigate = vi.fn();
    const callback = vi.fn();

    const { result } = renderHook(() =>
      useReactRouterPersistenceAdapter({
        location: createLocation("?q=one"),
        navigate,
      })
    );

    result.current.subscribe(callback);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(callback).not.toHaveBeenCalled();
  });
});
