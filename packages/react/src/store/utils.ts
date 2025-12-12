/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { Field, FilterTypeKey, FilterTypeMap, GenericField } from "../field";

export function isFieldDirty(field: GenericField, value: GenericField["value"] | null): boolean;
export function isFieldDirty<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: Field<TKey, TValue>,
  value: TValue | null
): boolean;
export function isFieldDirty<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: Field<TKey, TValue>,
  value: TValue | null
) {
  return !Object.is(field.value, value);
}
