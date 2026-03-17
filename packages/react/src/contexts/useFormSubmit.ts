/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useCallback } from "react";
import type { FilterName, FilterValue } from "../field";
import { type FieldBatchTransaction, FieldOperation, FieldsCollection, FieldStore, FieldStoreState } from "../store";
import { useFormStatus } from "./useFormStatus";

export type SubmitResult = void | boolean;
export type Submit = (params: FieldsCollection) => SubmitResult | Promise<SubmitResult>;
export type BeforeSubmit = (context: BeforeSubmitContext) => void;

export const SKIP_PERSISTENCE = false;

export type BeforeSubmitContext = {
  dirtyFields: readonly FilterName[];
  trigger: FieldOperation;
  collection: FieldsCollection;
  transaction: FieldBatchTransaction;
};

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

  const dispatch = useCallback(
    function (persist: boolean = true) {
      store.whenReady("search-form", () => {
        const state = store.state();
        const queued = new Map<FilterName, FilterValue>();

        beforeSubmit?.({
          dirtyFields: store.dirtyFields(),
          trigger: state.operation,
          collection: store.collection(),
          transaction: {
            set: (name, value) => {
              queued.set(name, value);
            },
          },
        });

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
    [store],
  );

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

      dispatch();
    },
    [submitOnChange, dispatch],
  );

  return {
    isFormLoading,
    dispatch,
    performAutoSearch,
  };
}
