/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import ListSubheader from "@mui/material/ListSubheader";
import MenuList from "@mui/material/MenuList";
import Paper from "@mui/material/Paper";
import Popper, { type PopperProps } from "@mui/material/Popper";
import React, { useEffect, useRef } from "react";

export type DropdownMenuProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  placement?: PopperProps["placement"];
  onClose: (event: Event | React.SyntheticEvent) => void;
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ open, title, children, anchorRef, placement = "bottom-start", onClose }) => {
  const prevOpen = useRef(open);

  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current?.focus();
    }
    prevOpen.current = open;
  }, [open, anchorRef]);

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      onClose(event);
    } else if (event.key === "Escape") {
      onClose(event);
    }
  }

  return (
    <Popper
      open={open}
      anchorEl={anchorRef.current}
      role={undefined}
      placement={placement}
      modifiers={[
        {
          name: "offset",
          options: {
            offset: [0, 4],
          },
        },
      ]}
      transition
      sx={{ zIndex: (theme) => theme.zIndex.modal }}>
      {({ TransitionProps, placement }) => (
        <Grow
          {...TransitionProps}
          style={{
            transformOrigin: placement === "bottom-start" ? "left top" : "left bottom",
          }}>
          <Paper elevation={8}>
            <ClickAwayListener onClickAway={onClose}>
              <MenuList
                autoFocusItem={open}
                onKeyDown={handleListKeyDown}
                sx={{
                  minWidth: 130,
                  maxWidth: 310,
                  borderRadius: (theme) => theme.shape.borderRadius,
                }}>
                {title && <ListSubheader sx={{ lineHeight: 2.5 }}>{title}</ListSubheader>}
                {children}
              </MenuList>
            </ClickAwayListener>
          </Paper>
        </Grow>
      )}
    </Popper>
  );
};

export default DropdownMenu;
