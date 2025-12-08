/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FilterValue, ValidationName, ValidationRule } from "../field";
import { FieldsCollection } from "../store";
import { isValidValue } from "./utils";

type RequiredRuleProps = {
  onlyIf?: (fields: FieldsCollection) => boolean;
  name?: ValidationName;
  message?: string;
};

export function required(params?: RequiredRuleProps | string): ValidationRule<FilterValue> {
  return (value, fields) => {
    const isObjectConfiguration = params && typeof params === "object";
    const message = isObjectConfiguration ? params.message : params;
    const name = isObjectConfiguration ? params.name : undefined;
    const onlyIf = isObjectConfiguration ? params.onlyIf : undefined;

    if (onlyIf !== undefined && onlyIf(fields) === false) {
      return true;
    }

    const isValid = isValidValue(value) && value !== "" && (!Array.isArray(value) || value.length > 0);

    return (
      isValid || {
        name: name ?? "required",
        code: "required",
        message: message ?? "Field is required",
      }
    );
  };
}
