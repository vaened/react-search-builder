/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FieldRegistry, FilterValue, ValidationSchema } from "../field";
import { FieldErrors } from "../store";

export interface FieldValidator {
  validate: <TValue extends FilterValue>(
    value: TValue | null,
    rules: ValidationSchema<TValue>,
    registry: FieldRegistry
  ) => FieldErrors | undefined;
}
