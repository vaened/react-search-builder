/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import { IconChevronDown } from "@tabler/icons-react";
import type { FilterBag, FilterName } from "@vaened/react-search-builder";
import { createFilterDictionaryFrom, dictionaryToFilterElements, useFilterField } from "@vaened/react-search-builder";
import React, { useMemo, useState, type ReactNode } from "react";
import { Translator, useMuiSearchBuilderConfig } from "../config";
import { InputSize } from "../types";
import DropdownMenu from "./DropdownMenu";
import { useSearchBuilder } from "@vaened/react-search-builder/core";

type IndexLabels = {
  defaultActionLabel?: string;
  dropdownHeaderTitle?: string;
  triggerTooltipMessage?: string;
};

interface IndexSelectProps<N extends FilterName> {
  name?: FilterName;
  size?: InputSize;
  options: FilterBag<N>;
  labels?: IndexLabels;
  submittable?: boolean;
  mobileIcon?: ReactNode;
  defaultValue: N;
  uncaret?: boolean;
  onChange: (index: N | undefined) => void;
}

export function IndexSelect<N extends FilterName>({
  name = "index",
  size = "medium",
  options,
  labels,
  submittable,
  defaultValue,
  mobileIcon,
  uncaret,
  onChange,
}: IndexSelectProps<N>) {
  const { store } = useSearchBuilder();
  const { icon, translate } = useMuiSearchBuilderConfig();
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const dictionary = useMemo(() => createFilterDictionaryFrom(options), [options]);
  const elements = useMemo(() => dictionaryToFilterElements(dictionary), [dictionary]);

  const [open, setMenuOpenStatus] = useState(false);
  const { value, set } = useFilterField(store, {
    type: "string",
    name,
    defaultValue,
    submittable,
  });

  const current = useMemo(() => (value ? dictionary[value] : null), [value]);
  const { defaultActionLabel, dropdownHeaderTitle, triggerTooltipMessage } = useIndexSelectTranslations(translate, labels);

  const openMenu = () => setMenuOpenStatus(true);
  const closeMenu = () => setMenuOpenStatus(false);

  function onIndexChange(index: N) {
    set(index);
    onChange(index);
    closeMenu();
  }

  return (
    <>
      <Box ref={anchorRef} sx={{ display: "inline-flex" }}>
        <Tooltip title={triggerTooltipMessage} disableHoverListener={open}>
          <Button
            onClick={openMenu}
            size={size}
            variant="text"
            data-testid="index-trigger-button"
            endIcon={uncaret ? undefined : <IconChevronDown size={16} />}
            sx={{ display: { xs: "none", sm: "inline-flex" }, lineHeight: 1.7, "& .MuiButton-icon": { marginLeft: "4px" } }}
            aria-controls={open ? "composition-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true">
            {current?.label ?? defaultActionLabel}
          </Button>
        </Tooltip>

        <Tooltip
          title={current?.label ?? triggerTooltipMessage}
          sx={{ display: { xs: "inline-flex", sm: "none" } }}
          disableHoverListener={open}>
          <IconButton
            onClick={openMenu}
            size={size}
            data-testid="index-trigger-button"
            sx={{ display: { xs: "inline-flex", sm: "none" }, p: "6px" }}
            aria-controls={open ? "composition-menu" : undefined}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true">
            {mobileIcon ?? icon("indexSelectMobileIcon")}
          </IconButton>
        </Tooltip>
      </Box>

      <DropdownMenu title={dropdownHeaderTitle} open={open} anchorRef={anchorRef} onClose={closeMenu}>
        {elements.map((element, index) => (
          <MenuItem key={`${index}-${element.value}`} value={element.value} onClick={() => onIndexChange(element.value)}>
            {element.label}
          </MenuItem>
        ))}
      </DropdownMenu>
    </>
  );
}

function useIndexSelectTranslations(translate: Translator, labels?: IndexLabels) {
  return useMemo(
    () => ({
      defaultActionLabel: translate("indexSelect.defaultLabel", {
        text: labels?.defaultActionLabel,
        fallback: "Select Index",
      }),
      dropdownHeaderTitle: translate("indexSelect.dropdownTitle", {
        text: labels?.dropdownHeaderTitle,
        fallback: "Index",
      }),
      triggerTooltipMessage: translate("indexSelect.tooltip", {
        text: labels?.triggerTooltipMessage,
        fallback: "Search by",
      }),
    }),
    [labels]
  );
}

export default IndexSelect;
