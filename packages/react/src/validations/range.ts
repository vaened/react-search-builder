/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ScalarFilterValue, SingleValidationRule, ValidationName } from "../field";
import { isValidValue } from "./utils";

type ValidableValue = Extract<ScalarFilterValue, number | Date>;

type RangeRuleError = {
  name: string;
  code: "range" | "invalid_range" | "invalid_min_range" | "invalid_max_range";
  message?: string;
  params: {
    min?: string;
    max?: string;
  };
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
  format?: (value: TValue) => string;
  message?: string;
} & (MinRangeRuleProps<TValue> | MaxRangeRuleProps<TValue> | BothRangeRuleProps<TValue>);

export function range<TValue extends ValidableValue>({
  name,
  message,
  format,
  ...restOfProps
}: RangeRuleProps<TValue>): SingleValidationRule<TValue, RangeRuleError> {
  return ({ value }) => {
    const { min, max } = restOfProps as BothRangeRuleProps<TValue>;
    const isValid = !isValidValue(value) || ((min === undefined || value >= min) && (max === undefined || value <= max));

    if (isValid) {
      return true;
    }

    const error = resolveError(min, max);

    const minFormatted = parse(min, format);
    const maxFormatted = parse(max, format);

    return {
      name: name ?? "range",
      code: error?.code ?? "range",
      message: message ?? error?.message,
      params: {
        min: minFormatted,
        max: maxFormatted,
      },
    };
  };
}

export function resolveError<TValue>(min: TValue, max: TValue): Pick<RangeRuleError, "code" | "message"> | undefined {
  switch (true) {
    case min !== undefined && max !== undefined:
      return { code: "invalid_range", message: `Field must be between ${min} and ${max}` };
    case min !== undefined:
      return { code: "invalid_min_range", message: `Field must be greater than ${min}` };
    case max !== undefined:
      return { code: "invalid_max_range", message: `Field must be less than ${max}` };
  }
}

function parse<TValue extends ValidableValue>(value: TValue | undefined, defaultFormat: undefined | ((value: TValue) => string)): string {
  if (value === undefined) {
    return "";
  }

  return defaultFormat?.(value) ?? (value instanceof Date ? value.toLocaleDateString() : value.toString());
}
