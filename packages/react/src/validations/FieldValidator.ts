/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FieldNoErrors, FieldRegistry, FieldValidationStatus, FilterValue, ValidationSchema } from "../field";

export const NoErrors: FieldNoErrors = null;

export interface FieldValidator {
  validate: <TValue extends FilterValue>(
    value: TValue | null,
    rules: ValidationSchema<TValue>,
    registry: FieldRegistry
  ) => FieldValidationStatus;
}
