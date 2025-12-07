/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { ValidationRule } from "../field";
import { FieldsCollection } from "../store";

export function allOf<TValue>(rules: Array<ValidationRule<TValue>>): ValidationRule<TValue> {
  return (value: TValue, fields: FieldsCollection) => {
    for (const rule of rules) {
      const result = rule(value, fields);

      if (result === false) {
        return {
          value: false,
          message: "Field is invalid",
        };
      }

      if (typeof result === "object" && !result.value) {
        return result;
      }
    }

    return true;
  };
}
