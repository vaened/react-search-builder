/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FilterValue, MultipleValidationRule, SingleValidationRule, ValidationRule } from "../field";
import { allOf } from "./allOf";

type Predicate<TValue> = SingleValidationRule<TValue>;

type Condition<TValue> = Predicate<TValue> | boolean;

type WhenRuleValidation<TValue> = {
  is: Condition<TValue>;
  apply: ValidationRule<TValue>;
};

type WhenRulesValidation<TValue> = {
  is: Condition<TValue>;
  apply: Array<ValidationRule<TValue>>;
  failFast?: boolean;
};

type WhenRuleProps<TValue> = WhenRuleValidation<TValue> | WhenRulesValidation<TValue>;

export function when<TValue extends FilterValue>(props: WhenRuleValidation<TValue>): SingleValidationRule<TValue>;
export function when<TValue extends FilterValue>(props: WhenRulesValidation<TValue>): MultipleValidationRule<TValue>;

export function when<TValue extends FilterValue>(props: WhenRuleProps<TValue>): ValidationRule<TValue> {
  return (context) => {
    const result = typeof props.is === "function" ? props.is(context) : props.is;
    const shouldValidate = result === true;

    if (!shouldValidate) {
      return true;
    }

    if (!isMultiRules(props)) {
      return props.apply(context);
    }

    const validator = allOf(props.apply, props.failFast ?? true);
    return validator(context);
  };
}

function isMultiRules<TValue>(props: WhenRuleProps<TValue>): props is WhenRulesValidation<TValue> {
  return props !== undefined && "apply" in props && Array.isArray(props.apply);
}
