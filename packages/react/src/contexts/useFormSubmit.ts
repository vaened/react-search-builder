/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useCallback } from "react";
import { FieldOperation, FieldsCollection, FieldStore, FieldStoreState } from "../store";
import { useFormStatus } from "./useFormStatus";

export type SubmitResult = void | boolean;
export type Submit = (params: FieldsCollection) => SubmitResult | Promise<SubmitResult>;

export const SKIP_PERSISTENCE = false;

export type UseFormSubmitProps = {
  store: FieldStore;
  onSearch?: Submit;
  submitOnChange: boolean;
  isHydrating: boolean;
  manualStart?: boolean;
};

const forcedOperations: FieldOperation[] = ["reset", "flush"];

export function useFormSubmit({ store, submitOnChange, isHydrating, manualStart, onSearch }: UseFormSubmitProps) {
  const { isFormLoading, setLoadingStatus } = useFormStatus({ isHydrating, manualStart });

  const dispatch = useCallback(
    function (persist: boolean = true) {
      store.whenReady("search-form", () => {
        if (store.hasErrors()) {
          return;
        }

        const response = Promise.resolve(onSearch?.(store.collection()));

        const loadingTimer = setTimeout(() => {
          setLoadingStatus(true);
        }, 200);

        response
          .then((result) => {
            if (result === false || !persist) {
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
    [store]
  );

  const performAutoSearch = useCallback(
    ({ collection, touched, operation }: FieldStoreState) => {
      const isForcedOperation = forcedOperations.includes(operation);
      const isSetOperation = operation === "set";

      const isSubmittableField = isSetOperation && touched.some((name) => collection.get(name)?.submittable);

      const canBeSubmitted = submitOnChange || isForcedOperation || isSubmittableField;

      if (!canBeSubmitted) {
        return;
      }

      dispatch();
    },
    [submitOnChange, dispatch]
  );

  return {
    isFormLoading,
    dispatch,
    performAutoSearch,
  };
}
