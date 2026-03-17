/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useCallback, useEffect, useRef } from "react";
import type { FilterName, FilterValue } from "../field";
import type { BeforeSubmit, BeforeSubmitContext } from "../store/configuration";
import { type FieldBatchTransaction, FieldOperation, FieldsCollection, FieldStore, FieldStoreState } from "../store";
import { useFormStatus } from "./useFormStatus";

export type SubmitResult = void | boolean;
export type Submit = (params: FieldsCollection) => SubmitResult | Promise<SubmitResult>;

export const SKIP_PERSISTENCE = false;

export type UseFormSubmitProps = {
  store: FieldStore;
  onSearch?: Submit;
  beforeSubmit?: BeforeSubmit;
  submitOnChange: boolean;
  isHydrating: boolean;
  manualStart?: boolean;
};

const forcedOperations: FieldOperation[] = ["flush", "batch"];

function isForcedOperation(operation: FieldOperation): boolean {
  return forcedOperations.includes(operation);
}

function isSubmittableOperation({ collection, touched, operation }: Pick<FieldStoreState, "collection" | "touched" | "operation">): boolean {
  if (operation !== "set") {
    return false;
  }

  return touched.some((name) => collection.get(name)?.submittable);
}

export function useFormSubmit({ store, submitOnChange, isHydrating, manualStart, onSearch, beforeSubmit }: UseFormSubmitProps) {
  const { isFormLoading, setLoadingStatus } = useFormStatus({ isHydrating, manualStart });
  const autoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelAutoSubmit = useCallback(() => {
    if (autoSubmitTimerRef.current === null) {
      return;
    }

    clearTimeout(autoSubmitTimerRef.current);
    autoSubmitTimerRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cancelAutoSubmit();
    };
  }, [cancelAutoSubmit]);

  const dispatch = useCallback(
    function (persist: boolean = true) {
      cancelAutoSubmit();

      store.whenReady("search-form", () => {
        const state = store.state();
        const queued = new Map<FilterName, FilterValue>();
        const transaction: FieldBatchTransaction = {
          set: (name, value) => {
            queued.set(name, value);
          },
        };
        const beforeSubmitContext: BeforeSubmitContext = {
          dirtyFields: store.dirtyFields(),
          trigger: state.operation,
          collection: store.collection(),
          transaction,
        };

        store.configuration().beforeSubmit?.(beforeSubmitContext);
        beforeSubmit?.(beforeSubmitContext);

        if (queued.size > 0) {
          store.batch((tx) => {
            queued.forEach((value, name) => {
              tx.set(name, value);
            });
          });
        }

        store.revalidate();

        if (store.hasErrors()) {
          return;
        }

        const submittedCollection = FieldsCollection.from(store.collection().toMap());
        const response = Promise.resolve(onSearch?.(submittedCollection));

        const loadingTimer = setTimeout(() => {
          setLoadingStatus(true);
        }, 200);

        response
          .then((result) => {
            if (result === false) {
              return;
            }

            const submittedValues = submittedCollection.toValues();
            store.markSubmitted(submittedValues);

            if (!persist) {
              return;
            }

            store.persist();
          })
          .finally(() => {
            clearTimeout(loadingTimer);
            setLoadingStatus(false);
          });
      });
    },
    [beforeSubmit, cancelAutoSubmit, onSearch, setLoadingStatus, store],
  );

  const scheduleAutoSubmit = useCallback(
    (delay: number) => {
      cancelAutoSubmit();
      autoSubmitTimerRef.current = setTimeout(() => {
        autoSubmitTimerRef.current = null;
        dispatch();
      }, delay);
    },
    [cancelAutoSubmit, dispatch],
  );

  const resolveAutoSubmitDelay = useCallback((collection: FieldsCollection, touched: readonly FilterName[]): number => {
    return touched.reduce((highestDelay, name) => {
      const currentDelay = collection.get(name)?.debounce ?? 0;
      return currentDelay > highestDelay ? currentDelay : highestDelay;
    }, 0);
  }, []);

  const shouldAutoSubmit = useCallback(
    (state: FieldStoreState): boolean => {
      if (state.context.autoSubmit === false) {
        return false;
      }

      return submitOnChange || isForcedOperation(state.operation) || isSubmittableOperation(state);
    },
    [submitOnChange],
  );

  const performAutoSearch = useCallback(
    (state: FieldStoreState) => {
      if (!shouldAutoSubmit(state)) {
        return;
      }

      if (isForcedOperation(state.operation)) {
        dispatch();
        return;
      }

      const delay = resolveAutoSubmitDelay(state.collection, state.touched);

      if (delay <= 0) {
        dispatch();
        return;
      }

      scheduleAutoSubmit(delay);
    },
    [dispatch, resolveAutoSubmitDelay, scheduleAutoSubmit, shouldAutoSubmit],
  );

  return {
    isFormLoading,
    dispatch,
    performAutoSearch,
  };
}
