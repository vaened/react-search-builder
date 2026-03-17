import { alpha, createTheme } from "@mui/material/styles";

export const playgroundTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#2dd4bf",
      dark: "#14b8a6",
    },
    secondary: {
      main: "#f59e0b",
    },
    text: {
      primary: "#f3f4f6",
      secondary: "#9ca3af",
    },
    background: {
      default: "#0a0f14",
      paper: "#101820",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Avenir Next", "Segoe UI", sans-serif',
    body1: {
      lineHeight: 1.65,
    },
    body2: {
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
    h4: {
      fontWeight: 750,
      letterSpacing: "-0.03em",
    },
    h5: {
      fontWeight: 720,
      letterSpacing: "-0.025em",
    },
    h6: {
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          backgroundColor: "#0a0f14",
        },
        "::selection": {
          backgroundColor: alpha("#2dd4bf", 0.22),
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: `0 20px 60px ${alpha("#000000", 0.32)}`,
          borderColor: alpha("#ffffff", 0.08),
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha("#0f1720", 0.9),
          transition: "border-color .18s ease, box-shadow .18s ease, background-color .18s ease",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#ffffff", 0.1),
            transition: "border-color .18s ease, box-shadow .18s ease",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: alpha("#2dd4bf", 0.5),
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 1,
            borderColor: "#2dd4bf",
            boxShadow: `0 0 0 4px ${alpha("#2dd4bf", 0.1)}`,
          },
        },
        input: {
          paddingBlock: 13,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          color: alpha("#f3f4f6", 0.64),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
        outlined: {
          borderColor: alpha("#ffffff", 0.1),
          backgroundColor: alpha("#0f1720", 0.72),
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: 12,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontWeight: 700,
          color: alpha("#f3f4f6", 0.58),
          borderBottomColor: alpha("#ffffff", 0.08),
        },
        body: {
          borderBottomColor: alpha("#ffffff", 0.06),
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          marginInline: 4,
          marginBlock: 2,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          backgroundColor: alpha("#020617", 0.92),
          fontSize: 12,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});
