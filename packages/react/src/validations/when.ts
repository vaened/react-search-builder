/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FieldRegistry, FilterValue, MultipleValidationRule, SingleValidationRule, ValidationRule } from "../field";
import { allOf } from "./allOf";

type Predicate = (registry: FieldRegistry) => boolean;

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

export function when<TValue extends FilterValue>(props: WhenRuleValidation<TValue>): SingleValidationRule<TValue>;
export function when<TValue extends FilterValue>(props: WhenRulesValidation<TValue>): MultipleValidationRule<TValue>;

export function when<TValue extends FilterValue>(props: WhenRuleProps<TValue>): ValidationRule<TValue> {
  return (value, registry) => {
    const shouldValidate = typeof props.is === "function" ? props.is(registry) : props.is;

    if (!shouldValidate) {
      return true;
    }

    if (!isMultiRules(props)) {
      return props.apply(value, registry);
    }

    const validator = allOf(props.apply, props.failFast ?? true);
    return validator(value, registry);
  };
}

function isMultiRules<TValue>(props: WhenRuleProps<TValue>): props is WhenRulesValidation<TValue> {
  return props !== undefined && "apply" in props && Array.isArray(props.apply);
}
