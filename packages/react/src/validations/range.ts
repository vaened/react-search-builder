/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ScalarFilterValue, SingleValidationRule, ValidationName } from "../field";
import { isValidValue } from "./utils";

type ValidableValue = Extract<ScalarFilterValue, number | Date | null>;

type RangeRuleError = {
  name: string;
  code: "invalid_range" | "invalid_min_range" | "invalid_max_range";
  message?: string;
};

type RangeRuleProps<TValue> = {
  min?: TValue;
  max?: TValue;
  name?: ValidationName;
  message?: string;
};

export function range<TValue extends ValidableValue>({
  min,
  max,
  name,
  message,
}: RangeRuleProps<TValue>): SingleValidationRule<TValue, RangeRuleError> {
  return (value) => {
    const isValid = !isValidValue(value) || ((min === undefined || value >= min) && (max === undefined || value <= max));

    if (isValid) {
      return true;
    }

    const error = resolveError(min, max);

    return {
      name: name ?? "range",
      code: error?.code ?? "invalid_range",
      message: message ?? error?.message,
    };
  };
}

export function resolveError<TValue>(min: TValue, max: TValue): Omit<RangeRuleError, "name"> | undefined {
  switch (true) {
    case min !== undefined && max !== undefined:
      return { code: "invalid_range", message: `Field must be between ${min} and ${max}` };
    case min !== undefined:
      return { code: "invalid_min_range", message: `Field must be greater than ${min}` };
    case max !== undefined:
      return { code: "invalid_max_range", message: `Field must be less than ${max}` };
  }
}
