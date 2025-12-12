/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ScalarFilterValue, SingleValidationRule } from "../field";
import { isValidValue } from "./utils";

type ValidableValue = Extract<ScalarFilterValue, number | Date>;

type AfterRuleError = {
  name: string;
  code: "after";
  message?: string;
  params: {
    value: string;
  };
};

type AfterRuleProps<TValue extends ValidableValue> = {
  value: TValue;
  name?: string;
  message?: string;
  format?: (value: TValue) => string;
};

export function after<TValue extends ValidableValue>({
  value: validable,
  name,
  message,
  format,
}: AfterRuleProps<TValue>): SingleValidationRule<TValue, AfterRuleError> {
  return ({ value }) => {
    const isValid = !isValidValue(value) || value >= validable;

    if (isValid) {
      return true;
    }

    return {
      name: name ?? "after",
      code: "after",
      message: message ?? `Field must be after ${format?.(validable) ?? validable}`,
      params: {
        value: format?.(validable) ?? validable.toString(),
      },
    };
  };
}
