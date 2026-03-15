/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { InputBase, type InputBaseProps } from "@mui/material";
import React, { useEffect, useState } from "react";

export type DebounceInputSearchProps = Omit<InputBaseProps, "value" | "onChange"> & {
  value: string;
  delay?: number;
  submitOnChange: boolean;
  onChange?: (params: string | null | undefined) => void;
};

export const DebounceInputSearch: React.FC<DebounceInputSearchProps> = ({
  value,
  delay = 400,
  submitOnChange,
  inputProps,
  onChange,
  ...restOfProps
}) => {
  const [queryString, setQueryString] = useState(value);
  const debouncedTerm = useDebounce(queryString || "", delay);
  const isQuerySynced = queryString === value;

  useEffect(() => {
    setQueryString(value);
  }, [value]);

  useEffect(() => {
    if (isQuerySynced) {
      return;
    }

    apply(debouncedTerm);
  }, [debouncedTerm]);

  function apply(query?: string | null) {
    onChange?.(query ?? "");
  }

  function onQueryStringKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter" || isQuerySynced) {
      return;
    }

    if (!submitOnChange) {
      apply(queryString);
      return;
    }

    event.preventDefault();
    apply(queryString);
  }

  function onQueryStringChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQueryString(event.target.value);
  }

  return (
    <InputBase
      {...restOfProps}
      fullWidth
      sx={{ ml: 1, flex: 1, minWidth: 0 }}
      value={queryString ?? ""}
      inputProps={{
        "aria-label": "search query",
        ...inputProps,
      }}
      onKeyDown={onQueryStringKeyDown}
      onChange={onQueryStringChange}
    />
  );
};

function useDebounce(queryString: string, delay: number) {
  const [debounced, setValue] = useState(queryString);

  useEffect(() => {
    const handler = setTimeout(() => {
      setValue(queryString);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [queryString, delay]);

  return debounced;
}

export default DebounceInputSearch;
