import { createContext, useContext, type ReactNode } from "react";
import type { PersistenceAdapter } from "./PersistenceAdapter";

export type SearchBuilderPersistenceLayerProps = {
  children: ReactNode;
};

export const SearchBuilderPersistenceContext = createContext<(() => PersistenceAdapter) | null>(null);

export function useSearchBuilderPersistence() {
  return useContext(SearchBuilderPersistenceContext) ?? undefined;
}
