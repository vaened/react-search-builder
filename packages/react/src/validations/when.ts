/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FilterValue, ValidationRule } from "../field";
import { FieldsCollection } from "../store";
import { allOf } from "./allOf";

type Predicate = (fields: FieldsCollection) => boolean;

type Condition = Predicate | boolean;

type WhenRuleValidation<TValue> = {
  is: Condition;
  apply: ValidationRule<TValue>;
};

type WhenRulesValidation<TValue> = {
  is: Condition;
  apply: Array<ValidationRule<TValue>>;
  failFast?: boolean;
};

type WhenRuleProps<TValue> = WhenRuleValidation<TValue> | WhenRulesValidation<TValue>;

export function when<TValue extends FilterValue>(props: WhenRuleProps<TValue>): ValidationRule<TValue> {
  return (value, fields) => {
    const shouldValidate = typeof props.is === "function" ? props.is(fields) : props.is;

    if (!shouldValidate) {
      return true;
    }

    if (!isMultiRules(props)) {
      return props.apply(value, fields);
    }

    const validator = allOf(props.apply, props.failFast ?? true);
    return validator(value, fields);
  };
}

function isMultiRules<TValue>(props: WhenRuleProps<TValue>): props is WhenRulesValidation<TValue> {
  return props !== undefined && "apply" in props && Array.isArray(props.apply);
}
