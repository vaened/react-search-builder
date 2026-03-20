/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Paths, PathValue } from "../internal";
import type { PersistenceAdapter } from "../persistence/PersistenceAdapter";

export type TranslationStrings = {
  [key: string]: string | TranslationStrings;
};

export type IconSet = Record<string, ReactNode>;

export type TranslateOptions<D extends string | undefined> = {
  text?: string;
  params?: Record<string, string>;
  fallback?: D;
};

export type GenericTranslator<T extends TranslationStrings> = <P extends Paths<T>>(
  key: P,
  options?: TranslateOptions<string | undefined>,
) => string | undefined;

export type SearchBuilderConfigContextState<T extends TranslationStrings, I extends IconSet> = {
  icon: (key: keyof I) => ReactNode;
  translate: GenericTranslator<T>;
  createPersistence?: () => PersistenceAdapter;
};

export type SearchBuilderPersistenceLayerProps = {
  registerDefaultPersistence: (resolver: () => PersistenceAdapter) => void;
  unregisterDefaultPersistence: () => void;
};

export type SearchBuilderConfigProviderProps<T extends TranslationStrings, I extends IconSet> = {
  children: ReactNode;
  translations: T;
  icons: I;
  persistenceLayer?: React.ComponentType<SearchBuilderPersistenceLayerProps>;
};

export function translateFrom<T extends TranslationStrings, P extends Paths<T>>(
  translation: T,
  key: P,
  options?: TranslateOptions<string | undefined>,
): string | undefined {
  const value = getByPath(translation, key);

  if (typeof value !== "string") {
    return options?.fallback;
  }

  return options?.params ? value.replace(/\{(\w+)\}/g, (_, k) => String(options.params?.[k] ?? "")) : value;
}

export const SearchBuilderConfigContext = createContext<SearchBuilderConfigContextState<any, any> | null>(null);

export function useSearchBuilderConfig<T extends TranslationStrings = TranslationStrings, I extends IconSet = IconSet>() {
  return useContext(SearchBuilderConfigContext) as SearchBuilderConfigContextState<T, I> | null;
}

export function SearchBuilderConfigProvider<T extends TranslationStrings = TranslationStrings, I extends IconSet = IconSet>({
  translations,
  icons,
  persistenceLayer: PersistenceLayer,
  children,
}: SearchBuilderConfigProviderProps<T, I>): React.ReactElement {
  const [registeredPersistence, setRegisteredPersistence] = useState<(() => PersistenceAdapter) | undefined>(undefined);

  const registerDefaultPersistence = useCallback((resolver: () => PersistenceAdapter) => {
    setRegisteredPersistence(() => resolver);
  }, []);

  const unregisterDefaultPersistence = useCallback(() => {
    setRegisteredPersistence(undefined);
  }, []);

  const value = useMemo<SearchBuilderConfigContextState<T, I>>(() => {
    const icon: SearchBuilderConfigContextState<T, I>["icon"] = (key) => icons[key];

    const translate: GenericTranslator<T> = (key, options) => translateFrom(translations, key, options);

    return {
      icon,
      translate,
      createPersistence: registeredPersistence,
    };
  }, [icons, registeredPersistence, translations]);

  const content = <SearchBuilderConfigContext.Provider value={value}>{children}</SearchBuilderConfigContext.Provider>;

  if (!PersistenceLayer) {
    return content;
  }

  return (
    <>
      <PersistenceLayer
        registerDefaultPersistence={registerDefaultPersistence}
        unregisterDefaultPersistence={unregisterDefaultPersistence}
      />
      {registeredPersistence ? content : null}
    </>
  );
}

function isIndexable(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function getByPath<T extends TranslationStrings, P extends Paths<T>>(obj: T, path: P): PathValue<T, P> | undefined {
  let acc: unknown = obj;

  for (const key of path.split(".")) {
    if (isIndexable(acc) && key in acc) {
      acc = acc[key];
    } else {
      return undefined;
    }
  }

  return acc as PathValue<T, P>;
}
