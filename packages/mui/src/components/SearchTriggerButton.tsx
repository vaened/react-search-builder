import { Button, type ButtonProps } from "@mui/material";
import { alpha, keyframes, styled } from "@mui/material/styles";
import { useSearchBuilder } from "@vaened/react-search-builder/core";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMuiSearchBuilderConfig } from "../config";
import type { InputSize } from "../types";

type SearchTriggerButtonProps = {
  color: Exclude<NonNullable<ButtonProps["color"]>, "inherit">;
  size: InputSize;
  disabled: boolean;
  ariaLabel: string;
};

const animation = keyframes`
  0%, 100% {
    transform: translateX(0) scale(1);
  }
  20% {
    transform: translateX(-1px) scale(0.98);
  }
  40% {
    transform: translateX(2px) scale(1.02);
  }
  60% {
    transform: translateX(-2px) scale(1.02);
  }
  80% {
    transform: translateX(1px) scale(0.99);
  }
`;

const SHAKE_DURATION_MS = 700;

const AnimateIcon = styled("span", {
  shouldForwardProp: (prop) => prop !== "pending" && prop !== "shake",
})<{
  pending?: boolean;
  shake?: boolean;
}>(({ pending = false, shake = false }) => ({
  display: "inline-flex",
  color: pending ? "currentColor" : "rgba(0, 0, 0, 0.62)",
  transition: "transform .18s ease, color .18s ease, opacity .18s ease",
  opacity: pending ? 1 : 0.84,
  animation: shake ? `0.35s 2 both ${animation}` : "none",
}));

export default function SearchTriggerButton({ color, size, disabled, ariaLabel }: SearchTriggerButtonProps) {
  const { store, isLoading } = useSearchBuilder();
  const { icon } = useMuiSearchBuilderConfig();
  const hasPendingSubmit = useSyncExternalStore(store.subscribe, store.hasDirtyFields, store.hasDirtyFields);
  const previousPendingRef = useRef(hasPendingSubmit);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!previousPendingRef.current && hasPendingSubmit) {
      setIsShaking(true);
    }

    previousPendingRef.current = hasPendingSubmit;
  }, [hasPendingSubmit]);

  useEffect(() => {
    if (!isShaking) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsShaking(false);
    }, SHAKE_DURATION_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [isShaking]);

  return (
    <Button
      loading={isLoading}
      disabled={disabled}
      size={size}
      type="submit"
      aria-label={ariaLabel}
      sx={(theme) => ({
        minWidth: "34px",
        borderRadius: 1.5,
        color: hasPendingSubmit && !isLoading ? theme.palette[color].main : theme.palette.action.active,
        backgroundColor: hasPendingSubmit && !isLoading ? alpha(theme.palette[color].main, 0.08) : "transparent",
        transition: "background-color .18s ease, color .18s ease",
        "&:hover": {
          backgroundColor:
            hasPendingSubmit && !isLoading ? alpha(theme.palette[color].main, 0.12) : alpha(theme.palette.action.active, 0.06),
        },
      })}
      data-testid="search-trigger-button">
      <AnimateIcon
        pending={hasPendingSubmit && !isLoading}
        shake={isShaking && !isLoading}
        data-pending-submit={hasPendingSubmit ? "true" : "false"}
        data-shaking={isShaking && !isLoading ? "true" : "false"}
        data-testid="search-trigger-icon">
        {icon("searchBarSearchIcon")}
      </AnimateIcon>
    </Button>
  );
}
