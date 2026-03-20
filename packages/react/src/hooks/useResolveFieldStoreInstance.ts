/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useRef } from "react";
import { useSearchBuilderConfig } from "../contexts/SearchBuilderConfig";
import { createFieldStore, CreateStoreOptions, FieldStore, resolveCreateStoreConfigWithDefaultPersistence } from "../store";

export function useResolveFieldStoreInstance(source?: FieldStore, fallback?: CreateStoreOptions): FieldStore {
  const instance = useRef<FieldStore | null>(null);
  const configuration = useSearchBuilderConfig();

  if (source) {
    return source;
  }

  return (instance.current ??=
    createFieldStore(resolveCreateStoreConfigWithDefaultPersistence(fallback, configuration?.createPersistence)));
}
