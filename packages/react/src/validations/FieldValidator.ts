/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FilterValue, ValidationSchema } from "../field";
import { FieldErrors, FieldsCollection } from "../store";

export interface FieldValidator {
  validate: <TValue extends FilterValue>(
    value: TValue | null,
    rules: ValidationSchema<TValue>,
    fields: FieldsCollection
  ) => FieldErrors | undefined;
}
