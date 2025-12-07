/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ArrayFilterValue, FilterValue, SingleValidationRule, ValidationName } from "../field";

type ValidableValue = Extract<FilterValue, ArrayFilterValue | string | null>;

type LengthRuleError = {
  name: string;
  code: "invalid_length" | "invalid_min_length" | "invalid_max_length";
  message?: string;
};

type LengthRuleProps = {
  min?: number;
  max?: number;
  name?: ValidationName;
  message?: string;
};

export function length<TValue extends ValidableValue>({
  min,
  max,
  name,
  message,
}: LengthRuleProps): SingleValidationRule<TValue, LengthRuleError> {
  return (value) => {
    const isValid = value && (min === undefined || value.length >= min) && (max === undefined || value.length <= max);

    if (isValid) {
      return true;
    }

    const error = resolveLengthError(value, min, max);

    return {
      name: name ?? "length",
      code: error?.code ?? "invalid_length",
      message: message ?? error?.message,
    };
  };
}

function resolveLengthError(value: ValidableValue, min?: number, max?: number): Omit<LengthRuleError, "name"> | undefined {
  const type = typeof value === "string" ? "characters" : "items";
  switch (true) {
    case min !== undefined && max !== undefined:
      return { code: "invalid_length", message: `Field must be between ${min} and ${max} ${type}` };
    case min !== undefined:
      return { code: "invalid_min_length", message: `Field must be greater than ${min} ${type}` };
    case max !== undefined:
      return { code: "invalid_max_length", message: `Field must be less than ${max} ${type}` };
  }
}
