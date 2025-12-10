/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useCallback, useEffect, useState } from "react";
import { useSearchBuilder } from "../contexts";
import type { HumanizedValue, Humanizer, ScalarFilterValue, ValueOf } from "../field";
import type { FieldsCollection, GenericRegisteredField } from "../store";

type AnyHumanizedValue = HumanizedValue<any>;

export interface ActiveFilterTag {
  label: string;
  value?: ScalarFilterValue;
  field: GenericRegisteredField;
}

export interface UseActiveFiltersBarProps {
  preserveFieldsOrder?: boolean;
}

export function useActiveFilters({ preserveFieldsOrder }: UseActiveFiltersBarProps = {}) {
  const { store } = useSearchBuilder();
  const [actives, setActives] = useState<ActiveFilterTag[]>([]);
  const hasActives = actives.length > 0;

  const setActivesFrom = useCallback(
    (fields: FieldsCollection) => {
      const humanizables = fields.filter(onlyHumanizables);

      if (!preserveFieldsOrder) {
        humanizables.sort((a, b) => b.updatedAt - a.updatedAt);
      }

      setActives(
        humanizables.flatMap((field): ActiveFilterTag[] => {
          const humanized = createLabelFor(field, store.collection());
          return createTagsFrom(humanized, field);
        })
      );
    },
    [preserveFieldsOrder]
  );

  useEffect(() => {
    const unsubscribe = store.onFieldPersisted(setActivesFrom);
    return () => unsubscribe();
  }, [store, setActivesFrom]);

  function syncFromStore() {
    setActivesFrom(store.collection());
  }

  function clearAll() {
    store.reset();
    syncFromStore();
  }

  return { actives, hasActives, syncFromStore, clearAll };
}

function createLabelFor(field: GenericRegisteredField, fields: FieldsCollection): AnyHumanizedValue | undefined {
  const humanize = field.humanize as Humanizer<ValueOf<GenericRegisteredField>, AnyHumanizedValue> | undefined;
  return humanize ? humanize(field.value, fields) : undefined;
}

function createTagsFrom(value: AnyHumanizedValue | undefined, owner: GenericRegisteredField): ActiveFilterTag[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return [
      {
        label: value,
        field: owner,
      },
    ];
  }

  return value.map(
    (value): ActiveFilterTag => ({
      value: value.value,
      label: value.label,
      field: owner,
    })
  );
}

function onlyHumanizables(field: GenericRegisteredField): boolean {
  const value = field.value;

  if (field.humanize === undefined || value === null || value === undefined) {
    return false;
  }

  if (Array.isArray(value) && value.length === 0) {
    return false;
  }

  if (typeof value === "string" && value.trim() === "") {
    return false;
  }

  return true;
}
