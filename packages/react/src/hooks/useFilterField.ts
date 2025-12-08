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
  FilterTypeKey,
  FilterTypeMap,
  FilterValue,
  GenericField,
  Humanizer,
  ScalarFieldConfig,
  ScalarTypeKey,
  Serializer,
} from "../field";
import resolve from "../serializers/resolve";
import type { FieldErrors, RegisteredField } from "../store";
import { FieldStore } from "../store";

export type FilterFieldReturn<TResolved, TRegistered> = {
  field: TRegistered | undefined;
  value: TResolved | null;
  errors?: FieldErrors;
  set: (value: TResolved) => void;
};

export interface UseFilterFieldProps<TValue> {
  defaultValue?: TValue;
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
): FilterFieldReturn<TValue, TKey>;

export function useFilterField<TKey extends ArrayTypeKey>(
  store: FieldStore,
  config: EmptyArrayFilterFieldConfig<TKey>
): FilterFieldReturn<FilterTypeMap[TKey], TKey>;

export function useFilterField<TKey extends ArrayTypeKey, TValue extends FilterTypeMap[TKey]>(
  store: FieldStore,
  config: ArrayFilterFieldConfig<TKey, TValue>
): FilterFieldReturn<TValue, TKey>;

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
    ...restOfProps
  } = config as GenericFilterFieldConfig;
  const parser = useRef({ serializer: configSerializer, humanize: configHumanize });
  const selector = useMemo(() => store.listen<TKey, TValue>(name), [store, name]);
  const field = useSyncExternalStore(store.subscribe, selector, selector);

  const defaultSerializer = useMemo(() => resolve(type), [type]);
  const humanize = useCallback<Humanizer<FilterValue>>((value, fields) => parser.current.humanize?.(value as never, fields), []);
  const serializer = useMemo<Serializer<FilterValue>>(() => {
    const safe = (userSerializer: Serializer<FilterValue> | null) => userSerializer ?? defaultSerializer;

    return {
      unserialize: (value) => safe(parser.current.serializer).unserialize(value as never),
      serialize: (value) => safe(parser.current.serializer).serialize(value as never),
    };
  }, [defaultSerializer]);

  useEffect(() => {
    parser.current = {
      serializer: configSerializer,
      humanize: configHumanize,
    };
  });

  useEffect(() => {
    store.register({
      type,
      name,
      submittable,
      value: defaultValue ?? null,
      serializer,
      humanize,
      ...restOfProps,
    } as GenericField);

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

    if (Object.keys(touched).length > 0) {
      store.update(name, touched);
    }
  }, [submittable, field]);

  const set = (value: TValue) => {
    store.set(name, value);
  };

  return {
    field,
    errors: field?.errors,
    value: (field?.value ?? defaultValue) as TValue,
    set,
  };
}
