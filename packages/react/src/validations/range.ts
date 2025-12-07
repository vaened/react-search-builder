/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ScalarTypeKey, ValidationRule } from "../field";

type ValidableValue = Extract<ScalarTypeKey, number | Date | null>;

type RangeRuleProps<TValue> = {
  min?: TValue;
  max?: TValue;
  message?: string;
};

export function range<TValue extends ValidableValue>({ min, max, message }: RangeRuleProps<TValue>): ValidationRule<TValue> {
  return (value: TValue) => {
    const isValid = value && (min === undefined || value >= min) && (max === undefined || value <= max);

    return (
      isValid || {
        value: false,
        message: message ?? resolveErrorMessage(min, max),
      }
    );
  };
}

export function resolveErrorMessage<TValue>(min: TValue, max: TValue): string | undefined {
  switch (true) {
    case min !== undefined && max !== undefined:
      return `Field must be between ${min} and ${max}`;
    case min !== undefined:
      return `Field must be greater than ${min}`;
    case max !== undefined:
      return `Field must be less than ${max}`;
  }
}
