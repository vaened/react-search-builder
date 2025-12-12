/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ArrayFilterValue, FilterValue, SingleValidationRule, ValidationName } from "../field";
import { isValidValue } from "./utils";

type ValidableValue = Extract<FilterValue, ArrayFilterValue | string>;

type LengthRuleError = {
  name: string;
  code: "invalid_length" | "invalid_min_length" | "invalid_max_length";
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

    console.log({ error });

    return {
      name: name ?? "length",
      code: error?.code ?? "invalid_length",
      message: message ?? error?.message,
      params: {
        min: min?.toString(),
        max: max?.toString(),
      },
    };
  };
}

function resolveLengthError(value: ValidableValue, min?: number, max?: number): Pick<LengthRuleError, "code" | "message"> | undefined {
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
