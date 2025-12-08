/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { SingleValidationRule, Validation, ValidationError, ValidationResponse, ValidationRule, ValidationSuccess } from "../field";
import { isError, isMultiError } from "./utils";

type ErrorableMultipleValidationRule<TValue> = Validation<TValue, ValidationError[]>;
type ErrorableValidationRule<TValue> = Validation<TValue, ValidationSuccess | ValidationError | ValidationError[]>;

export function allOf<TValue>(rules: Array<ValidationRule<TValue>>, failFast: false): ErrorableMultipleValidationRule<TValue>;
export function allOf<TValue>(rules: Array<ValidationRule<TValue>>, failFast: true): SingleValidationRule<TValue>;
export function allOf<TValue>(rules: Array<ValidationRule<TValue>>, failFast?: boolean): ErrorableValidationRule<TValue>;

export function allOf<TValue>(rules: Array<ValidationRule<TValue>>, failFast: boolean = true): ErrorableValidationRule<TValue> {
  if (failFast) {
    return createFailFastValidator(rules);
  }

  return createCollectAllValidator(rules);
}

function createFailFastValidator<TValue>(rules: Array<ValidationRule<TValue>>): SingleValidationRule<TValue> {
  return (value, fields): ValidationResponse => {
    for (const rule of rules) {
      const result = rule(value, fields);
      const isMultiple = isMultiError(result);

      if (!isMultiple) {
        if (isError(result)) {
          return result;
        }

        continue;
      }

      for (const response of result) {
        if (isError(response)) {
          return response;
        }
      }
    }

    return true;
  };
}
function createCollectAllValidator<TValue>(rules: Array<ValidationRule<TValue>>): ErrorableMultipleValidationRule<TValue> {
  return (value, fields): ValidationError[] => {
    const errors: ValidationError[] = [];

    for (const rule of rules) {
      const result = rule(value, fields);

      if (isMultiError(result)) {
        errors.push(...result.filter(isError));
        continue;
      }

      if (isError(result)) {
        errors.push(result);
      }
    }

    return errors;
  };
}
