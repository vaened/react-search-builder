/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useEffect, useRef, useState } from "react";
import { FilterName, FilterTypeKey, FilterTypeMap, ValueFilterDictionary } from "../field";
import { FieldOperation, FieldStore } from "../store";

export type FieldDefinition = {
  [key: FilterName]: FilterTypeKey;
};

export type UseWatchFiltersProps<TDefinition extends FieldDefinition> = {
  fields: TDefinition;
  store: FieldStore;
};

export type WatchedFieldValues<TDefinition extends FieldDefinition> = {
  [K in keyof TDefinition]: FilterTypeMap[TDefinition[K]];
};

const CHANGE_OPERATIONS: FieldOperation[] = ["set", "flush", "register", "unregister", "rehydrate", "reset"];

export function useWatchFilters<TDefinition extends FieldDefinition>({
  fields,
  store,
}: UseWatchFiltersProps<TDefinition>): Partial<WatchedFieldValues<TDefinition>> {
  const [values, setValues] = useState<Partial<WatchedFieldValues<TDefinition>>>(() => snapshot(store, fields));
  const fieldsRef = useRef(fields);

  fieldsRef.current = fields;

  useEffect(() => {
    const unsubscribe = store.onChange(({ collection, touched, operation }) => {
      if (!operation || !CHANGE_OPERATIONS.includes(operation)) {
        return;
      }

      const currentFields = fieldsRef.current;
      const touchedNames = touched.filter((name) => name in currentFields);

      if (touchedNames.length === 0) {
        return;
      }

      setValues((prev) => {
        const newValues: ValueFilterDictionary = {};

        touchedNames.forEach((name: FilterName) => {
          newValues[name] = collection.get(name)?.value ?? null;
        });

        return {
          ...prev,
          ...newValues,
        };
      });
    });

    const current = snapshot(store, fieldsRef.current);

    setValues((previous) => {
      const hasChanges = Object.keys(current).some((key: FilterName) => current[key] !== previous[key]);
      return hasChanges ? current : previous;
    });

    return () => unsubscribe();
  }, []);

  return values;
}

const snapshot = <TDefinition extends FieldDefinition>(store: FieldStore, currentFields: TDefinition) => {
  const result: ValueFilterDictionary = {};

  for (const name in currentFields) {
    result[name] = store.get(name)?.value ?? null;
  }

  return result as Partial<WatchedFieldValues<TDefinition>>;
};
