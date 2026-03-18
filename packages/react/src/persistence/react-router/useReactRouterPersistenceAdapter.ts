import { useEffect, useMemo, useRef } from "react";
import type { PersistenceAdapter } from "../PersistenceAdapter";
import { createReactRouterPersistenceAdapter } from "./adapter";
import type { UseReactRouterPersistenceAdapterOptions } from "./adapter";

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
    () =>
      createReactRouterPersistenceAdapter({
        getLocation: () => locationRef.current,
        getNavigate: () => navigateRef.current,
        getListeners: () => listenersRef.current,
        replace,
        state,
      }),
    [replace, state]
  );
}
