/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ArrayFilterValue, FilterValue, ValidationRule } from "../field";

type ValidableValue = Extract<FilterValue, ArrayFilterValue | string | null>;

type LengthRuleProps = {
  min?: number;
  max?: number;
  message?: string;
};

export function length<TValue extends ValidableValue>({ min, max, message }: LengthRuleProps): ValidationRule<TValue> {
  return (value: TValue) => {
    const isValid = value && (min === undefined || value.length >= min) && (max === undefined || value.length <= max);

    return (
      isValid || {
        value: false,
        message: message ?? resolveLengthErrorMessage(value, min, max),
      }
    );
  };
}

function resolveLengthErrorMessage(value: ValidableValue, min?: number, max?: number): string | undefined {
  const type = typeof value === "string" ? "characters" : "items";
  switch (true) {
    case min !== undefined && max !== undefined:
      return `Field must be between ${min} and ${max} ${type}`;
    case min !== undefined:
      return `Field must be greater than ${min} ${type}`;
    case max !== undefined:
      return `Field must be less than ${max} ${type}`;
  }
}
