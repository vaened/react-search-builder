/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { createContext, ReactNode, useContext, useSyncExternalStore } from "react";
import { FieldStore, FieldStoreState } from "../store";

export type SearchStateContextState = {
  store: FieldStore;
  children: ReactNode;
};

export interface SearchState {
  state: FieldStoreState;
}

export const SearchStateContext = createContext<SearchState | undefined>(undefined);

export function SearchStateContextProvider({ store, children }: SearchStateContextState) {
  const state = useSyncExternalStore(store.subscribe, store.state, store.state);
  return <SearchStateContext.Provider value={{ state }}>{children}</SearchStateContext.Provider>;
}

export const useSearchState = (): SearchState => {
  const context = useContext(SearchStateContext);

  if (context) {
    return context;
  }

  throw new Error(`
SEARCH STATE CONTEXT MISSING
================================================================

PROBLEM: You are calling "useSearchState()" outside of the <SearchForm /> provider.

This hook subscribes to store updates (values, active filters), 
and it requires the SearchStateContext to function.

SOLUTION: Ensure this component is a child of <SearchForm>:

  <SearchForm>
     <YourFieldComponent /> <-- Allows useSearchState() here
  </SearchForm>

================================================================
    `);
};
