/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FieldRegistry, FilterValue, ValidationSchema } from "../field";
import { FieldErrors } from "../store";
import { allOf } from "./allOf";
import { FieldValidator } from "./FieldValidator";
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
  ): FieldErrors | undefined => {
    const validator = allOf(rules, this.#failFast);

    const response = validator(value, registry);

    if (response === true) {
      return;
    }

    const isMultiple = isMultiError(response);

    if (isMultiple && response.length === 0) {
      return;
    }

    if (isMultiple) {
      return { all: response };
    }

    return {
      all: [response],
    };
  };
}
