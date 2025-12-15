/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { Button } from "@mui/material";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import InputLabel from "@mui/material/InputLabel";
import MuiPaper, { type PaperProps } from "@mui/material/Paper";
import { keyframes, styled } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FilterBag, FilterName } from "@vaened/react-search-builder";
import { createFilterDictionaryFrom, useFilterField } from "@vaened/react-search-builder";
import { useSearchBuilder } from "@vaened/react-search-builder/core";
import { useId, useMemo, useRef, useState } from "react";
import { Translator, useMuiSearchBuilderConfig } from "../config";
import { InputSize } from "../types";
import DebounceInputSearch from "./DebounceInputSearch";
import FlagsSelect, { type FlagsBag } from "./FlagsSelect";
import IndexSelect from "./IndexSelect";

const HEIGHT = { small: 40, medium: 56 } as const;
const INPUT_PY = { small: 8.5, medium: 16.5 } as const;

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

type PanelProps = PaperProps & { size: InputSize };

const Container = styled(Box)<{ size: InputSize }>(() => ({
  position: "relative",
}));

const animation = keyframes`
  0% { 
    transform: scale(1) rotate(0deg); 
  }
  5%, 10% {
    transform: scale3d(.9,.9,.9) rotate(-5deg); 
  }
  15%, 25%, 35%, 45% { 
    transform: scale3d(1.1,1.1,1.1) rotate(5deg); 
  }
  20%, 30%, 40% {
    transform: scale3d(1.1, 1.1, 1.1) rotate(-5deg);
  }
  50% { 
    transform: scale(1) rotate(0deg); 
  }
`;

const AnimateIcon = styled("span")<{
  active?: boolean;
}>(({ active = false }) =>
  active
    ? {
        transition: "all .15s",
        animation: `2.5s infinite both ${animation}`,
        display: "inline-flex",
      }
    : {
        display: "inline-flex",
      }
);

const Panel = styled(MuiPaper, {
  shouldForwardProp: (p) => p !== "size",
})<PanelProps>(({ theme, size }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",

  minHeight: HEIGHT[size],
  padding: "0 9px",

  borderRadius: theme.shape.borderRadius,
  outline: "none",
  overflow: "visible",

  "& .outline": {
    pointerEvents: "none",
    position: "absolute",
    top: -5,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    padding: "0 8px",
    borderRadius: "inherit",
    border: "1px solid rgba(0,0,0,0.23)",
    zIndex: 0,
  },
  "&:hover .outline": { borderColor: "rgba(0,0,0,0.87)" },
  "&:focus-within .outline": { borderColor: "#1976d2", borderWidth: 2 },

  "& .outline-label": {
    float: "unset",
    width: "auto",
    height: 11,
    padding: 0,
    maxWidth: "100%",
    overflow: "hidden",
  },

  "& .outline-label > span": {
    display: "inline-block",
    paddingRight: "5px",
    paddingLeft: "5px",
    fontSize: ".75rem",
    visibility: "hidden",
  },

  "& .content": {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    width: "100%",
  },

  "& .MuiInputBase-input": {
    paddingTop: INPUT_PY[size],
    paddingBottom: INPUT_PY[size],
  },
}));

const FloatingLabel = styled(InputLabel)<{ size: "small" | "medium" }>(({ size }) => ({
  position: "absolute",
  transform: "translate(14px, -9px) scale(0.75)",
  left: 0,
  top: size === "small" ? 0 : 0,
  zIndex: 100,
}));

export function SearchBar<IB extends FilterBag<FilterName>, FB extends FlagsBag<FilterName>>({
  id,
  size = "medium",
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
  const { icon, translate } = useMuiSearchBuilderConfig();
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
  const description = dictionary && index ? dictionary[index].description : null;

  function apply(query?: string | null) {
    set(query ?? "");
    onChange?.(query ?? "");
  }

  function onIndexChange(string: KeysOf<IB> | undefined) {
    setIndex(string);
    setTimeout(() => inputSearch.current?.focus(), 100);
  }

  return (
    <>
      <Container size={size}>
        <FloatingLabel size={size} htmlFor={inputId}>
          {defaultIndexLabel}
        </FloatingLabel>

        <Panel elevation={0} size={size}>
          <fieldset className="outline" aria-hidden>
            <legend className="outline-label">
              <span>{defaultIndexLabel}</span>
            </legend>
          </fieldset>

          <Box className="content">
            {dictionary && index && (
              <IndexSelect
                name={indexName}
                size={size}
                submittable={submittable?.index === undefined ? false : submittable?.index}
                options={dictionary}
                defaultValue={index}
                onChange={onIndexChange}
              />
            )}

            <DebounceInputSearch
              id={inputId}
              inputRef={inputSearch}
              disabled={isLoading}
              delay={debounceDelay}
              placeholder={placeholder}
              inputProps={{ "aria-label": searchAriaLabel, "data-testid": "search-input-text" }}
              value={value ?? ""}
              submitOnChange={isSubmitOnChangeEnabled}
              onChange={apply}
            />

            <Button
              loading={isLoading}
              size={size}
              type="submit"
              aria-label={searchAriaLabel || "submit search"}
              sx={{ minWidth: "34px" }}
              data-testid="search-trigger-button">
              <AnimateIcon>{icon("searchBarSearchIcon")}</AnimateIcon>
            </Button>

            {flags && (
              <>
                <Divider sx={{ height: HEIGHT[size] - 25, m: 0.5 }} orientation="vertical" />
                <FlagsSelect name={name?.flags} size={size} options={flags} defaultValue={defaultFlags} />
              </>
            )}
          </Box>
        </Panel>
      </Container>
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
    [labels]
  );
}

export default SearchBar;
