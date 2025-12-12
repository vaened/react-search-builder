/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import {
  Paths,
  SearchBuilderConfigProvider,
  translateFrom,
  useSearchBuilderConfig,
  type GenericTranslator,
} from "@vaened/react-search-builder";
import React, { useMemo } from "react";
import { Locale } from "../types";
import defaultIcons from "./icons";
import defaultTranslations from "./translations";

export type MuiIcons = typeof defaultIcons;

export type MuiTranslations = (typeof defaultTranslations)["en"];
export type Translator = GenericTranslator<MuiTranslations>;
export type TranslationKey = Paths<MuiTranslations>;

const fallbackConfig = {
  icon: (key: keyof MuiIcons) => defaultIcons[key],
  translate: ((key, options) => {
    return translateFrom(defaultTranslations["en"], key, options);
  }) as Translator,
};

export function useMuiSearchBuilderConfig() {
  const context = useSearchBuilderConfig<MuiTranslations, MuiIcons>();

  return context ?? fallbackConfig;
}

export type MuiSearchBuilderConfigProviderProps = {
  children: React.ReactNode;
  locale?: Locale;
  translations?: Partial<MuiTranslations>;
  icons?: Partial<MuiIcons>;
};

export function MuiSearchBuilderConfigProvider({ children, locale = "en", translations, icons }: MuiSearchBuilderConfigProviderProps) {
  const muiTranslations = useMemo(() => {
    if (translations) {
      return { ...defaultTranslations[locale], ...translations };
    }
    return defaultTranslations[locale];
  }, [locale, translations]);

  const tablerIcons = useMemo(
    () => ({
      ...defaultIcons,
      ...icons,
    }),
    [icons]
  );

  return (
    <SearchBuilderConfigProvider<MuiTranslations, MuiIcons> translations={muiTranslations} icons={tablerIcons}>
      {children}
    </SearchBuilderConfigProvider>
  );
}
