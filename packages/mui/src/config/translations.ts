/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { TranslationStrings } from "@vaened/react-search-builder";
import type { Locale } from "../types";

export default {
  en: {
    global: {
      filtersLabel: "Filters",
    },
    searchBar: {
      defaultLabel: "Search for matches by",
      searchAriaLabel: "search",
    },
    indexSelect: {
      tooltip: "Search by",
      defaultLabel: "Select Index",
      dropdownTitle: "Index",
    },
    flagsSelect: {
      tooltip: "Select Filters",
      dropdownTitle: "Available Flags",
      restartButton: "Restart",
    },
    activeFiltersBar: {
      title: "Applied Filters",
      noFilters: "No filters have been applied yet.",
      clearAllTooltip: "Clear all filters",
      clearAllAriaLabel: "delete",
    },
    validations: {
      required: {
        default: "This field is required",
      },
      after: {
        default: "This field must be after {value}",
      },
      before: {
        default: "This field must be before {value}",
      },
      length: {
        default: "This field is invalid",
        invalid_length_string: "This field must be between {min} and {max} characters",
        invalid_length_array: "This field must be between {min} and {max} items",
        invalid_min_length_string: "This field must have at least {min} characters",
        invalid_min_length_array: "This field must be greater than {min} items",
        invalid_max_length_string: "This field must be less than {max} characters",
        invalid_max_length_array: "This field must be less than {max} items",
      },
      range: {
        default: "This field is invalid",
        invalid_range: "This field must be between minimum {min} and maximum {max}",
        invalid_min_range: "This field must be greater than {min}",
        invalid_max_range: "This field must be less than {max}",
      },
    },
  },
  es: {
    global: {
      filtersLabel: "Filtros",
    },
    searchBar: {
      defaultLabel: "Buscar coincidencias por",
      searchAriaLabel: "buscar",
    },
    indexSelect: {
      tooltip: "Buscar por",
      defaultLabel: "Seleccionar Índice",
      dropdownTitle: "Índice",
    },
    flagsSelect: {
      tooltip: "Indicadores",
      dropdownTitle: "Indicadores Disponibles",
      restartButton: "Reiniciar",
    },
    activeFiltersBar: {
      title: "Filtros Aplicados",
      noFilters: "No se han aplicado filtros aún.",
      clearAllTooltip: "Borrar todos los filtros",
      clearAllAriaLabel: "borrar",
    },
    validations: {
      required: {
        default: "Este campo es obligatorio",
      },
      after: {
        default: "Este campo debe ser posterior a {value}",
      },
      before: {
        default: "Este campo debe ser anterior a {value}",
      },
      length: {
        default: "Este campo es inválido",
        invalid_length_string: "Este campo debe tener entre {min} y {max} caracteres",
        invalid_length_array: "Este campo debe tener entre {min} y {max} elementos",
        invalid_min_length_string: "Este campo debe tener al menos {min} caracteres",
        invalid_min_length_array: "Este campo debe tener al menos {min} elementos",
        invalid_max_length_string: "Este campo debe tener menos de {max} caracteres",
        invalid_max_length_array: "Este campo debe tener menos de {max} elementos",
      },
      range: {
        default: "Este campo es inválido",
        invalid_range: "Este campo debe estar entre minimo {min} y máximo {max}",
        invalid_min_range: "Este campo debe estar al menos {min}",
        invalid_max_range: "Este campo debe estar menos de {max}",
      },
    },
  },
} satisfies Record<Locale, TranslationStrings>;
