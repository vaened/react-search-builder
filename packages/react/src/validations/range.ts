/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ScalarFilterValue, SingleValidationRule, ValidationName } from "../field";
import { isValidValue } from "./utils";

type ValidableValue = Extract<ScalarFilterValue, number | Date>;

type RangeRuleError = {
  name: string;
  code: "invalid_range" | "invalid_min_range" | "invalid_max_range";
  message?: string;
};

type MinRangeRuleProps<TValue> = {
  min: TValue;
};

type MaxRangeRuleProps<TValue> = {
  max: TValue;
};

type BothRangeRuleProps<TValue> = {
  min: TValue;
  max: TValue;
};

type RangeRuleProps<TValue> = {
  name?: ValidationName;
  message?: string;
} & (MinRangeRuleProps<TValue> | MaxRangeRuleProps<TValue> | BothRangeRuleProps<TValue>);

export function range<TValue extends ValidableValue>({
  name,
  message,
  ...restOfProps
}: RangeRuleProps<TValue>): SingleValidationRule<TValue, RangeRuleError> {
  return (value) => {
    const { min, max } = restOfProps as BothRangeRuleProps<TValue>;
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
