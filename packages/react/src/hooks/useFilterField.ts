/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type {
  ArrayFieldConfig,
  ArrayTypeKey,
  FieldConfig,
  FieldOptions,
  FieldValidationStatus,
  FilterTypeKey,
  FilterTypeMap,
  Humanizer,
  RegisteredField,
  ScalarFieldConfig,
  ScalarTypeKey,
  Serializer,
  Validator,
} from "../field";
import resolve from "../serializers/resolve";
import { FieldStore, NoErrors } from "../store";

export type FilterFieldReturn<TResolved, TRegistered> = {
  field: TRegistered | undefined;
  value: TResolved | null;
  errors: FieldValidationStatus;
  set: (value: TResolved) => void;
};

export interface UseFilterFieldProps<TValue> {
  defaultValue?: TValue | null;
}

export interface FilterFieldConfig<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>
  extends FieldConfig<TKey, TValue>,
    UseFilterFieldProps<TValue> {}

export interface ScalarFilterFieldConfig<TKey extends ScalarTypeKey, TValue extends FilterTypeMap[TKey]>
  extends ScalarFieldConfig<TKey, TValue>,
    UseFilterFieldProps<TValue> {}

export interface EmptyArrayFilterFieldConfig<TKey extends ArrayTypeKey>
  extends ArrayFieldConfig<TKey, FilterTypeMap[TKey]>,
    UseFilterFieldProps<[]> {}

export interface ArrayFilterFieldConfig<TKey extends ArrayTypeKey, TValue extends FilterTypeMap[TKey]>
  extends ArrayFieldConfig<TKey, TValue>,
    UseFilterFieldProps<TValue> {}

export type GenericFilterFieldConfig = {
  [K in FilterTypeKey]: FilterFieldConfig<K, FilterTypeMap[K]>;
}[FilterTypeKey];

export function useFilterField<TKey extends ScalarTypeKey, TValue extends FilterTypeMap[TKey]>(
  store: FieldStore,
  config: ScalarFilterFieldConfig<TKey, TValue>
): FilterFieldReturn<TValue, RegisteredField<TKey, TValue>>;

export function useFilterField<TKey extends ArrayTypeKey>(
  store: FieldStore,
  config: EmptyArrayFilterFieldConfig<TKey>
): FilterFieldReturn<FilterTypeMap[TKey], RegisteredField<TKey, FilterTypeMap[TKey]>>;

export function useFilterField<TKey extends ArrayTypeKey, TValue extends FilterTypeMap[TKey]>(
  store: FieldStore,
  config: ArrayFilterFieldConfig<TKey, TValue>
): FilterFieldReturn<TValue, RegisteredField<TKey, TValue>>;

export function useFilterField<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]>(
  store: FieldStore,
  config: any
): FilterFieldReturn<TValue, RegisteredField<TKey, TValue>> {
  const {
    name,
    type,
    defaultValue,
    submittable,
    serializer: configSerializer,
    humanize: configHumanize,
    validate: configValidate,
    ...restOfProps
  } = config as FilterFieldConfig<TKey, TValue>;
  const parser = useRef({ serializer: configSerializer, humanize: configHumanize, validate: configValidate });
  const selector = useMemo(() => store.listen<TKey, TValue>(name), [store, name]);
  const field = useSyncExternalStore(store.subscribe, selector, selector);

  const defaultSerializer = useMemo(() => resolve(type), [type]);

  const humanize = useCallback<Humanizer<TValue>>((value, fields) => parser.current.humanize?.(value, fields), []);
  const validate = useCallback<Validator<TValue>>((context) => parser.current.validate?.(context) ?? [], []);
  const serializer = useMemo(() => {
    const safe = (userSerializer: Serializer<TValue> | undefined) => userSerializer ?? defaultSerializer;

    return {
      unserialize: (value) => safe(parser.current.serializer).unserialize(value),
      serialize: (value) => safe(parser.current.serializer).serialize(value),
    } as Serializer<TValue>;
  }, [defaultSerializer]);

  useEffect(() => {
    parser.current = {
      serializer: configSerializer,
      humanize: configHumanize,
      validate: configValidate,
    };
  });

  useEffect(() => {
    if (name === "startDate") {
      console.log({ value: field?.value });
    }
  }, [field?.value]);

  useEffect(() => {
    store.register({
      type,
      name,
      submittable,
      value: defaultValue ?? null,
      serializer,
      humanize,
      validate,
      ...restOfProps,
    });

    return () => store.unregister(name);
  }, [store, name, type]);

  useEffect(() => {
    if (!field) {
      return;
    }

    const touched: Partial<FieldOptions> = {};

    if (submittable !== field.submittable) {
      touched.submittable = submittable;
    }

    store.update(name, touched);
  }, [submittable, field]);

  const set = (value: TValue) => {
    store.set(name, value);
  };

  return {
    field,
    errors: field?.errors ?? NoErrors,
    value: (field?.value ?? defaultValue) as TValue,
    set,
  };
}
