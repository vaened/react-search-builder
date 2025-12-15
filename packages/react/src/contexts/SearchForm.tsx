/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import React, {
  cloneElement,
  ComponentProps,
  FormEventHandler,
  isValidElement,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { SearchBuilderContext } from ".";
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

export type SearchFormProps = {
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

export function SearchForm({
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
}: SearchFormProps) {
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

export default SearchForm;
