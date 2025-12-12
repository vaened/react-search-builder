/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ArrayFilterValue, FilterValue, SingleValidationRule, ValidationName } from "../field";
import { isValidValue } from "./utils";

type ValidableValue = Extract<FilterValue, ArrayFilterValue | string>;

type LengthRuleError = {
  name: string;
  code:
    | "length"
    | "invalid_length_string"
    | "invalid_length_array"
    | "invalid_min_length_string"
    | "invalid_min_length_array"
    | "invalid_max_length_string"
    | "invalid_max_length_array";
  message?: string;
  params: {
    min?: string;
    max?: string;
  };
};

type MinLengthRuleProps = {
  min: number;
};

type MaxLengthRuleProps = {
  max: number;
};

type BothLengthRuleProps = {
  min: number;
  max: number;
};

type LengthRuleProps = {
  name?: ValidationName;
  message?: string;
} & (MinLengthRuleProps | MaxLengthRuleProps | BothLengthRuleProps);

export function length({ name, message, ...restOfProps }: LengthRuleProps): SingleValidationRule<ValidableValue, LengthRuleError> {
  return ({ value }) => {
    const { min, max } = restOfProps as BothLengthRuleProps;
    const isValid = !isValidValue(value) || ((min === undefined || value.length >= min) && (max === undefined || value.length <= max));

    if (isValid) {
      return true;
    }

    const error = resolveLengthError(value, min, max);

    return {
      name: name ?? "length",
      code: error?.code ?? "length",
      message: message ?? error?.message,
      params: {
        min: min?.toString(),
        max: max?.toString(),
      },
    };
  };
}

function resolveLengthError(value: ValidableValue, min?: number, max?: number): Pick<LengthRuleError, "code" | "message"> | undefined {
  const isString = typeof value === "string";
  const type = isString ? "string" : "array";
  const terminology = isString ? "characters" : "items";

  switch (true) {
    case min !== undefined && max !== undefined:
      return { code: `invalid_length_${type}`, message: `Field must be between ${min} and ${max} ${terminology}` };
    case min !== undefined:
      return { code: `invalid_min_length_${type}`, message: `Field must be greater than ${min} ${terminology}` };
    case max !== undefined:
      return { code: `invalid_max_length_${type}`, message: `Field must be less than ${max} ${terminology}` };
  }
}
