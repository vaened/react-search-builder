/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type { FieldsCollection } from "./store";

export type FilterName = string;
export type FilterLabel = string;
export type ArrayItemType<T> = T extends (infer U)[] ? U : never;
export type FilterMultiLabel<T> = { value: ArrayItemType<T>; label: string }[];
export type ValueOf<T> = T extends { value: infer V } ? V | null : never;

export type FilterMetaData = { label: FilterLabel; description?: string };
export type FilterContext = FilterLabel | FilterMetaData;
export type FilterElement<T extends FilterName> = FilterMetaData & { value: T };
export type FilterBag<N extends FilterName> = Record<N, FilterContext>;
export type FilterDictionary<N extends FilterName> = Record<N, FilterElement<N>>;

export type FilterTypeMap = {
  string: string;
  number: number;
  boolean: boolean;
  date: Date;
  object: object;
  "string[]": string[];
  "number[]": number[];
  "boolean[]": boolean[];
  "date[]": Date[];
  "object[]": object[];
};
export type ScalarFilterTypeMap = {
  [K in keyof FilterTypeMap as K extends `${string}[]` ? never : K]: FilterTypeMap[K];
};
export type ArrayFilterTypeMap = {
  [K in keyof FilterTypeMap as K extends `${string}[]` ? K : never]: FilterTypeMap[K];
};

export type FilterTypeKey = keyof FilterTypeMap;
export type ScalarTypeKey = Exclude<FilterTypeKey, `${string}[]`>;
export type ArrayTypeKey = Extract<FilterTypeKey, `${string}[]`>;

export type FilterValue = FilterTypeMap[FilterTypeKey] | null;
export type ScalarFilterValue = ScalarFilterTypeMap[keyof ScalarFilterTypeMap];
export type ArrayFilterValue = ArrayFilterTypeMap[keyof ArrayFilterTypeMap];

export type HumanizeReturnType<T> = T extends unknown[] ? FilterMultiLabel<T>[] : string;
export type SerializeReturnType<T> = T extends unknown[] ? string[] : string;

export type ValidationName = string;
export type ValidationSucess = true;
export type ValidationError =
  | {
      name: ValidationName;
      code: string;
      message?: string;
    }
  | false;

export type ValidationResponse<TError extends ValidationError = ValidationError> = ValidationSucess | TError;
export type Validation<TValue, TResponse> = (value: TValue | null, fields: FieldsCollection) => TResponse;

export type SingleValidationRule<TValue, TError extends ValidationError = ValidationError> = Validation<TValue, ValidationResponse<TError>>;
export type MultipleValidationRule<TValue> = Validation<TValue, ValidationResponse<ValidationError>[]>;
export type ValidationRule<TValue, TError extends ValidationError = ValidationError> = Validation<
  TValue,
  ValidationResponse<ValidationError> | ValidationResponse[]
>;

export type ValidationSchema<TValue> = Array<ValidationRule<TValue>>;

export interface PlainFilterChip {
  label: FilterLabel;
}
export interface IndexedFilterChip<TValue extends ArrayFilterValue = ArrayFilterValue> extends PlainFilterChip {
  value: TValue[number];
}

export type PrimitiveValue = string | string[];
export type HumanizedValue<V extends ArrayFilterValue> = string | ReadonlyArray<IndexedFilterChip<V>>;
export type PrimitiveFilterDictionary = Record<FilterName, PrimitiveValue>;
export type ValueFilterDictionary = Record<FilterName, FilterValue>;

export type Validator<TValue> = (value: TValue, collection: FieldsCollection) => ValidationSchema<TValue>;

export type Humanizer<TValue, TResponse = HumanizeReturnType<TValue>> = (value: TValue, fields: FieldsCollection) => TResponse;

export type AsynchronousSerializer<TValue> = {
  serialize(value: TValue): SerializeReturnType<TValue>;
  unserialize(value: SerializeReturnType<TValue>): Promise<NoInfer<TValue> | undefined>;
};

export type SynchronousSerializer<TValue> = {
  serialize(value: TValue): SerializeReturnType<TValue>;
  unserialize(value: SerializeReturnType<TValue>): NoInfer<TValue> | undefined;
};

export type Serializer<TValue> = AsynchronousSerializer<TValue> | SynchronousSerializer<TValue>;

export interface FieldOptions {
  submittable?: boolean;
}

export interface FieldConfig<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]> extends FieldOptions {
  type: TKey;
  name: FilterName;
  humanize: Humanizer<TValue>;
  validate?: Validator<TValue>;
  serializer: Serializer<TValue>;
}

export type ScalarFieldConfig<TKey extends ScalarTypeKey, TValue extends FilterTypeMap[TKey]> = FieldOptions & {
  name: FilterName;
  type: TKey;
  humanize?: Humanizer<TValue, string>;
  validate?: Validator<TValue>;
  serializer?: Serializer<TValue>;
};

export type ArrayFieldConfig<TKey extends ArrayTypeKey, TValue extends FilterTypeMap[TKey]> = FieldOptions & {
  name: FilterName;
  type: TKey;
  humanize?: Humanizer<TValue, FilterMultiLabel<TValue>>;
  validate?: Validator<TValue>;
  serializer?: Serializer<TValue>;
};

export interface Field<TKey extends FilterTypeKey, TValue extends FilterTypeMap[TKey]> extends FieldConfig<TKey, TValue> {
  value: TValue | null;
}

export interface ScalarField<TKey extends ScalarTypeKey, TValue extends FilterTypeMap[TKey]> extends ScalarFieldConfig<TKey, TValue> {
  value: TValue | null;
}

export interface ArrayField<TKey extends ArrayTypeKey, TValue extends FilterTypeMap[TKey]> extends ArrayFieldConfig<TKey, TValue> {
  value: TValue | null;
}

export type GenericField = {
  [K in FilterTypeKey]: Field<K, FilterTypeMap[K]>;
}[FilterTypeKey];
