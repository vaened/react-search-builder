import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SearchBuilderPersistenceContext, type SearchBuilderPersistenceLayerProps } from "../PersistenceContext";
import { createNavigationChannel, type NavigationOptions } from "../navigation-channel";
import { createReactRouterPersistenceAdapter } from "./adapter";

export interface ReactRouterPersistenceLayerProps extends SearchBuilderPersistenceLayerProps, NavigationOptions {}

export function ReactRouterPersistenceLayer({ children, replace = false, state }: ReactRouterPersistenceLayerProps): React.ReactElement {
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

  return <SearchBuilderPersistenceContext.Provider value={createPersistence}>{children}</SearchBuilderPersistenceContext.Provider>;
}
