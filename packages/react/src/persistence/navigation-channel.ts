export type NavigationLocation = {
  pathname: string;
  search: string;
  hash?: string;
  key?: string;
};

export type NavigationOptions = {
  replace?: boolean;
  state?: unknown;
};

export type NavigateFunction = (to: string, options?: NavigationOptions) => void | Promise<void>;

export type NavigationChannel = {
  readLocation: () => NavigationLocation;
  navigate: (to: string, options?: NavigationOptions) => void | Promise<void>;
  refresh: (input: { location: NavigationLocation; navigate: NavigateFunction }) => void;
  subscribe: (callback: () => void) => () => void;
};

export function createNavigationChannel(location: NavigationLocation, navigate: NavigateFunction): NavigationChannel {
  let currentLocation = location;
  let currentNavigate = navigate;
  let previousSignature = createLocationSignature(location);
  const listeners = new Set<() => void>();

  return {
    readLocation: () => currentLocation,
    navigate: (to, options) => currentNavigate(to, options),
    refresh: ({ location: nextLocation, navigate: nextNavigate }) => {
      currentLocation = nextLocation;
      currentNavigate = nextNavigate;

      const nextSignature = createLocationSignature(nextLocation);

      if (nextSignature === previousSignature) {
        return;
      }

      previousSignature = nextSignature;
      listeners.forEach((listener) => listener());
    },
    subscribe: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}

function createLocationSignature(location: NavigationLocation): string {
  return [location.pathname, location.search, location.hash ?? "", location.key ?? ""].join("|");
}
