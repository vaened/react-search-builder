import { FilterValue, ValidationSchema } from "../field";
import { FieldErrors, FieldsCollection } from "../store";

export interface FieldValidator {
  validate: <TValue extends FilterValue>(
    value: TValue,
    rules: ValidationSchema<TValue>,
    fields: FieldsCollection
  ) => FieldErrors | undefined;
}
