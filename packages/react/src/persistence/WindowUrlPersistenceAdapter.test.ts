/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WindowUrlPersistenceAdapter } from "./WindowUrlPersistenceAdapter";

describe("UrlPersistenceAdapter", () => {
  let adapter: WindowUrlPersistenceAdapter;

  const setUrl = (search: string) => {
    window.history.replaceState({}, "", `/${search}`);
  };

  beforeEach(() => {
    adapter = new WindowUrlPersistenceAdapter();
    setUrl("");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Reading from URL (read)", () => {
    it("should parse simple scalar values", () => {
      setUrl("?q=hello&page=1");

      const values = adapter.read();

      expect(values).toEqual({
        q: "hello",
        page: "1",
      });
    });

    it("should parse arrays with brackets syntax []", () => {
      setUrl("?tags[]=news&tags[]=sports");

      const values = adapter.read();

      expect(values).toEqual({
        tags: ["news", "sports"],
      });
    });

    it("should handle mixed scalar and array values", () => {
      setUrl("?q=search&categories[]=a&categories[]=b");

      const values = adapter.read();

      expect(values).toEqual({
        q: "search",
        categories: ["a", "b"],
      });
    });

    it("should return empty object for empty URL", () => {
      setUrl("");
      expect(adapter.read()).toEqual({});
    });
  });

  describe("2. Writing to URL (write)", () => {
    it("should write simple values to URL params", () => {
      adapter.write({ q: "test", sort: "desc" });

      expect(window.location.search).toBe("?q=test&sort=desc");
    });

    it("should write arrays using brackets syntax []", () => {
      adapter.write({ status: ["active", "pending"] });

      const params = new URLSearchParams(window.location.search);
      expect(params.getAll("status[]")).toEqual(["active", "pending"]);
    });

    it("should preserve existing params NOT in the whitelist", () => {
      setUrl("?utm_source=google&existing=true");

      adapter.write({ q: "new" }, ["q"]);

      const params = new URLSearchParams(window.location.search);

      expect(params.get("q")).toBe("new");
      expect(params.get("utm_source")).toBe("google");
      expect(params.get("existing")).toBe("true");
    });

    it("should overwrite params that ARE in the whitelist", () => {
      setUrl("?q=old&other=keep");

      adapter.write({ q: "new" }, ["q"]);

      const params = new URLSearchParams(window.location.search);
      expect(params.get("q")).toBe("new");
      expect(params.get("other")).toBe("keep");
    });
  });

  describe("3. Reactivity (subscribe)", () => {
    it("should call callback when popstate event occurs (Browser Back Button)", () => {
      const callback = vi.fn();
      const unsubscribe = adapter.subscribe(callback);

      window.dispatchEvent(new PopStateEvent("popstate"));

      expect(callback).toHaveBeenCalled();

      unsubscribe();
    });
  });
});
