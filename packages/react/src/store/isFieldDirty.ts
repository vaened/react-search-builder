/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { Equality, Field, FilterTypeKey, FilterTypeMap, GenericField } from "../field";

type DirtyComparison<TValue> = {
  current: TValue | null;
  next: TValue | null;
};

export function isFieldDirty(field: GenericField, value: GenericField["value"] | null): boolean;
export function isFieldDirty(field: GenericField, comparison: DirtyComparison<GenericField["value"]>): boolean;
export function isFieldDirty<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: Field<TKey, TValue>,
  value: TValue | null
): boolean;
export function isFieldDirty<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: Field<TKey, TValue>,
  comparison: DirtyComparison<TValue>
): boolean;
export function isFieldDirty<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: Field<TKey, TValue>,
  valueOrComparison: TValue | null | DirtyComparison<TValue>
) {
  let current: TValue | null = field.value;
  let next: TValue | null = valueOrComparison as TValue | null;

  if (isDirtyComparison(valueOrComparison)) {
    current = valueOrComparison.current;
    next = valueOrComparison.next;
  }

  if (current === null && next === null) {
    return false;
  }

  if (current === null || next === null) {
    return true;
  }

  const equals = field.isValueEqualsTo ?? defaultEqualityByType[field.type] ?? Object.is;

  return !equals(current, next);
}

const defaultEqualityByType: { [K in FilterTypeKey]?: Equality<FilterTypeMap[K]> } = {
  date: (a, b) => a.getTime() === b.getTime(),
};

function isDirtyComparison<TValue>(value: TValue | null | DirtyComparison<TValue>): value is DirtyComparison<TValue> {
  return (
    value !== null &&
    typeof value === "object" &&
    "current" in value &&
    "next" in value
  );
}
