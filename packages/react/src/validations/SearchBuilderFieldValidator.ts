/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FieldRegistry, FieldValidationStatus, FilterValue, ValidationSchema } from "../field";
import { allOf } from "./allOf";
import { FieldValidator, NoErrors } from "./FieldValidator";
import { isMultiError } from "./utils";

export class SearchBuilderFieldValidator implements FieldValidator {
  #failFast: boolean;

  constructor(failFast: boolean = true) {
    this.#failFast = failFast;
  }

  validate = <TValue extends FilterValue>(
    value: TValue | null,
    rules: ValidationSchema<TValue>,
    registry: FieldRegistry
  ): FieldValidationStatus => {
    const validator = allOf(rules, this.#failFast);

    const response = validator({ value, registry });

    if (response === true) {
      return NoErrors;
    }

    const isMultiple = isMultiError(response);

    if (isMultiple && response.length === 0) {
      return NoErrors;
    }

    if (isMultiple) {
      return { all: response };
    }

    return {
      all: [response],
    };
  };
}
