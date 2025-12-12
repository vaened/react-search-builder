/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { Equality, Field, FilterTypeKey, FilterTypeMap, GenericField } from "../field";

export function isFieldDirty(field: GenericField, value: GenericField["value"] | null): boolean;
export function isFieldDirty<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: Field<TKey, TValue>,
  value: TValue | null
): boolean;
export function isFieldDirty<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: Field<TKey, TValue>,
  value: TValue | null
) {
  const current = field.value;

  if (current === null && value === null) {
    return false;
  }

  if (current === null || value === null) {
    return true;
  }

  const equals = field.isValueEqualsTo ?? defaultEqualityByType[field.type] ?? Object.is;

  return !equals(current, value);
}

const defaultEqualityByType: { [K in FilterTypeKey]?: Equality<FilterTypeMap[K]> } = {
  date: (a, b) => a.getTime() === b.getTime(),
};
