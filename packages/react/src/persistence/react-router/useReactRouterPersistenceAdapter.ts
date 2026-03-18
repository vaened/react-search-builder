import { useEffect, useMemo, useRef } from "react";
import type { PrimitiveFilterDictionary } from "../../field";
import type { PersistenceAdapter } from "../PersistenceAdapter";

export type ReactRouterLocationLike = {
  pathname: string;
  search: string;
  hash?: string;
  key?: string;
};

export type ReactRouterNavigateOptions = {
  replace?: boolean;
  state?: unknown;
};

export type ReactRouterNavigateLike = (to: string, options?: ReactRouterNavigateOptions) => void | Promise<void>;

export type UseReactRouterPersistenceAdapterOptions = {
  location: ReactRouterLocationLike;
  navigate: ReactRouterNavigateLike;
  replace?: boolean;
  state?: unknown;
};

export function useReactRouterPersistenceAdapter({
  location,
  navigate,
  replace = false,
  state,
}: UseReactRouterPersistenceAdapterOptions): PersistenceAdapter {
  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);
  const listenersRef = useRef(new Set<() => void>());
  const previousSignatureRef = useRef<string | null>(null);

  locationRef.current = location;
  navigateRef.current = navigate;

  const locationSignature = useMemo(
    () => [location.pathname, location.search, location.hash ?? "", location.key ?? ""].join("|"),
    [location.pathname, location.search, location.hash, location.key]
  );

  useEffect(() => {
    if (previousSignatureRef.current === null) {
      previousSignatureRef.current = locationSignature;
      return;
    }

    if (previousSignatureRef.current === locationSignature) {
      return;
    }

    previousSignatureRef.current = locationSignature;
    listenersRef.current.forEach((listener) => listener());
  }, [locationSignature]);

  return useMemo<PersistenceAdapter>(
    () => ({
      read: () => readFromSearch(locationRef.current.search),
      write: (values, whitelist) => {
        const currentLocation = locationRef.current;
        const currentParams = new URLSearchParams(currentLocation.search);
        const newParams = new URLSearchParams();

        if (whitelist) {
          currentParams.forEach((value, key) => {
            if (!whitelist.includes(normalizeParameter(key))) {
              newParams.append(key, value);
            }
          });
        }

        Object.entries(values).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            const uniqueValues = [...new Set(value)].sort();

            uniqueValues.forEach((item) => {
              if (isValidValue(item)) {
                newParams.append(convertToArrayParameter(key), String(item));
              }
            });

            return;
          }

          if (isValidValue(value)) {
            newParams.append(key, String(value));
          }
        });

        const nextSearch = newParams.toString();
        const previousSearch = currentParams.toString();

        if (nextSearch === previousSearch) {
          return;
        }

        const pathname = currentLocation.pathname;
        const hash = currentLocation.hash ?? "";
        const target = `${pathname}${nextSearch ? `?${nextSearch}` : ""}${hash}`;

        navigateRef.current(target, {
          replace,
          state,
        });
      },
      subscribe: (callback) => {
        listenersRef.current.add(callback);
        return () => listenersRef.current.delete(callback);
      },
    }),
    [replace, state]
  );
}

function readFromSearch(search: string): PrimitiveFilterDictionary {
  const params = new URLSearchParams(search);
  const keys = new Set(params.keys());
  const values: PrimitiveFilterDictionary = {};

  keys.forEach((key) => {
    if (isArrayParameter(key)) {
      const parameter = convertToScalarParameter(key);
      values[parameter] = params.getAll(key);
      return;
    }

    values[key] = params.get(key) as string;
  });

  return values;
}

function convertToScalarParameter(parameter: string): string {
  return parameter.slice(0, -2);
}

function convertToArrayParameter(parameter: string): string {
  return `${parameter}[]`;
}

function normalizeParameter(parameter: string): string {
  return isArrayParameter(parameter) ? convertToScalarParameter(parameter) : parameter;
}

function isArrayParameter(parameter: string): boolean {
  return parameter.endsWith("[]");
}

function isValidValue(value: unknown) {
  return value !== undefined && value !== null;
}
