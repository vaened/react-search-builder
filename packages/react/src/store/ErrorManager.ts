/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { FilterName } from "../field";

export class ErrorManager {
  #errors: Set<FilterName> = new Set();

  add(name: FilterName) {
    this.#errors.add(name);
  }

  remove(name: FilterName) {
    this.#errors.delete(name);
  }

  exists(name: FilterName) {
    return this.#errors.has(name);
  }

  has() {
    return this.#errors.size > 0;
  }

  clear() {
    this.#errors.clear();
  }
}
