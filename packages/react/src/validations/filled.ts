/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FilterName, FilterValue, SingleValidationRule } from "../field";

export type FilledRuleProps = {
  field?: FilterName;
  name?: string;
  message?: string;
};

export function filled<TValue extends FilterValue>({
  field,
  name,
  message,
}: FilledRuleProps | undefined = {}): SingleValidationRule<TValue> {
  return ({ value, registry }) => {
    const required = field ? registry.get(field)?.value : value;

    if (required !== undefined && required !== null && (Array.isArray(required) ? required.length > 0 : required !== "")) {
      return true;
    }

    return {
      name: name ?? "filled",
      code: "empty",
      message: message ?? "Field is empty or not exists",
    };
  };
}
