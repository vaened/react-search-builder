/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ScalarFilterValue, SingleValidationRule } from "../field";
import { isValidValue } from "./utils";

type ValidableValue = Extract<ScalarFilterValue, number | Date>;

type BeforeRuleError = {
  name: string;
  code: "before";
  message?: string;
};

type BeforeRuleProps<TValue extends ValidableValue> = {
  value: TValue;
  name?: string;
  message?: string;
  format?: (value: TValue) => string;
};

export function before<TValue extends ValidableValue>({
  value: validable,
  name,
  message,
  format,
}: BeforeRuleProps<TValue>): SingleValidationRule<TValue, BeforeRuleError> {
  return (value) => {
    const isValid = !isValidValue(value) || value <= validable;

    if (isValid) {
      return true;
    }

    return {
      name: name ?? "before",
      code: "before",
      message: message ?? `Field must be before ${format?.(validable) ?? validable}`,
    };
  };
}
