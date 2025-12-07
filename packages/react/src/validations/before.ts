/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ScalarTypeKey, ValidationRule } from "../field";

type ValidableValue = Extract<ScalarTypeKey, number | Date | null>;

export function before<TValue extends ValidableValue>(date: TValue, message?: string): ValidationRule<TValue> {
  return (value: TValue) => {
    const isValid = value && value <= date;

    return (
      isValid || {
        value: false,
        message: message ?? `Field must be before ${date}`,
      }
    );
  };
}
