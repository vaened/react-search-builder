/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { SingleValidationRule, ValidationRule } from "../field";

export function not<TValue>(predicate: ValidationRule<TValue>): SingleValidationRule<TValue> {
  return (context) => {
    const result = predicate(context);
    const hasPassed = result === true || result === null || result === undefined || (Array.isArray(result) && result.length === 0);

    if (!hasPassed) {
      return true;
    }

    return {
      name: "not",
      code: "condition_met",
      message: "The condition was met, but it should not be",
    };
  };
}
