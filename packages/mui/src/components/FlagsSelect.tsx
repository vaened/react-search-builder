/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Radio from "@mui/material/Radio";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { FilterBag, FilterDictionary, FilterElement, FilterName } from "@vaened/react-search-builder";
import { createFilterDictionaryFrom, useFilterField } from "@vaened/react-search-builder";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Translator, useMuiSearchBuilderConfig } from "../config";
import { InputSize } from "../types";
import DropdownMenu from "./DropdownMenu";
import { useSearchBuilder } from "@vaened/react-search-builder/core";

export type AdditiveFilterFlagBag<N extends FilterName> = Record<N, boolean>;

export interface FlagFilterValue<N extends FilterName> {
  additives: AdditiveFilterFlagBag<N>;
  exclusive?: N | null;
}

export interface FlagConfiguration<N extends FilterName> {
  additives?: FilterBag<N>;
  exclusives?: FilterBag<N>;
}

export interface FlagDictionary<N extends FilterName> {
  additives?: FilterDictionary<N>;
  exclusives?: FilterDictionary<N>;
}

export type FlagsBag<N extends FilterName> = FilterBag<N> | FlagConfiguration<N>;

type FlagsLabels = {
  dropdownHeaderTitle?: string;
  triggerTooltipMessage?: string;
  clearSelectionButtonTooltip?: string;
};

export interface FlagsSelectProps<N extends FilterName> {
  name?: FilterName;
  size?: InputSize;
  labels?: FlagsLabels;
  options: FlagsBag<N>;
  submittable?: boolean;
  defaultValue?: N[];
  onChange?: (flags: N[]) => void;
}

export function FlagsSelect<N extends FilterName>({
  name = "flags",
  options,
  labels,
  submittable,
  size = "medium",
  defaultValue = [],
  onChange,
}: FlagsSelectProps<N>) {
  const { store } = useSearchBuilder();
  const { icon, translate } = useMuiSearchBuilderConfig();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const dictionary = useMemo(() => createDictionary(options), [options]);

  const [open, setMenuOpenStatus] = useState(false);
  const { value, set } = useFilterField(store, {
    type: "string[]",
    name,
    defaultValue,
    submittable,
    humanize: (flags) => flags.map((flag) => ({ value: flag, label: labeled(dictionary, flag) ?? flag })),
  });

  const { dropdownHeaderTitle, triggerTooltipMessage, clearSelectionButtonTooltip } = useFlagsSelectTranslations(translate, labels);

  const filters: FlagFilterValue<N> = useMemo(() => parseValue(value, dictionary), [value]);
  const hasFilter = value && value.length;

  const openMenu = () => setMenuOpenStatus(true);
  const closeMenu = () => setMenuOpenStatus(false);

  function process(filters: FlagFilterValue<N>) {
    let flags = Object.entries<boolean>(filters.additives).reduce<N[]>((acc, [flag, checked]) => {
      if (checked) {
        acc.push(flag as N);
      }

      return acc;
    }, []);

    if (filters.exclusive) {
      flags.push(filters.exclusive);
    }

    set(flags);
    onChange?.(flags);
  }

  function onAdditivesChange({ name, checked }: { name: N; checked: boolean }) {
    process({
      ...filters,
      additives: {
        ...filters.additives,
        [name]: checked,
      },
    });
  }

  function onExclusivesChange(value: N) {
    process({
      ...filters,
      exclusive: value,
    });
  }

  function cleanExclusivesFilter() {
    process({
      ...filters,
      exclusive: null,
    });
  }

  return (
    <>
      <Box ref={anchorRef} sx={{ display: "inline-flex" }}>
        <Tooltip title={triggerTooltipMessage} disableHoverListener={open}>
          <IconButton
            onClick={openMenu}
            size={size}
            sx={{ p: "6px" }}
            color={hasFilter ? "primary" : "inherit"}
            aria-controls={open ? "composition-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            data-testid="flags-trigger-button">
            {hasFilter ? icon("flagsFilterActiveIcon") : icon("flagsFilterInactiveIcon")}
          </IconButton>
        </Tooltip>
      </Box>

      <DropdownMenu open={open} anchorRef={anchorRef} placement="bottom-end" onClose={closeMenu} title={dropdownHeaderTitle}>
        {dictionary.additives &&
          Object.values<FilterElement<N>>(dictionary.additives).map(({ value, label, description }, index) => (
            <MenuItemAction
              key={`${value}-${index}`}
              label={label}
              description={description}
              control={
                <Checkbox size="small" sx={{ py: 0 }} name={value} checked={filters.additives[value] ?? false} autoFocus={index === 0} />
              }
              onClick={() => {
                onAdditivesChange({ name: value, checked: !filters.additives[value] });
              }}
            />
          ))}

        {dictionary.additives && dictionary.exclusives && <Divider sx={{ my: 1 }} />}

        {dictionary.exclusives &&
          Object.values<FilterElement<N>>(dictionary.exclusives).map(({ value, label, description }, index) => (
            <MenuItemAction
              key={`${value}-${index}`}
              label={label}
              description={description}
              control={<Radio size="small" sx={{ py: 0 }} value={value} checked={filters.exclusive === value} />}
              onClick={() => {
                onExclusivesChange(value);
              }}
            />
          ))}

        {dictionary.exclusives && (
          <Box display="flex" justifyContent="flex-end" alignItems="center" px={1.5}>
            <Button
              variant="text"
              size="small"
              onClick={cleanExclusivesFilter}
              disabled={!filters.exclusive}
              color={!filters.exclusive ? "inherit" : "info"}>
              <Typography component="span" display="flex" sx={{ fontSize: 12 }} textTransform="capitalize">
                {clearSelectionButtonTooltip}
              </Typography>
              <span style={{ marginLeft: "5px" }}>{icon("flagsRestartIcon")}</span>
            </Button>
          </Box>
        )}
      </DropdownMenu>
    </>
  );
}

function useFlagsSelectTranslations(translate: Translator, labels?: FlagsLabels) {
  return useMemo(
    () => ({
      dropdownHeaderTitle: translate("flagsSelect.dropdownTitle", {
        text: labels?.dropdownHeaderTitle,
        fallback: "Available Flags",
      }),
      triggerTooltipMessage: translate("flagsSelect.tooltip", {
        text: labels?.triggerTooltipMessage,
        fallback: "Select Filters",
      }),
      clearSelectionButtonTooltip: translate("flagsSelect.restartButton", {
        text: labels?.clearSelectionButtonTooltip,
        fallback: "Restart",
      }),
    }),
    [labels]
  );
}

function labeled<N extends FilterName>(bag: FlagDictionary<N>, name: N): string | undefined {
  const compact = (bag: FilterDictionary<N> | undefined) => bag?.[name]?.label;
  return compact(bag.additives) ?? compact(bag.exclusives);
}

function MenuItemAction({
  control,
  label,
  description,
  onClick,
}: {
  label: string;
  description?: string;
  control: ReactNode;
  onClick: () => void;
}) {
  return (
    <ListItem sx={{ p: 0 }} dense>
      <ListItemButton sx={{ p: 1 }} onClick={onClick}>
        <ListItemIcon sx={{ minWidth: "44px" }}>{control}</ListItemIcon>
        <ListItemText sx={{ m: 0, pr: 0.5 }} primary={label} secondary={description} />
      </ListItemButton>
    </ListItem>
  );
}

function hasAdditive<N extends FilterName>(x: FlagsBag<N>): x is { additives: FilterBag<N> } {
  return typeof x === "object" && !!x && "additives" in x && typeof x.additives === "object" && x.additives !== null;
}

function hasExclusive<N extends FilterName>(x: FlagsBag<N>): x is { exclusives: FilterBag<N> } {
  return typeof x === "object" && !!x && "exclusives" in x && typeof x.exclusives === "object" && x.exclusives !== null;
}

function isFlagConfiguration<N extends FilterName>(x: FlagsBag<N>): x is FlagConfiguration<N> {
  return hasAdditive<N>(x) && hasExclusive<N>(x);
}

function parseValue<N extends FilterName>(value: N[] | null, bag: FlagConfiguration<N>): FlagFilterValue<N> {
  if (!value) {
    return { additives: {} as AdditiveFilterFlagBag<N>, exclusive: null };
  }

  const exclusive = value.find((flag) => bag?.exclusives?.hasOwnProperty(flag));
  const additives = value.reduce<AdditiveFilterFlagBag<N>>((acc, flag) => {
    acc[flag] = bag.additives?.hasOwnProperty(flag) ?? false;
    return acc;
  }, {} as AdditiveFilterFlagBag<N>);

  return { additives, exclusive };
}

function createDictionary<N extends FilterName>(bag: FlagsBag<N>): FlagDictionary<N> {
  if (isFlagConfiguration<N>(bag)) {
    return {
      additives: createFilterDictionaryFrom(bag.additives),
      exclusives: createFilterDictionaryFrom(bag.exclusives),
    };
  }

  if (hasAdditive<N>(bag)) {
    return { additives: createFilterDictionaryFrom(bag.additives) };
  }

  if (hasExclusive<N>(bag)) {
    return { exclusives: createFilterDictionaryFrom(bag.exclusives) };
  }

  return {
    additives: createFilterDictionaryFrom(bag),
  };
}

export default FlagsSelect;
