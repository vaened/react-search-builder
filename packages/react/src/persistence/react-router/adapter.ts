import type { PersistenceAdapter } from "../PersistenceAdapter";
import { createSearchParams, readDictionaryFromSearch } from "../url-params";
import type { NavigationChannel } from "../navigation-channel";

type ReactRouterPersistenceAdapterFactoryOptions = {
  channel: NavigationChannel;
  replace: boolean;
  state?: unknown;
};

export function createReactRouterPersistenceAdapter({
  channel,
  replace,
  state,
}: ReactRouterPersistenceAdapterFactoryOptions): PersistenceAdapter {
  return {
    read: () => readDictionaryFromSearch(channel.readLocation().search),
    write: (values, whitelist) => {
      const currentLocation = channel.readLocation();
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

      channel.navigate(target, {
        replace,
        state,
      });
    },
    subscribe: channel.subscribe,
  };
}
