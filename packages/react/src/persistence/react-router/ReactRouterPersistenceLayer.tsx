import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SearchBuilderPersistenceLayerProps as SearchBuilderPersistenceRegistrationProps } from "../../contexts/SearchBuilderConfig";
import { createNavigationChannel, type NavigationOptions } from "../navigation-channel";
import { createReactRouterPersistenceAdapter } from "./adapter";

export interface ReactRouterPersistenceLayerProps extends SearchBuilderPersistenceRegistrationProps, NavigationOptions {}

export function ReactRouterPersistenceLayer({
  registerDefaultPersistence,
  unregisterDefaultPersistence,
  replace = false,
  state,
}: ReactRouterPersistenceLayerProps): null {
  const location = useLocation();
  const navigate = useNavigate();
  const channel = useMemo(() => createNavigationChannel(location, navigate), []);

  useEffect(() => {
    channel.refresh({ location, navigate });
  }, [channel, location, navigate]);

  const createPersistence = useCallback(() => {
    return createReactRouterPersistenceAdapter({
      channel,
      replace,
      state,
    });
  }, [channel, replace, state]);

  useEffect(() => {
    registerDefaultPersistence(createPersistence);
    return () => unregisterDefaultPersistence();
  }, [createPersistence, registerDefaultPersistence, unregisterDefaultPersistence]);

  return null;
}
