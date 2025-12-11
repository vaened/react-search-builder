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
  useSearchBuilderQuietly,
  ValidationContext,
  ValidationSchema,
  Validator,
} from "@vaened/react-search-builder";
import { useEffect, useState } from "react";
import { validateStoreAvailabilityInComponent } from "../utils";
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
  slotProps?: {
    StartDatePicker: DateRangeFilterSlotProps<TEnableAccessibleFieldDOMStructure>;
    EndDatePicker: DateRangeFilterSlotProps<TEnableAccessibleFieldDOMStructure>;
  };
  onChange?: (value: DateRangeValue) => void;
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
  slotProps,
  spacing = 2,
  onChange,
  ...restOfProps
}: DateRangeFilterProps<TEnableAccessibleFieldDOMStructure>) {
  const context = useSearchBuilderQuietly();
  const [value, setValue] = useState<DateRangeValue>({ startDate: startDate ?? null, endDate: endDate ?? null });
  const store = source ?? context?.store;

  validateStoreAvailability(store);

  useEffect(() => {
    onChange?.(value);
  }, [value]);

  function updateValue(newValue: Partial<DateRangeValue>) {
    setValue((prev) => {
      const value = { ...prev, ...newValue };
      onChange?.(value);

      return value;
    });
  }

  function composeStartRules(context: ValidationContext<Date>) {
    return compose(slotProps?.StartDatePicker?.validate?.(context) ?? [], mustBeBeforeEnd(endFieldName, context.registry));
  }

  function composeEndRules(context: ValidationContext<Date>) {
    return compose(slotProps?.EndDatePicker?.validate?.(context) ?? [], mustBeAfterStart(startFieldName, context.registry));
  }

  function onStartDateChange(date: Date | null) {
    updateValue({ startDate: date });
    store?.revalidate(endFieldName);
  }

  function onEndDateChange(date: Date | null) {
    console.log({ date });
    updateValue({ endDate: date });
    store?.revalidate(startFieldName);
  }

  return (
    <Grid size={12} spacing={spacing} container {...restOfProps}>
      <Grid size={6}>
        <DateFilter
          {...slotProps?.StartDatePicker}
          store={store}
          name={startFieldName}
          label={startFieldLabel}
          minDate={minDate}
          maxDate={value?.endDate ?? undefined}
          defaultValue={startDate}
          validate={composeStartRules}
          onChange={onStartDateChange}
        />
      </Grid>
      <Grid size={6}>
        <DateFilter
          {...slotProps?.EndDatePicker}
          store={store}
          name={endFieldName}
          label={endFieldLabel}
          minDate={value?.startDate ?? undefined}
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

function mustBeAfterStart(startFieldName: FilterName, registry: FieldRegistry): SingleValidationRule<Date> | undefined {
  const startValue = registry.get<"date">(startFieldName)?.value;

  if (!startValue) {
    return;
  }

  return after({
    value: startValue,
    name: "end_date_before_start_date",
    message: "End date must be after the start date",
  });
}

function mustBeBeforeEnd(endFieldName: FilterName, registry: FieldRegistry): SingleValidationRule<Date> | undefined {
  const endValue = registry.get<"date">(endFieldName)?.value;

  if (!endValue) {
    return;
  }

  return before({
    value: endValue,
    name: "start_date_after_end_date",
    message: "Start date must be before the end date",
  });
}

function validateStoreAvailability(store: FieldStore | undefined | null): asserts store is FieldStore {
  validateStoreAvailabilityInComponent(store, "DateRange", 'startFieldName="startDate" endFieldName="endDate"');
}
