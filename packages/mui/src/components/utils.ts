import { FieldStore } from "@vaened/react-search-builder";

/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

export function validateStoreAvailabilityInComponent(
  store: FieldStore | undefined | null,
  component: string,
  definition: string
): asserts store is FieldStore {
  if (store) {
    return;
  }

  throw new Error(`
MISSING STORE CONFIGURATION
================================================================

PROBLEM: The <${component} /> component requires a "store" to function, but none was found.
It seems you are trying to use this component outside of a <SearchBuilder> context without providing a store manually.

SOLUTION: You must provide a store using one of the following patterns:

PATTERN 1: Context Integration
  Wrap your component within the main provider:

  <SearchForm>
    <${component} ${definition} />
  </SearchForm>

PATTERN 2: Manual Injection
  Pass the store instance explicitly via props:

  const store = useSearchStore();
  // ...
  <${component} store={store} ${definition} />

================================================================
    `);
}
