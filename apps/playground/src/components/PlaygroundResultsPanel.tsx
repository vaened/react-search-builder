import { Box, Chip, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ActiveFiltersBar } from "@vaened/mui-search-builder";
import { currencyFormatter } from "../playground-config";
import { formatDateLabel } from "../playground-search";
import type { PersonStatus, SearchResultState } from "../playground-types";

type PlaygroundResultsPanelProps = {
  result: SearchResultState;
};

export function PlaygroundResultsPanel({ result }: PlaygroundResultsPanelProps) {
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 4,
        borderColor: alpha(theme.palette.common.white, 0.08),
        boxShadow: `0 18px 60px ${alpha(theme.palette.common.black, 0.22)}`,
      }}>
      <Box display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={1.5} mb={2}>
        <Box>
          <Typography variant="overline" sx={{ color: theme.palette.secondary.main, letterSpacing: "0.12em" }}>
            Resultados
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.3 }}>
            Cartera filtrada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {result.total} clientes encontrados, {result.activeCount} activos, {result.debtCount} con deuda. Página {result.currentPage} de{" "}
            {result.totalPages}.
          </Typography>
        </Box>

        <Chip size="small" variant="outlined" sx={{ maxWidth: "100%" }} label={`query: ${result.queryString || "(vacío)"}`} />
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box mb={2}>
        <ActiveFiltersBar />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Cuenta</TableCell>
              <TableCell>País</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Registro</TableCell>
              <TableCell>Último pago</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {result.items.map((person) => (
              <TableRow
                key={person.id}
                hover
                sx={{
                  "&:last-child td": { borderBottom: 0 },
                  "&:hover": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.06),
                  },
                }}>
                <TableCell sx={{ minWidth: 220 }}>
                  <Typography variant="body2" fontWeight={700}>
                    {person.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {person.documentId} {person.email ? `· ${person.email}` : "· sin email"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{person.accountNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {person.uuid}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{person.country}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {person.city}
                  </Typography>
                </TableCell>
                <TableCell>{renderStatus(person.status)}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {currencyFormatter.format(person.balance)}
                  </Typography>
                  {person.hasDebt && <Typography variant="caption" color="warning.main">Saldo pendiente</Typography>}
                </TableCell>
                <TableCell>{formatDateLabel(person.registeredAt)}</TableCell>
                <TableCell>{person.lastPaymentDate ? formatDateLabel(person.lastPaymentDate) : "Sin pago"}</TableCell>
              </TableRow>
            ))}

            {result.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box py={4}>
                    <Typography variant="body1" fontWeight={600}>
                      No hay clientes que coincidan con los filtros actuales.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Ajusta la búsqueda, cambia el índice o limpia algunos filtros para ampliar los resultados.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

function renderStatus(status: PersonStatus) {
  const paletteByStatus: Record<PersonStatus, "success" | "warning" | "error"> = {
    active: "success",
    pending: "warning",
    suspended: "error",
  };

  const labelByStatus: Record<PersonStatus, string> = {
    active: "Activo",
    pending: "Pendiente",
    suspended: "Suspendido",
  };

  return <Chip size="small" color={paletteByStatus[status]} label={labelByStatus[status]} />;
}
