import { FilterValue, ValidationSchema } from "../field";
import { FieldErrors, FieldsCollection } from "../store";
import { allOf } from "./allOf";
import { FieldValidator } from "./FieldValidator";
import { isMultiError } from "./utils";

export class SearchBuilderFieldValidator implements FieldValidator {
  #failFast: boolean;

  constructor(failFast: boolean = true) {
    this.#failFast = failFast;
  }

  validate = <TValue extends FilterValue>(
    value: TValue,
    rules: ValidationSchema<TValue>,
    fields: FieldsCollection
  ): FieldErrors | undefined => {
    const validator = allOf(rules, this.#failFast);

    const response = validator(value, fields);

    if (response === true) {
      return;
    }

    const isMultiple = isMultiError(response);

    if (isMultiple && response.length === 0) {
      return;
    }

    if (isMultiple) {
      return { errors: response };
    }

    return {
      errors: [response],
    };
  };
}
