/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { type ReactElement } from "react";
import { ArrayTypeKey, FieldValidationStatus, FilterTypeKey, FilterTypeMap, ScalarTypeKey } from "../field";
import { ArrayFilterFieldConfig, EmptyArrayFilterFieldConfig, FilterFieldConfig, ScalarFilterFieldConfig, useFilterField } from "../hooks";
import { FieldStore } from "../store";

type Event = { target: any } | any;

export type ControlProps<V> = {
  value: V | null;
  errors: FieldValidationStatus;
  onChange: (event: Event) => void;
};

export type Control<V> = (props: ControlProps<V>) => ReactElement;

export type ControllerProps<V> = {
  store: FieldStore;
  control: Control<V>;
};

export interface FieldControllerProps<TValue> {
  store: FieldStore;
  control: Control<TValue>;
}

export interface FieldController<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>
  extends FilterFieldConfig<TKey, TValue>,
    ControllerProps<TValue> {}

export interface ScalarFieldControllerProps<TKey extends ScalarTypeKey, TValue extends FilterTypeMap[TKey]>
  extends ScalarFilterFieldConfig<TKey, TValue>,
    ControllerProps<TValue> {}

export interface EmptyArrayFieldControllerProps<TKey extends ArrayTypeKey>
  extends EmptyArrayFilterFieldConfig<TKey>,
    FieldControllerProps<FilterTypeMap[TKey]> {}

export interface ArrayFieldControllerProps<TKey extends ArrayTypeKey, TValue extends FilterTypeMap[TKey]>
  extends ArrayFilterFieldConfig<TKey, TValue>,
    FieldControllerProps<TValue> {}

export function FilterFieldController<TKey extends ScalarTypeKey, TValue extends FilterTypeMap[TKey]>(
  props: ScalarFieldControllerProps<TKey, TValue>
): ReactElement;

export function FilterFieldController<TKey extends ArrayTypeKey>(props: EmptyArrayFieldControllerProps<TKey>): ReactElement;

export function FilterFieldController<TKey extends ArrayTypeKey, TValue extends FilterTypeMap[TKey]>(
  props: ArrayFieldControllerProps<TKey, TValue>
): ReactElement;

export function FilterFieldController<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(props: any) {
  const { store, control, ...restOfProps } = props as FieldController<TKey, TValue>;

  const { value, errors, set } = useFilterField(store, restOfProps as any);

  function onChange(event: Event) {
    set(getEventValue(event) as TValue);
  }

  return control({
    value: value as TValue,
    errors,
    onChange,
  });
}

function isObject<T extends object>(value: unknown): value is T {
  return value !== null && !Array.isArray(value) && typeof value === "object" && !(value instanceof Date);
}

function isCheckbox(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | { type?: string }): element is HTMLInputElement {
  return (element as any).type === "checkbox";
}

function getEventValue(event: Event) {
  const target = event.target;
  if (isObject(target) && target) {
    return isCheckbox(target) ? target.checked : (target as any).value;
  }
  return event;
}

export default FilterFieldController;
