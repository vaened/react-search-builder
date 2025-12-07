/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { MultipleValidationRule, SingleValidationRule, ValidationResponse, ValidationRule } from "../field";
import { FieldsCollection } from "../store";
import { isError, isMultiError } from "./utils";

export function allOf<TValue>(rules: Array<ValidationRule<TValue>>, failFast: false): MultipleValidationRule<TValue>;
export function allOf<TValue>(rules: Array<ValidationRule<TValue>>, failFast: true): SingleValidationRule<TValue>;
export function allOf<TValue>(rules: Array<ValidationRule<TValue>>, failFast?: boolean): SingleValidationRule<TValue>;

export function allOf<TValue>(rules: Array<ValidationRule<TValue>>, failFast: boolean = true): ValidationRule<TValue> {
  if (failFast) {
    return createFailFastValidator(rules);
  }

  return createCollectAllValidator(rules);
}

function createFailFastValidator<TValue>(rules: Array<ValidationRule<TValue>>): SingleValidationRule<TValue> {
  return (value: TValue, fields: FieldsCollection): ValidationResponse => {
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
function createCollectAllValidator<TValue>(rules: Array<ValidationRule<TValue>>): MultipleValidationRule<TValue> {
  return (value: TValue, fields: FieldsCollection): ValidationResponse[] => {
    const errors: ValidationResponse[] = [];

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
