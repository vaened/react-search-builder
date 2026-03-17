import type { PersonCountry, PersonStatus } from "./playground-types";

export const PAGE_SIZE = 5;

export const indexes = {
  person: {
    label: "Persona",
    description: "Busca por documento, nombre completo o correo electrónico.",
  },
  account: {
    label: "Cuenta",
    description: "Busca por número de cuenta o identificador UUID.",
  },
} as const;

export const flags = {
  additives: {
    onlyActive: {
      label: "Solo activos",
      description: "Muestra únicamente clientes con estado activo.",
    },
    withDebt: {
      label: "Con deuda",
      description: "Filtra clientes con saldo pendiente.",
    },
    withoutEmail: {
      label: "Sin email",
      description: "Encuentra clientes que aún no registran correo.",
    },
    vipOnly: {
      label: "VIP",
      description: "Muestra clientes marcados como prioritarios.",
    },
  },
} as const;

export const statusOptions: Array<{ value: PersonStatus; label: string }> = [
  { value: "active", label: "Activo" },
  { value: "pending", label: "Pendiente" },
  { value: "suspended", label: "Suspendido" },
];

export const countryOptions: Array<{ value: PersonCountry; label: string }> = [
  { value: "Peru", label: "Perú" },
  { value: "Colombia", label: "Colombia" },
  { value: "Chile", label: "Chile" },
  { value: "Mexico", label: "México" },
];

export const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
