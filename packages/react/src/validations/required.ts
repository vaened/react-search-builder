/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FieldRegistry, FilterValue, ValidationName, ValidationRule } from "../field";
import { isValidValue } from "./utils";

type RequiredRuleProps = {
  onlyIf?: (registry: FieldRegistry) => boolean;
  name?: ValidationName;
  message?: string;
};

export function required(params?: RequiredRuleProps | string): ValidationRule<FilterValue> {
  return (value, registry) => {
    const isObjectConfiguration = params && typeof params === "object";
    const message = isObjectConfiguration ? params.message : params;
    const name = isObjectConfiguration ? params.name : undefined;
    const onlyIf = isObjectConfiguration ? params.onlyIf : undefined;

    if (onlyIf !== undefined && onlyIf(registry) === false) {
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
