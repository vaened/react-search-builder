import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { MuiSearchBuilderConfigProvider } from "@vaened/mui-search-builder";
import "dayjs/locale/es";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={"es"}>
    <MuiSearchBuilderConfigProvider locale="es">
      <App />
    </MuiSearchBuilderConfigProvider>
  </LocalizationProvider>
);
