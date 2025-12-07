/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FilterValue, ValidationName, ValidationRule } from "../field";
import { FieldsCollection } from "../store";

type RequiredRuleProps = {
  onlyIf?: (fields: FieldsCollection) => boolean;
  name?: ValidationName;
  message?: string;
};

export function required<TValue extends FilterValue>(params?: RequiredRuleProps | string): ValidationRule<TValue> {
  return (value: TValue, fields: FieldsCollection) => {
    const isObjectConfiguration = params && typeof params === "object";
    const message = isObjectConfiguration ? params.message : params;
    const name = isObjectConfiguration ? params.name : undefined;
    const onlyIf = isObjectConfiguration ? params.onlyIf : undefined;

    if (onlyIf !== undefined && onlyIf(fields) === false) {
      return true;
    }

    const isValid = value !== undefined && value !== null && value !== "" && (!Array.isArray(value) || value.length > 0);

    return (
      isValid || {
        name: name ?? "required",
        code: "required",
        message: message ?? "Field is required",
      }
    );
  };
}
