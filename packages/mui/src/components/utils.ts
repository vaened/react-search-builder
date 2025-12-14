import { ErrorBody } from "@vaened/react-search-builder";

/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

export function componentMissingStoreError({ component, definition }: { component: string; definition: string }): ErrorBody {
  return {
    title: "MISSING STORE CONFIGURATION",
    problem: `The <${component} /> component requires a "store" to function, but none was found.`,
    solution: {
      title: "You must provide a store using one of the following patterns:",
      content: `
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
      `,
    },
  };
}
