/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FormControl, InputLabel, MenuItem, Select as MuiSelect, type SelectProps } from "@mui/material";
import type {
  ArrayFilterFieldConfig,
  ArrayItemType,
  EmptyArrayFilterFieldConfig,
  FieldConfig,
  FieldStore,
  FilterLabel,
  FilterTypeKey,
  FilterTypeMap,
  ScalarFilterFieldConfig,
} from "@vaened/react-search-builder";
import { EMPTY_VALUE, useSearchBuilderQuietly } from "@vaened/react-search-builder";
import { type ReactElement, type ReactNode, useId, useMemo } from "react";
import FilterFieldController, { type FieldController } from "./FilterFieldController";

type MuiSelectRef = React.ComponentRef<typeof MuiSelect>;

type NormalizedOptionItem<I extends string | number> = {
  value: I;
  label: ReactElement | string;
};

export type OptionSelectTypeKey = Extract<FilterTypeKey, "string" | "number" | "string[]" | "number[]">;
export type OptionSelectScalarTypeKey = Exclude<OptionSelectTypeKey, `${string}[]`>;
export type OptionSelectArrayTypeKey = Extract<OptionSelectTypeKey, `${string}[]`>;

export type UiArrayProps<TValue, TItem> = {
  items: TItem[];
  getValue: (item: TItem) => TValue;
  getLabel: (item: TItem) => ReactNode;
  children?: never;
};

export type UiObjectProps<TValue extends string | number, TItemsObj extends Record<TValue, ReactNode | string>> = {
  items: TItemsObj;
  getValue?: never;
  getLabel?: never;
  children?: never;
};

export type UiChildrenProps = {
  items?: never;
  getValue?: never;
  getLabel?: never;
  children: ReactNode;
};

export type UiVariantProps<TValue, TItem, TItemsObj> =
  | UiArrayProps<TValue, TItem>
  | UiObjectProps<TValue & (string | number), TItemsObj & Record<TValue & (string | number), ReactNode | string>>
  | UiChildrenProps;

type OmittedSelectProps = "value" | "name" | "defaultValue" | "multiple" | "type" | "multiple" | "onChange" | "items" | "children";
type OmittedConfigProps = "humanize" | "serializer";

export interface OptionSelectProps extends Omit<SelectProps, OmittedSelectProps> {
  store?: FieldStore;
  ref?: React.Ref<MuiSelectRef>;
}

type InternalSelectProps<Value = unknown> = SelectProps<Value> & {
  normalizedItems: NormalizedOptionItem<string | number>[] | null;
  ref?: React.Ref<MuiSelectRef>;
};

type OptionSelectConfig<
  TKey extends OptionSelectTypeKey,
  TValue extends FilterTypeMap[TKey],
  TItem,
  TOption extends string | number,
  TItemsObj
> = OptionSelectProps &
  Omit<FieldConfig<TKey, TValue>, OmittedConfigProps> & {
    defaultValue?: TValue;
    toHumanLabel?: (value: TValue | TOption) => FilterLabel;
  } & UiVariantProps<TOption, TItem, TItemsObj>;

export type ScalarOptionSelectConfig<
  TKey extends OptionSelectScalarTypeKey,
  TValue extends FilterTypeMap[TKey],
  TItem = unknown,
  TItemsObj = unknown
> = OptionSelectProps &
  Omit<ScalarFilterFieldConfig<TKey, TValue>, OmittedConfigProps | "defaultValue"> & {
    defaultValue?: TValue;
    toHumanLabel?: (value: TValue) => FilterLabel;
  } & UiVariantProps<TValue, TItem, TItemsObj>;

export type ArrayOptionSelectConfig<
  TKey extends OptionSelectArrayTypeKey,
  TValue extends FilterTypeMap[TKey],
  TItem = unknown,
  TItemValue = ArrayItemType<TValue>,
  TItemsObj = unknown
> = OptionSelectProps &
  Omit<ArrayFilterFieldConfig<TKey, TValue>, OmittedConfigProps | "defaultValue"> & {
    defaultValue?: TValue;
    toHumanLabel?: (value: TItemValue) => FilterLabel;
  } & UiVariantProps<TItemValue, TItem, TItemsObj>;

export type ArrayOptionSelectWithChildrenConfig<
  TKey extends OptionSelectArrayTypeKey,
  TValue extends FilterTypeMap[TKey]
> = OptionSelectProps &
  Omit<ArrayFilterFieldConfig<TKey, TValue>, OmittedConfigProps | "defaultValue"> &
  UiChildrenProps & {
    defaultValue?: TValue;
    toHumanLabel?: (value: ArrayItemType<TValue>) => FilterLabel;
  };

export type EmptyArrayOptionSelectConfig<
  TKey extends OptionSelectArrayTypeKey,
  TItem = unknown,
  TItemValue = ArrayItemType<FilterTypeMap[TKey]>,
  TItemsObj = unknown
> = OptionSelectProps &
  Omit<EmptyArrayFilterFieldConfig<TKey>, OmittedConfigProps> & {
    toHumanLabel?: (value: NoInfer<TItemValue>) => FilterLabel;
  } & UiVariantProps<TItemValue, TItem, TItemsObj>;

export type EmptyArrayOptionSelectWithChildrenConfig<TKey extends OptionSelectArrayTypeKey> = OptionSelectProps &
  Omit<EmptyArrayFilterFieldConfig<TKey>, OmittedConfigProps> &
  UiChildrenProps & {
    toHumanLabel?: (value: ArrayItemType<FilterTypeMap[TKey]>) => FilterLabel;
  };

export function OptionSelect<TKey extends OptionSelectScalarTypeKey, TValue extends FilterTypeMap[TKey], TItem, TItemsObj>(
  props: ScalarOptionSelectConfig<TKey, TValue, TItem, TItemsObj>
): ReactElement;

export function OptionSelect<TKey extends OptionSelectArrayTypeKey>(props: EmptyArrayOptionSelectWithChildrenConfig<TKey>): ReactElement;

export function OptionSelect<TKey extends OptionSelectArrayTypeKey, TItem, TItemsObj>(
  props: EmptyArrayOptionSelectConfig<TKey, TItem, TItemsObj>
): ReactElement;

export function OptionSelect<TKey extends OptionSelectArrayTypeKey, TValue extends FilterTypeMap[TKey]>(
  props: ArrayOptionSelectWithChildrenConfig<TKey, TValue>
): ReactElement;

export function OptionSelect<TKey extends OptionSelectArrayTypeKey, TValue extends FilterTypeMap[TKey], TItem, TItemsObj>(
  props: ArrayOptionSelectConfig<TKey, TValue, TItem, TItemsObj>
): ReactElement;

export function OptionSelect<
  Tkey extends OptionSelectTypeKey,
  TValue extends FilterTypeMap[Tkey],
  TItem,
  TIOption extends string | number,
  TitemsObj extends Record<Extract<TIOption, string | number>, ReactNode | string>
>(props: OptionSelectConfig<Tkey, TValue, TItem, TIOption, TitemsObj>) {
  validateOptionSelectProps(props);
  const context = useSearchBuilderQuietly();

  const {
    store: source,
    name,
    type,
    defaultValue,
    submittable,
    items,
    size,
    label: labelProp,
    ref,
    variant,
    inputProps,
    children,
    toHumanLabel,
    getValue,
    getLabel,
    ...restOfProps
  } = props;

  const selectId = useId();
  const labelId = `${selectId}-label`;
  const store = source ?? context?.store;
  const multiple = type.endsWith("[]");
  const emptyValue = multiple ? [] : EMPTY_VALUE;

  validateStoreAvailability(store);

  const humanize = useMemo(() => {
    if (!toHumanLabel) {
      return undefined;
    }

    if (multiple) {
      return (value: string[] | string[]) =>
        value.map((v) => ({
          value: v,
          label: toHumanLabel(v as TValue | TIOption) ?? String(v),
        }));
    }
    return toHumanLabel;
  }, [toHumanLabel, multiple]);

  const normalizedItems = useMemo(() => normalize(props), [items, getValue, getLabel, children]);

  const config = {
    type,
    name,
    defaultValue: defaultValue ?? emptyValue,
    submittable,
    humanize,
  } as Partial<FieldController<Tkey, TValue>>;

  return (
    <FilterFieldController
      store={store}
      {...(config as any)}
      control={({ value, onChange }) => {
        const internalProps = {
          ...restOfProps,
          children,
          normalizedItems,
          size,
          label: labelProp,
          multiple,
          value: value ?? emptyValue,
          onChange,
          ref,
          id: selectId,
        } satisfies InternalSelectProps<unknown>;

        if (!labelProp) {
          return (
            <Select
              {...internalProps}
              inputProps={{
                "aria-label": name,
                ...inputProps,
              }}
            />
          );
        }

        return (
          <FormControl variant={variant} size={size} fullWidth>
            <InputLabel id={labelId} shrink>
              {labelProp}
            </InputLabel>
            <Select {...internalProps} labelId={labelId} />
          </FormControl>
        );
      }}
    />
  );
}

function Select<Value = unknown>({ ref, children, normalizedItems, ...restOfProps }: InternalSelectProps<Value>) {
  return (
    <MuiSelect ref={ref} {...restOfProps}>
      {children ??
        normalizedItems?.map(({ value, label }) => (
          <MenuItem key={`option-select-item-${value}`} value={value}>
            {label}
          </MenuItem>
        ))}
    </MuiSelect>
  );
}

function isArrayBranch<TValue extends string | number, TItem, TItemsObj extends Record<TValue, ReactNode | string>>(
  props: UiVariantProps<TValue, TItem, TItemsObj>
): props is UiArrayProps<TValue, TItem> {
  return "items" in props && Array.isArray(props.items) && "getValue" in props;
}

function isObjectBranch<TValue extends string | number, TItem, TItemsObj extends Record<TValue, ReactNode | string>>(
  props: UiVariantProps<TValue, TItem, TItemsObj>
): props is UiObjectProps<TValue, TItemsObj> {
  return "items" in props && !!props.items && !Array.isArray(props.items) && typeof props.items === "object" && !("getValue" in props);
}

function normalize<TValue extends string | number, TItem, TItemsObj extends Record<TValue, ReactNode | string>>(
  props: UiVariantProps<TValue, TItem, TItemsObj>
): NormalizedOptionItem<TValue>[] | null {
  if (isArrayBranch(props)) {
    return props.items.map((item) => ({
      value: props.getValue(item),
      label: props.getLabel(item) as ReactElement | string,
    }));
  }

  if (isObjectBranch(props)) {
    return Object.entries(props.items).map(([value, label]) => ({
      value: value as TValue,
      label: label as ReactElement | string,
    }));
  }

  return null;
}
function validateStoreAvailability(store: FieldStore | undefined | null): asserts store is FieldStore {
  if (store) {
    return;
  }

  throw new Error(`
MISSING STORE CONFIGURATION
================================================================

PROBLEM: The <OptionSelect /> component requires a "store" to function, but none was found.
It seems you are trying to use this component outside of a <SearchBuilder> context without providing a store manually.

SOLUTION: You must provide a store using one of the following patterns:

PATTERN 1: Context Integration
  Wrap your component within the main provider:

  <SearchForm>
    <OptionSelect name="status" items={...} />
  </SearchForm>

PATTERN 2: Manual Injection
  Pass the store instance explicitly via props:

  const store = useSearchStore();
  // ...
  <OptionSelect store={store} name="status" items={...} />

================================================================
    `);
}

function validateOptionSelectProps<TValue extends string | number, TItem, TItemsObj extends Record<TValue, ReactNode | string>>(
  props: UiVariantProps<TValue, TItem, TItemsObj>
): void {
  if ("items" in props && props.items && "children" in props && props.children) {
    throw new Error(`
OPTION SELECT PROPS CONFLICT
================================================================

PROBLEM: You've provided both "items" and "children" to OptionSelect, but these are mutually exclusive ways to define options.

SOLUTION: Choose ONLY ONE of these three supported patterns:

PATTERN 1: Array of objects with accessors
  <OptionSelect
    items={users}
    getValue={(user) => user.id}
    getLabel={(user) => user.name}
  />

PATTERN 2: Simple key-value object
  <OptionSelect
    items={{
      "active": "Active",
      "inactive": "Inactive"
    }}
  />

PATTERN 3: Direct MenuItem children
  <OptionSelect>
    <MenuItem value="active">Active</MenuItem>
    <MenuItem value="inactive">Inactive</MenuItem>
  </OptionSelect>

Remove either the "items" prop or the "children" to resolve this error.
================================================================
    `);
  }
}

export default OptionSelect;
