/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FilterTypeKey, FilterTypeMap, RegisteredField } from "../field";
import { GenericRegisteredField, RegisteredFieldValue } from "./FieldsRepository";

export function isFieldDirty(field: GenericRegisteredField, value: RegisteredFieldValue): boolean;
export function isFieldDirty<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: RegisteredField<TKey, TValue>,
  value: TValue | null
): boolean;
export function isFieldDirty<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  field: RegisteredField<TKey, TValue>,
  value: TValue | null
) {
  return !Object.is(field.value, value);
}
