/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { useRef } from "react";
import { createFieldStore, CreateStoreOptions, FieldStore } from "../store";

export function useResolveFieldStoreInstance(source?: FieldStore, fallback?: CreateStoreOptions): FieldStore {
  const instance = useRef<FieldStore | null>(null);

  if (source) {
    return source;
  }

  return (instance.current ??= createFieldStore(fallback));
}
