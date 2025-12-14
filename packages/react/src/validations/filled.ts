/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FilterName, FilterValue, SingleValidationRule } from "../field";

export type FilledRuleProps = {
  field: FilterName;
  name?: string;
  message?: string;
};

export function filled<TValue extends FilterValue>({ field, name, message }: FilledRuleProps): SingleValidationRule<TValue> {
  return ({ registry }) => {
    const required = registry.get(field);

    if (required?.value !== null && required?.value !== undefined) {
      return true;
    }

    return {
      name: name ?? "filled",
      code: "empty",
      message: message ?? "Field is empty or not exists",
    };
  };
}
