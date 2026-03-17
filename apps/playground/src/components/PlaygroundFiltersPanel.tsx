import { Grid, Paper, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { OptionSelect, SearchBar } from "@vaened/mui-search-builder";
import { DateFilter, DateRangeFilter } from "@vaened/mui-search-builder/dates";
import { countryOptions, flags, indexes, statusOptions } from "../playground-config";

type PlaygroundFiltersPanelProps = {
  pageOptions: Array<{ value: number; label: string }>;
};

export function PlaygroundFiltersPanel({ pageOptions }: PlaygroundFiltersPanelProps) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 4,
        position: { lg: "sticky" },
        top: { lg: 24 },
        borderColor: alpha(theme.palette.primary.main, 0.16),
        boxShadow: `0 18px 60px ${alpha(theme.palette.common.black, 0.22)}`,
      }}>
      <Typography variant="overline" sx={{ color: theme.palette.primary.main, letterSpacing: "0.12em" }}>
        Panel de filtros
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.5, mb: 0.5 }}>
        Segmenta la cartera
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Cambia cualquier filtro y la búsqueda se actualiza con debounce nativo.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={12}>
          <SearchBar
            indexes={indexes}
            flags={flags}
            defaultIndex="person"
            debounce={450}
            placeholder="Nombre, DNI, email, cuenta o UUID"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
          <OptionSelect
            type="string"
            name="status"
            label="Estado"
            defaultValue=""
            items={statusOptions}
            getValue={(option) => option.value}
            getLabel={(option) => option.label}
            toHumanLabel={(value) => statusOptions.find((option) => option.value === value)?.label ?? value}
            displayEmpty
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
          <OptionSelect
            type="string"
            name="country"
            label="País"
            defaultValue=""
            items={countryOptions}
            getValue={(option) => option.value}
            getLabel={(option) => option.label}
            toHumanLabel={(value) => countryOptions.find((option) => option.value === value)?.label ?? value}
            displayEmpty
          />
        </Grid>

        <Grid size={12}>
          <DateRangeFilter
            startFieldName="registeredFrom"
            endFieldName="registeredTo"
            startFieldLabel="Registrado desde"
            endFieldLabel="Registrado hasta"
            disableAutoBoundaries
            gap={2}
            size={12}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
          <DateFilter name="lastPaymentDate" label="Último pago exacto" />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 12 }}>
          <OptionSelect
            type="number"
            name="page"
            label="Página"
            defaultValue={1}
            items={pageOptions}
            getValue={(option) => option.value}
            getLabel={(option) => option.label}
            toHumanLabel={(value) => `Página ${value}`}
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
