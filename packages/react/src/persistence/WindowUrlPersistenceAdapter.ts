/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type { PrimitiveFilterDictionary } from "../field";
import type { PersistenceAdapter } from "./PersistenceAdapter";
import { createSearchParams, readDictionaryFromSearch } from "./url-params";

export class WindowUrlPersistenceAdapter implements PersistenceAdapter {
  constructor() {
    if (typeof window === "undefined") {
      throw new Error("WindowUrlPersistenceAdapter can only be used in a browser environment");
    }
  }

  read = (): PrimitiveFilterDictionary => {
    return readDictionaryFromSearch(window.location.search);
  };

  write = (values: PrimitiveFilterDictionary, whitelist?: string[]) => {
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = createSearchParams(values, window.location.search, whitelist);
    const newSearch = newParams.toString();
    const oldSearch = currentParams.toString();

    if (newSearch === oldSearch) {
      return;
    }

    const newPath = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
    window.history.pushState({ path: newPath }, "", newPath);
  };

  subscribe = (callback: () => void) => {
    window.addEventListener("popstate", callback);

    return () => {
      window.removeEventListener("popstate", callback);
    };
  };
}
