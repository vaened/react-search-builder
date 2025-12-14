/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { Grid, GridProps } from "@mui/material";
import {
  after,
  before,
  FieldRegistry,
  FieldStore,
  FilterName,
  SingleValidationRule,
  useSecureFieldStoreInstance,
  useWatchFilters,
  ValidationContext,
  ValidationSchema,
  Validator,
} from "@vaened/react-search-builder";
import { componentMissingStoreError } from "../utils";
import DateFilter, { DateFilterProps } from "./DateFilter";

export type DateRangeValue = {
  startDate: Date | null;
  endDate: Date | null;
};

export type ValidationDatesSchema = {
  failFast?: boolean;
  start?: Validator<Date>;
  end?: Validator<Date>;
};

export type ValidationErrorFormat = (value: Date) => string;

export type DateRangeFilterSlotProps<TEnableAccessibleFieldDOMStructure extends boolean = false> = Omit<
  DateFilterProps<TEnableAccessibleFieldDOMStructure>,
  "store" | "name" | "defaultValue" | "label" | "maxDate" | "minDate"
>;

export type DateRangeFilterProps<TEnableAccessibleFieldDOMStructure extends boolean = false> = Omit<
  GridProps,
  "container" | "component" | "onSubmit"
> & {
  store?: FieldStore;
  startDate?: Date | null;
  endDate?: Date | null;
  startFieldName: FilterName;
  endFieldName: FilterName;
  startFieldLabel?: string;
  endFieldLabel?: string;
  maxDate?: Date;
  minDate?: Date;
  disableAutoBoundaries?: boolean;
  slotProps?: {
    StartDateFilterProps: DateRangeFilterSlotProps<TEnableAccessibleFieldDOMStructure>;
    EndDateFilterProps: DateRangeFilterSlotProps<TEnableAccessibleFieldDOMStructure>;
  };
  validationErrorFormat?: ValidationErrorFormat;
};

export function DateRangeFilter<TEnableAccessibleFieldDOMStructure extends boolean = false>({
  store: source,
  startDate,
  endDate,
  startFieldName,
  endFieldName,
  startFieldLabel,
  endFieldLabel,
  minDate,
  maxDate,
  disableAutoBoundaries,
  slotProps,
  spacing = 2,
  validationErrorFormat,
  ...restOfProps
}: DateRangeFilterProps<TEnableAccessibleFieldDOMStructure>) {
  const store = useSecureFieldStore(source);

  const { [startFieldName]: startFieldValue, [endFieldName]: endFieldValue } = useWatchFilters({
    store,
    fields: {
      [startFieldName]: "date",
      [endFieldName]: "date",
    },
  });

  const maxStartDate = disableAutoBoundaries ? undefined : endFieldValue;
  const minEndDate = disableAutoBoundaries ? undefined : startFieldValue;

  function composeStartRules(context: ValidationContext<Date>) {
    return compose(
      slotProps?.StartDateFilterProps?.validate?.(context) ?? [],
      mustBeBeforeEnd(endFieldName, context.registry, validationErrorFormat)
    );
  }

  function composeEndRules(context: ValidationContext<Date>) {
    return compose(
      slotProps?.EndDateFilterProps?.validate?.(context) ?? [],
      mustBeAfterStart(startFieldName, context.registry, validationErrorFormat)
    );
  }

  function onStartDateChange() {
    store.revalidate(endFieldName);
  }

  function onEndDateChange() {
    store.revalidate(startFieldName);
  }

  return (
    <Grid size={12} spacing={spacing} container {...restOfProps}>
      <Grid size={6}>
        <DateFilter
          {...slotProps?.StartDateFilterProps}
          store={store}
          name={startFieldName}
          label={startFieldLabel}
          minDate={minDate}
          maxDate={maxStartDate}
          defaultValue={startDate}
          validate={composeStartRules}
          onChange={onStartDateChange}
        />
      </Grid>
      <Grid size={6}>
        <DateFilter
          {...slotProps?.EndDateFilterProps}
          store={store}
          name={endFieldName}
          label={endFieldLabel}
          minDate={minEndDate}
          maxDate={maxDate}
          defaultValue={endDate}
          validate={composeEndRules}
          onChange={onEndDateChange}
        />
      </Grid>
    </Grid>
  );
}

function compose(schema: ValidationSchema<Date>, rule: SingleValidationRule<Date> | undefined) {
  if (rule) {
    schema.push(rule);
  }

  return schema;
}

function mustBeAfterStart(
  startFieldName: FilterName,
  registry: FieldRegistry,
  defaultFormat: ValidationErrorFormat | undefined
): SingleValidationRule<Date> | undefined {
  const startValue = registry.get<"date">(startFieldName)?.value;

  if (!startValue) {
    return;
  }

  return after({
    value: startValue,
    message: "End date must be after the start date",
    format: defaultFormat,
  });
}

function mustBeBeforeEnd(
  endFieldName: FilterName,
  registry: FieldRegistry,
  defaultFormat: ValidationErrorFormat | undefined
): SingleValidationRule<Date> | undefined {
  const endValue = registry.get<"date">(endFieldName)?.value;

  if (!endValue) {
    return;
  }

  return before({
    value: endValue,
    message: "Start date must be before the end date",
    format: defaultFormat,
  });
}

function useSecureFieldStore(store: FieldStore | undefined | null): FieldStore {
  return useSecureFieldStoreInstance(
    store,
    componentMissingStoreError({
      component: "DateRangeFilter",
      definition: 'startFieldName="startDate" endFieldName="endDate"',
    })
  );
}
