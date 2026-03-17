import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

type PlaygroundHeroProps = {
  totalPeople: number;
  pageSize: number;
};

export function PlaygroundHero({ totalPeople, pageSize }: PlaygroundHeroProps) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.25, md: 3 },
        mb: 2,
        borderRadius: 5,
        border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
      }}>
      <Stack spacing={1.25}>
        <Chip
          label="Demo interactiva"
          size="small"
          sx={{
            alignSelf: "flex-start",
            fontWeight: 700,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          }}
        />
        <Typography variant="h4">Customer Search Console</Typography>
        <Typography variant="body1" sx={{ maxWidth: 720, color: alpha(theme.palette.text.primary, 0.78) }}>
          Playground con una cartera realista, filtros consistentes y paginación reseteada desde el store cuando cambia la búsqueda.
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Chip size="small" variant="outlined" label={`${totalPeople} clientes base`} />
          <Chip size="small" variant="outlined" label={`paginación de ${pageSize} filas`} />
          <Chip size="small" variant="outlined" label="filtros sincronizados en URL" />
        </Box>
      </Stack>
    </Paper>
  );
}
