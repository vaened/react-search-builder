/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FieldErrors, FieldRegistry, FilterValue, ValidationSchema } from "../field";

export interface FieldValidator {
  validate: <TValue extends FilterValue>(
    value: TValue | null,
    rules: ValidationSchema<TValue>,
    registry: FieldRegistry
  ) => FieldErrors | undefined;
}
