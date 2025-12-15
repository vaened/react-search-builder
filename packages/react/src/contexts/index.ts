/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { createContext, useContext } from "react";
import type { ValueFilterDictionary } from "../field";
import type { FieldStore } from "../store";

export interface SearchBuilderContextState {
  store: FieldStore;
  submitOnChange: boolean;
  isLoading: boolean;
  isFormReady: boolean;
  refresh: (params: ValueFilterDictionary) => void;
}

export const SearchBuilderContext = createContext<SearchBuilderContextState | undefined>(undefined);

export const useSearchBuilderQuietly = (): SearchBuilderContextState | undefined => {
  return useContext(SearchBuilderContext);
};

export const useSearchBuilder = (): SearchBuilderContextState => {
  const context = useContext(SearchBuilderContext);

  if (context) {
    return context;
  }

  throw new Error(`
SEARCH CONTEXT MISSING
================================================================

PROBLEM: You are calling "useSearchBuilder()" (or a component that relies on it) 
outside of the <SearchForm /> provider hierarchy.

The component attempting to access search actions or configuration 
cannot find the required context.

SOLUTION: Wrap your component tree with the main provider:

  <SearchForm>
    <YourFieldComponent />  <-- Allows useSearchBuilder() here
  </SearchForm>

================================================================
    `);
};
