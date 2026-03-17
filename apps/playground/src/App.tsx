import { Box, Container, CssBaseline, Grid, ThemeProvider } from "@mui/material";
import { SearchForm, createFieldStore, type FieldsCollection } from "@vaened/mui-search-builder";
import { useCallback, useMemo, useState } from "react";
import { PlaygroundFiltersPanel } from "./components/PlaygroundFiltersPanel";
import { PlaygroundHero } from "./components/PlaygroundHero";
import { PlaygroundResultsPanel } from "./components/PlaygroundResultsPanel";
import { PAGE_SIZE } from "./playground-config";
import { createDefaultResultState, evaluatePeopleSearch, people } from "./playground-search";
import { playgroundTheme } from "./theme";

export default function App() {
  const [result, setResult] = useState(createDefaultResultState);

  const store = useMemo(() => {
    const instance = createFieldStore({ persistInUrl: true });

    instance.configure({
      beforeSubmit: ({ dirtyFields, transaction }) => {
        if (dirtyFields.some((name) => name !== "page")) {
          transaction.set("page", 1);
        }
      },
    });

    return instance;
  }, []);

  const pageOptions = useMemo(
    () =>
      Array.from({ length: result.totalPages }, (_, index) => ({
        value: index + 1,
        label: `Página ${index + 1}`,
      })),
    [result.totalPages],
  );

  const search = useCallback(async (collection: FieldsCollection) => {
    const nextResult = evaluatePeopleSearch({
      collection,
      source: people,
    });

    await new Promise((resolve) => setTimeout(resolve, 180));
    setResult(nextResult);

    return true;
  }, []);

  return (
    <ThemeProvider theme={playgroundTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top right, rgba(45,212,191,0.16), transparent 24%), radial-gradient(circle at left center, rgba(245,158,11,0.08), transparent 18%), linear-gradient(180deg, #0a0f14 0%, #0d141b 100%)",
        }}>
        <Container sx={{ py: { xs: 3, md: 5 } }}>
          <PlaygroundHero totalPeople={people.length} pageSize={PAGE_SIZE} />

          <SearchForm store={store} onSearch={search} submitOnChange>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 5, xl: 4 }}>
                <PlaygroundFiltersPanel pageOptions={pageOptions} />
              </Grid>

              <Grid size={{ xs: 12, lg: 7, xl: 8 }}>
                <PlaygroundResultsPanel result={result} />
              </Grid>
            </Grid>
          </SearchForm>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
