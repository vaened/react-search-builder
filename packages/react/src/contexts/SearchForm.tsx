/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import React, {
  cloneElement,
  ComponentProps,
  createContext,
  FormEventHandler,
  isValidElement,
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ValueFilterDictionary } from "../field";
import { useResolveFieldStoreInstance } from "../hooks/useResolveFieldStoreInstance";
import { CreateStoreOptions, FieldsCollection, FieldStore } from "../store";
import { SearchStateContextProvider } from "./SearchState";
import { SKIP_PERSISTENCE, useFormSubmit } from "./useFormSubmit";
import { useReadyState } from "./useReadyState";

type FormProps = {
  onSubmit?: FormEventHandler;
  children?: ReactNode;
  [key: string]: unknown;
};

type SubmitResult = void | boolean;

export interface SearchBuilderContextState {
  store: FieldStore;
  submitOnChange: boolean;
  isLoading: boolean;
  isFormReady: boolean;
  refresh: (params: ValueFilterDictionary) => void;
}

export type SearchFormProviderProps = {
  children: ReactNode;
  store?: FieldStore;
  loading?: boolean;
  manualStart?: boolean;
  autoStartDelay?: number;
  submitOnChange?: boolean;
  Container?: ReactElement<FormProps>;
  configuration?: CreateStoreOptions;
  onSearch?: (params: FieldsCollection) => SubmitResult | Promise<SubmitResult>;
  onChange?: (params: FieldsCollection) => void;
} & Omit<ComponentProps<"form">, "onSubmit" | "onChange">;

export const SearchBuilderContext = createContext<SearchBuilderContextState | undefined>(undefined);

export function SearchFormProvider({
  children,
  store: source,
  loading = false,
  manualStart,
  autoStartDelay = 200,
  submitOnChange = false,
  configuration,
  Container,
  onSearch,
  onChange,
  ...restOfProps
}: SearchFormProviderProps) {
  const store = useResolveFieldStoreInstance(source, configuration);

  const isHydrating = useSyncExternalStore(store.subscribe, store.isHydrating, store.isHydrating);
  const { isFormReady, markTimerAsCompleted } = useReadyState({ isReady: manualStart === true, isHydrating });
  const { isFormLoading, dispatch, performAutoSearch } = useFormSubmit({
    store,
    submitOnChange,
    isHydrating,
    manualStart,
    onSearch,
  });

  const isLoading = isFormLoading || loading;

  useEffect(() => {
    if (!isFormReady) {
      return;
    }

    const unsubscribe = store.onChange(({ collection, operation, touched, isHydrating }) => {
      if (operation === null) {
        return;
      }

      onChange?.(collection);
      performAutoSearch({ collection, touched, operation, isHydrating });
    });

    return () => unsubscribe();
  }, [isFormReady, performAutoSearch]);

  useEffect(() => {
    if (isFormReady) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch();
      markTimerAsCompleted();
    }, autoStartDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [store, isFormReady, autoStartDelay]);

  useEffect(() => {
    const unsubscribe = store.onRehydrated(({ touched }) => {
      if (touched.length === 0) {
        return;
      }

      dispatch(SKIP_PERSISTENCE);
    });

    return () => unsubscribe();
  }, [store]);

  const refresh = useCallback((dictionary: ValueFilterDictionary) => {
    const newFields = store.reset(dictionary);

    if (!newFields) {
      return;
    }

    dispatch(SKIP_PERSISTENCE);
  }, []);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      dispatch();
    },
    [dispatch]
  );

  const value = useMemo(
    () => ({
      store,
      isLoading,
      submitOnChange,
      isFormReady,
      refresh,
    }),
    [store, isLoading, submitOnChange, isFormReady, refresh]
  );

  return (
    <SearchBuilderContext.Provider value={value}>
      <SearchStateContextProvider store={store}>
        {isValidElement(Container) ? (
          cloneElement(Container, { onSubmit }, children)
        ) : (
          <form onSubmit={onSubmit} {...restOfProps}>
            {children}
          </form>
        )}
      </SearchStateContextProvider>
    </SearchBuilderContext.Provider>
  );
}

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
