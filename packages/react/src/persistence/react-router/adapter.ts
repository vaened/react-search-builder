import type { PersistenceAdapter } from "../PersistenceAdapter";
import { createSearchParams, readDictionaryFromSearch } from "../url-params";

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

type ReactRouterPersistenceAdapterFactoryOptions = {
  getLocation: () => ReactRouterLocationLike;
  getNavigate: () => ReactRouterNavigateLike;
  getListeners: () => Set<() => void>;
  replace: boolean;
  state?: unknown;
};

export function createReactRouterPersistenceAdapter({
  getLocation,
  getNavigate,
  getListeners,
  replace,
  state,
}: ReactRouterPersistenceAdapterFactoryOptions): PersistenceAdapter {
  return {
    read: () => readDictionaryFromSearch(getLocation().search),
    write: (values, whitelist) => {
      const currentLocation = getLocation();
      const currentParams = new URLSearchParams(currentLocation.search);
      const nextParams = createSearchParams(values, currentLocation.search, whitelist);

      const nextSearch = nextParams.toString();
      const previousSearch = currentParams.toString();

      if (nextSearch === previousSearch) {
        return;
      }

      const pathname = currentLocation.pathname;
      const hash = currentLocation.hash ?? "";
      const target = `${pathname}${nextSearch ? `?${nextSearch}` : ""}${hash}`;

      getNavigate()(target, {
        replace,
        state,
      });
    },
    subscribe: (callback) => {
      const listeners = getListeners();
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}
