/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type { PrimitiveFilterDictionary } from "../field";
import type { PersistenceAdapter } from "./PersistenceAdapter";

export class WindowUrlPersistenceAdapter implements PersistenceAdapter {
  constructor() {
    if (typeof window === "undefined") {
      throw new Error("WindowUrlPersistenceAdapter can only be used in a browser environment");
    }
  }

  read = (): PrimitiveFilterDictionary => {
    const params = new URLSearchParams(window.location.search);
    const keys = new Set(params.keys());
    const values: PrimitiveFilterDictionary = {};

    keys.forEach((key) => {
      if (this.#isArray(key)) {
        const parameter = this.#convertToScalar(key);
        values[parameter] = params.getAll(key);
      } else {
        values[key] = params.get(key) as string;
      }
    });

    return values;
  };

  write = (values: PrimitiveFilterDictionary, whitelist?: string[]) => {
    const currentParams = new URLSearchParams(window.location.search);
    const newParams = new URLSearchParams();

    if (whitelist) {
      currentParams.forEach((value, key) => {
        if (!whitelist.includes(this.#normalize(key))) {
          newParams.append(key, value);
        }
      });
    }

    Object.entries(values).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        const values = [...new Set(value)].sort();

        values.forEach((v) => {
          if (!this.#isValid(v)) {
            return;
          }

          newParams.append(this.#convertToArray(key), String(v));
        });

        return;
      }

      if (this.#isValid(value)) {
        newParams.append(key, String(value));
      }
    });

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

  #convertToScalar = (parameter: string): string => {
    return parameter.slice(0, -2);
  };

  #convertToArray = (parameter: string): string => {
    return `${parameter}[]`;
  };

  #normalize = (parameter: string): string => {
    return this.#isArray(parameter) ? this.#convertToScalar(parameter) : parameter;
  };

  #isArray = (parameter: string): boolean => {
    return parameter.endsWith("[]");
  };

  #isValid = (value: unknown) => {
    return value !== undefined && value !== null;
  };
}
