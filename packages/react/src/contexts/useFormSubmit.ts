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

  const performAutoSearch = useCallback(
    ({ collection, touched, operation, context }: FieldStoreState) => {
      if (context.autoSubmit === false) {
        return;
      }

      const isForcedOperation = forcedOperations.includes(operation);
      const isSetOperation = operation === "set";

      const isSubmittableField = isSetOperation && touched.some((name) => collection.get(name)?.submittable);

      const canBeSubmitted = submitOnChange || isForcedOperation || isSubmittableField;

      if (!canBeSubmitted) {
        return;
      }

      if (isForcedOperation) {
        dispatch();
        return;
      }

      const delay = resolveAutoSubmitDelay(collection, touched);

      if (delay <= 0) {
        dispatch();
        return;
      }

      scheduleAutoSubmit(delay);
    },
    [cancelAutoSubmit, dispatch, resolveAutoSubmitDelay, scheduleAutoSubmit, submitOnChange],
  );

  return {
    isFormLoading,
    dispatch,
    performAutoSearch,
  };
}
