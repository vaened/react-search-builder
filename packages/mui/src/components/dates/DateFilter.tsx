/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { DatePicker, DatePickerProps, usePickerAdapter, } from "@mui/x-date-pickers";
import {
  FieldStore,
  FilterFieldController,
  FilterName,
  NoErrors,
  ScalarFieldConfig,
  useSecureFieldStoreInstance,
} from "@vaened/react-search-builder";
import ErrorMessages from "../ErrorMessages";
import { componentMissingStoreError } from "../utils";

export type DateFilterProps<TEnableAccessibleFieldDOMStructure extends boolean = false> = Omit<
  DatePickerProps<TEnableAccessibleFieldDOMStructure>,
  "value" | "name"
> &
  Omit<ScalarFieldConfig<"date", Date>, "type"> & {
    store?: FieldStore;
    name: FilterName;
  };

export function DateFilter<TEnableAccessibleFieldDOMStructure extends boolean = false>({
  store: source,
  name,
  submittable,
  serializer,
  defaultValue,
  humanize,
  validate,
  isValueEqualsTo,
  onChange: onChangeProp,
  slotProps,
  ...restOfProps
}: DateFilterProps<TEnableAccessibleFieldDOMStructure>) {
  const store = useSecureFieldStore(source);

  const slotPropsTextField = slotProps?.textField;

  return (
    <FilterFieldController
      store={store}
      name={name}
      submittable={submittable}
      serializer={serializer}
      humanize={humanize}
      validate={validate}
      isValueEqualsTo={isValueEqualsTo}
      type="date"
      defaultValue={defaultValue}
      control={({ value, errors, onChange }) => {
        return (
          <InternalDatePicker
            name={name}
            value={value}
            onChange={(date, context) => {
              onChange(date);
              onChangeProp?.(date, context);
            }}
            slotProps={{
              ...slotProps,
              textField: {
                fullWidth: true,
                error: errors !== NoErrors,
                FormHelperTextProps: {
                  component: "div",
                },
                helperText: <ErrorMessages name={name} errors={errors} />,
                ...slotPropsTextField,
              },
            }}
            {...restOfProps}
          />
        );
      }}
    />
  );
}

function InternalDatePicker<TEnableAccessibleFieldDOMStructure extends boolean>({
  value,
  timezone,
  minDate,
  maxDate,
  onChange,
  ...restOfProps
}: DatePickerProps<TEnableAccessibleFieldDOMStructure>) {
  const adapter = usePickerAdapter();

  const parse = (value: Date | null | undefined) => (value ? adapter.date(value as unknown as string, timezone) : undefined);

  return (
    <DatePicker
      value={parse(value) ?? null}
      minDate={parse(minDate)}
      maxDate={parse(maxDate)}
      timezone={timezone}
      onChange={(value, context) => {
        if (value === null) {
          onChange?.(null, context);
          return;
        }

        onChange?.(adapter.toJsDate(value), context);
      }}
      {...restOfProps}
    />
  );
}

function useSecureFieldStore(store: FieldStore | undefined | null): FieldStore {
  return useSecureFieldStoreInstance(
    store,
    componentMissingStoreError({
      component: "DateFilter",
      definition: 'name="date"',
    })
  );
}

export default DateFilter;
