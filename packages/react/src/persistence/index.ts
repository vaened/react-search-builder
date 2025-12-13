/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { EmptyPersistenceAdapter } from "./EmptyPersistenceAdapter";
import { WindowUrlPersistenceAdapter } from "./WindowUrlPersistenceAdapter";

export function url() {
  return new WindowUrlPersistenceAdapter();
}

export function empty() {
  return new EmptyPersistenceAdapter();
}

export { EmptyPersistenceAdapter, WindowUrlPersistenceAdapter as UrlPersistenceAdapter };
