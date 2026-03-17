/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import type { ButtonProps } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Typography from "@mui/material/Typography";
import type { FilterBag, FilterName } from "@vaened/react-search-builder";
import { createFilterDictionaryFrom, useFilterField } from "@vaened/react-search-builder";
import { useSearchBuilder } from "@vaened/react-search-builder/core";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Translator, useMuiSearchBuilderConfig } from "../config";
import type { InputSize } from "../types";
import FlagsSelect, { type FlagsBag } from "./FlagsSelect";
import IndexSelect from "./IndexSelect";
import SearchTriggerButton from "./SearchTriggerButton";

type KeysOf<T> = T extends Record<infer K extends FilterName, unknown> ? K : never;
type FromAdditives<T> = T extends { additives?: Record<infer U extends FilterName, unknown> } ? U : never;
type FromExclusives<T> = T extends { exclusives?: Record<infer U extends FilterName, unknown> } ? U : never;
export type FlagsKeysOf<T> = FromAdditives<T> | FromExclusives<T> | KeysOf<T>;
export type SearchBarName = { query?: string; index?: string; flags?: string };
export type SubmmitableFields = { query?: boolean; index?: boolean; flags?: boolean };

type SearchBarLabels = {
  defaultIndexLabel?: string;
  searchAriaLabel?: string;
};

interface SearchBarProps<IB extends FilterBag<FilterName>, FB extends FlagsBag<FilterName>> {
  id?: string;
  size?: InputSize;
  color?: Exclude<NonNullable<ButtonProps["color"]>, "inherit">;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  labels?: SearchBarLabels;
  indexes?: IB;
  flags?: FB;
  name?: SearchBarName;
  submittable?: SubmmitableFields;
  debounceDelay?: number;
  defaultIndex?: KeysOf<IB>;
  defaultFlags?: FlagsKeysOf<FB>[];
  defaultValue?: string | null;
  onChange?: (params: string) => void;
}

export function SearchBar<IB extends FilterBag<FilterName>, FB extends FlagsBag<FilterName>>({
  id,
  size = "medium",
  color = "primary",
  disabled = false,
  error = false,
  indexes,
  flags,
  name,
  submittable,
  debounceDelay = 400,
  placeholder,
  labels,
  defaultIndex,
  defaultFlags,
  defaultValue = null,
  onChange,
}: SearchBarProps<IB, FB>) {
  const inputId = id || useId();
  const { store, submitOnChange, isLoading } = useSearchBuilder();
  const { translate } = useMuiSearchBuilderConfig();
  const inputSearch = useRef<HTMLInputElement>(undefined);
  const dictionary = useMemo(() => createFilterDictionaryFrom<KeysOf<IB>>(indexes), [indexes]);
  const [index, setIndex] = useState<KeysOf<IB> | undefined>(() => {
    return dictionary && !defaultIndex ? (Object.keys(dictionary)[0] as KeysOf<IB> | undefined) : defaultIndex;
  });
  const indexName = name?.index ?? "index";
  const { value, set } = useFilterField(store, {
    type: "string",
    name: name?.query || "q",
    defaultValue: defaultValue ?? "",
    submittable: submittable?.query,
    humanize: (currentValue) => {
      const currentIndex = dictionary && index ? dictionary[index].label : null;
      return [currentIndex, currentValue].filter((label) => label).join(": ");
    },
  });

  const { defaultIndexLabel, searchAriaLabel } = useSearchBarTranslations(translate, labels);

  const isSubmitOnChangeEnabled = submittable?.query === undefined ? submitOnChange : submittable?.query;
  const isDisabled = disabled || isLoading;
  const description = dictionary && index ? dictionary[index].description : null;
  const [queryString, setQueryString] = useState(value ?? "");
  const debouncedQueryString = useDebounce(queryString || "", debounceDelay);
  const isQuerySynced = queryString === (value ?? "");

  function apply(query?: string | null) {
    set(query ?? "");
    onChange?.(query ?? "");
  }

  function onIndexChange(string: KeysOf<IB> | undefined) {
    setIndex(string);
    setTimeout(() => inputSearch.current?.focus(), 100);
  }

  function onQueryStringChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQueryString(event.target.value);
  }

  function onQueryStringKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || isQuerySynced) {
      return;
    }

    if (!isSubmitOnChangeEnabled) {
      apply(queryString);
      return;
    }

    event.preventDefault();
    apply(queryString);
  }

  useEffect(() => {
    setQueryString(value ?? "");
  }, [value]);

  useEffect(() => {
    if (isQuerySynced) {
      return;
    }

    apply(debouncedQueryString);
  }, [debouncedQueryString]);

  return (
    <>
      <Box sx={{ width: "100%" }}>
        <FormControl fullWidth variant="outlined" size={size} color={color} disabled={isDisabled} error={error}>
          <InputLabel shrink htmlFor={inputId}>
            {defaultIndexLabel}
          </InputLabel>

          <OutlinedInput
            id={inputId}
            inputRef={inputSearch}
            value={queryString ?? ""}
            placeholder={placeholder}
            label={defaultIndexLabel}
            onChange={onQueryStringChange}
            onKeyDown={onQueryStringKeyDown}
            inputProps={{ "aria-label": searchAriaLabel, "data-testid": "search-input-text" }}
            startAdornment={
              dictionary && index ? (
                <InputAdornment position="start" sx={{ mr: 0.5, maxWidth: "50%" }}>
                  <IndexSelect
                    name={indexName}
                    size={size}
                    submittable={submittable?.index === undefined ? false : submittable?.index}
                    options={dictionary}
                    defaultValue={index}
                    disabled={isDisabled}
                    onChange={onIndexChange}
                  />
                </InputAdornment>
              ) : undefined
            }
            endAdornment={
              <InputAdornment position="end" sx={{ mr: 0 }}>
                <Box sx={{ display: "inline-flex", alignItems: "center" }}>
                  <SearchTriggerButton color={color} size={size} disabled={isDisabled} ariaLabel={searchAriaLabel || "submit search"} />

                  {flags && (
                    <>
                      <Divider orientation="vertical" flexItem sx={{ my: 1, mx: 0.5 }} />
                      <FlagsSelect name={name?.flags} size={size} options={flags} defaultValue={defaultFlags} disabled={isDisabled} />
                    </>
                  )}
                </Box>
              </InputAdornment>
            }
            sx={{
              "& .MuiInputBase-input": {
                minWidth: 0,
              },
            }}
          />
        </FormControl>
      </Box>
      {index && description && (
        <Typography component="p" textAlign="right" color="text.secondary" sx={{ fontSize: 12, mt: 0.5 }}>
          {description}
        </Typography>
      )}
    </>
  );
}

function useSearchBarTranslations(translate: Translator, labels?: SearchBarLabels) {
  return useMemo(
    () => ({
      defaultIndexLabel: translate("searchBar.defaultLabel", {
        text: labels?.defaultIndexLabel,
        fallback: "Search for matches by",
      }),
      searchAriaLabel: translate("searchBar.searchAriaLabel", {
        text: labels?.searchAriaLabel,
        fallback: "search",
      }),
    }),
    [labels],
  );
}

function useDebounce(queryString: string, delay: number) {
  const [debounced, setDebounced] = useState(queryString);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(queryString);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [queryString, delay]);

  return debounced;
}

export default SearchBar;
