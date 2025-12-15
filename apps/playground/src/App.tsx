import {
  Container,
  CssBaseline,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import type { FieldsCollection, FlagsKeysOf } from "@vaened/mui-search-builder";
import {
  ActiveFiltersBar,
  FilterFieldController,
  OptionSelect,
  SearchBar,
  SearchForm,
  allOf,
  filled,
  length,
  required,
  useSearchStore,
  when,
} from "@vaened/mui-search-builder";
import { DateFilter, DateRangeFilter } from "@vaened/mui-search-builder/dates";
import { useEffect, useState } from "react";
const theme = createTheme();

type NumberValue = 1 | 2 | 3;

const additives = {
  onlyActives: (
    <>
      oli <b>ga</b>
    </>
  ),
  inDebt: "Con deuda",
  withoutEmail: "Sin email",
};

const additive: keyof typeof additives = "onlyActives";
const numberValue: NumberValue = 1;

const exclusives = {
  exclusives: {
    pending: {
      label: "Pendiente",
      description: "Usuarios pendientes de confirmación.",
    },
    processed: {
      label: "Procesado",
      description: "Usuarios que han sido confirmados.",
    },
  },
};
const indexes = {
  person: {
    label: "Persona",
    description: "Busqueda por número de identificación, y por nombres y apellidos.",
  },
  account: {
    label: "Cuenta",
    description: "Busqueda por número de cuenta, por nombres y apellidos del propietario y por uuid.",
  },
};

const flags = {
  additives: {
    onlyActives: {
      label: "Solo activos",
      description: "Filtrar únicamente usuarios activos.",
    },
    inDebt: {
      label: "Con deuda",
      description: "Usuarios que tienen un deuda pendiente de pago.",
    },
    withoutEmail: {
      label: "Sin email",
      description: "Filtrar a todos los usuarios sin email.",
    },
  },
  exclusives: {
    pending: {
      label: "Pendiente",
      description: "Usuarios pendientes de confirmación.",
    },
    processed: {
      label: "Procesado",
      description: "Usuarios que han sido confirmados.",
    },
  },
};

type CountryId = 1 | 2 | 3;
const countries: { value: CountryId; label: string }[] = [
  { value: 1, label: "Peru" },
  { value: 2, label: "Colombia" },
  { value: 3, label: "Brasil" },
];

interface Params {
  q?: string;
  index?: keyof typeof indexes;
  flags?: FlagsKeysOf<typeof flags>[];
}

export default function App() {
  const store = useSearchStore({ persistInUrl: true });

  const data: number[] = [];

  function search(collection: FieldsCollection) {
    console.log({ url: collection.toUrlSearchParams().toString() });
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        console.log({ submit: [...collection.toArray()] });
        resolve(true);
      }, 0);
    });
  }

  function onChange(collection: FieldsCollection) {
    console.log({ changed: { ...collection.toValues() } });
  }
  const [personName, setPersonName] = useState<string[]>([]);

  useEffect(() => {
    console.log("INITIALIZE");
  }, []);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container sx={{ py: 4 }}>
        <Typography variant="h4">Playground — mui-search-engine</Typography>
        <Grid container gap={2} flexDirection="column">
          <Grid>
            <SearchForm store={store} onSearch={search} onChange={onChange}>
              <Grid size={12} container>
                <DateRangeFilter
                  startFieldName="startDate"
                  endFieldName="endDate"
                  startFieldLabel="Inicio de búsqueda"
                  endFieldLabel="Fin de búsqueda"
                  disableAutoBoundaries
                  size={12}
                  gap={2}
                />
              </Grid>
              <Grid size={12}>
                <DateFilter store={store} name="date" label="Fecha" />
              </Grid>
              <Grid size={6}>
                <OptionSelect
                  type="number[]"
                  name="countries"
                  labelId="countries"
                  label="Paises"
                  items={countries}
                  getValue={(country) => country.value}
                  getLabel={(country) => country.label}
                  toHumanLabel={(v) => countries.find((country) => country.value === v)?.label ?? v.toString()}
                  validate={() => {
                    return [
                      when({
                        is: filled(),
                        apply: allOf([length({ min: 2, message: "Contries must be at least 2 items." })]),
                      }),
                    ];
                  }}
                  displayEmpty
                />
              </Grid>
              <Grid size={6}>
                <OptionSelect
                  type="string[]"
                  name="additives"
                  labelId="additives"
                  defaultValue={[]}
                  label="Aditivos"
                  toHumanLabel={(value) => additives[value as keyof typeof additives] as string}
                  displayEmpty>
                  <MenuItem value="" disabled>
                    Todos
                  </MenuItem>
                </OptionSelect>
              </Grid>
              <Grid size={6}>
                <OptionSelect
                  type="string"
                  name="centers"
                  label="Sedesd"
                  toHumanLabel={(v) => v}
                  isValueEqualsTo={(a, b) => a === b}
                  validate={() => {
                    return [required({ name: "oli" })];
                  }}
                  displayEmpty>
                  <MenuItem value="" disabled>
                    Todos
                  </MenuItem>
                  <MenuItem value="San Juan de Lurigancho">San Juan de Lurigancho</MenuItem>
                  <MenuItem value="Independencia">Independencia</MenuItem>
                </OptionSelect>
              </Grid>
              <Grid size={6}>
                <FilterFieldController
                  store={store}
                  type="string"
                  name="classroom"
                  submittable
                  serializer={{
                    serialize: (c) => c,
                    unserialize: (c) => new Promise((resolve) => setTimeout(() => resolve(c), 1000)),
                  }}
                  validate={() => {
                    return [length({ min: 5 })];
                  }}
                  humanize={(value) => value.toString()}
                  control={({ onChange, value, errors }) => (
                    <FormControl error={!!errors} fullWidth>
                      <InputLabel id="centersd" shrink>
                        Salones
                      </InputLabel>
                      <Select name="classroom" labelId="classroom" label="Salones" onChange={onChange} value={value ?? ""} displayEmpty>
                        <MenuItem value="" disabled>
                          Todos
                        </MenuItem>
                        <MenuItem value="sjl1">SJL-1</MenuItem>
                        <MenuItem value="sjl-02">JSL-2</MenuItem>
                      </Select>
                      {errors && (
                        <FormHelperText>{errors.all.map((error) => (error === false ? "" : error.message)).join(", ")}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              <Grid size={12}>
                <SearchBar name={{ query: "q" }} size="medium" indexes={indexes} flags={flags} defaultIndex={"account"} />
              </Grid>
              <Grid size={12}>
                <ActiveFiltersBar />
              </Grid>
            </SearchForm>
          </Grid>
          <Grid size={12}>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Namde</TableCell>
                    <TableCell>Label</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(indexes).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>{value.label}</TableCell>
                      <TableCell>{value.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

function MultipleSelectCheckmarks() {
  return <div></div>;
}
