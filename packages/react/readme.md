# @vaened/react-search-builder

Headless search form state management for React.

This package contains the core store, hooks, validations, serializers, and form orchestration primitives behind React Search Builder.

## Installation

```sh
pnpm add @vaened/react-search-builder
```

Peer dependencies:

- `react >= 19.2`
- `react-dom >= 19.2`

## What You Get

- A centralized field store for search forms
- Per-field subscriptions to avoid full-form rerenders
- Typed serializers for `string`, `number`, `boolean`, `date`, and array variants
- Cross-field validations such as `range`, `before`, `after`, and `when`
- Persistence adapters, including URL persistence
- Native `submitted` and `isDirty` tracking per field
- Field-level `debounce` for auto-submit flows
- Store-level `beforeSubmit` configuration

## Entry Points

### Main package

```ts
import { createFieldStore, useFilterField, FilterFieldController } from "@vaened/react-search-builder";
```

### Form context entry point

```ts
import { SearchFormProvider, useSearchBuilder, useSearchState } from "@vaened/react-search-builder/core";
```

## Quick Start

```tsx
import React from "react";
import { createFieldStore, useFilterField } from "@vaened/react-search-builder";
import { SearchFormProvider } from "@vaened/react-search-builder/core";

const store = createFieldStore({ persistInUrl: true });

function QueryField() {
  const { value, set } = useFilterField(store, {
    type: "string",
    name: "q",
    defaultValue: "",
    debounce: 450,
    humanize: (current) => (current ? `Query: ${current}` : undefined),
  });

  return <input value={value ?? ""} onChange={(event) => set(event.target.value)} placeholder="Search..." />;
}

function StatusField() {
  const { value, set } = useFilterField(store, {
    type: "string[]",
    name: "status",
    defaultValue: [],
    humanize: (values) => values.map((item) => ({ value: item, label: `Status: ${item}` })),
  });

  const selected = value ?? [];

  return (
    <button onClick={() => set(selected.length ? [] : ["active"])}>
      {selected.length ? "Clear status" : "Select active"}
    </button>
  );
}

export function Example() {
  return (
    <SearchFormProvider
      store={store}
      submitOnChange
      onSearch={(fields) => {
        console.log(fields.toPrimitives());
      }}>
      <QueryField />
      <StatusField />
      <button type="submit">Search</button>
    </SearchFormProvider>
  );
}
```

## Core Concepts

### `FieldStore`

The store is the single source of truth for the form.

```ts
const store = createFieldStore({ persistInUrl: true });
```

Useful methods:

- `store.set(name, value, { autoSubmit })`
- `store.batch((transaction) => { ... }, { autoSubmit })`
- `store.flush(name, value)`
- `store.reset(values?)`
- `store.hasDirtyFields()`
- `store.dirtyFields()`
- `store.configure({ beforeSubmit })`
- `store.configuration()`

### `useFilterField`

Use this hook when you want a headless field binding for custom inputs.

```tsx
const { value, errors, set, field } = useFilterField(store, {
  type: "number",
  name: "page",
  defaultValue: 1,
});
```

Relevant metadata on `field`:

- `field.submitted`
- `field.isDirty`
- `field.isHydrating`
- `field.errors`
- `field.debounce`

### `FilterFieldController`

Use this when your component already expects `value` and `onChange`, but you still want the library to normalize field wiring.

```tsx
<FilterFieldController
  store={store}
  name="program_ids"
  type="string[]"
  defaultValue={[]}
  control={({ value, onChange, errors }) => (
    <MyCustomMultiSelect value={value ?? []} onChange={onChange} errors={errors} />
  )}
/>
```

> For array fields, prefer passing an explicit `defaultValue` such as `[]`.

### `SearchFormProvider`

Use this provider to connect a store with submit orchestration and search callbacks.

```tsx
<SearchFormProvider store={store} onSearch={handleSearch} submitOnChange>
  {children}
</SearchFormProvider>
```

Relevant props:

- `store`
- `onSearch`
- `onChange`
- `submitOnChange`
- `beforeSubmit`
- `manualStart`
- `autoStartDelay`
- `configuration`

### `SearchBuilderConfigProvider`

`SearchBuilderConfigProvider` provides translations and icons to the subtree.

```tsx
import { SearchBuilderConfigProvider } from "@vaened/react-search-builder/core";

function App() {
  return (
    <SearchBuilderConfigProvider translations={{}} icons={{}}>
      <SearchView />
    </SearchBuilderConfigProvider>
  );
}
```

## Dirty State and Submit Semantics

Each field tracks:

- `value`: current value in the store
- `submitted`: last value successfully submitted
- `isDirty`: whether `value` differs from `submitted`

`dirtyFields()` is derived from real submitted state, not from accumulated interaction history.

## Debounce

`debounce` delays auto-submit, not store updates.

- `store.set(...)` updates the value immediately
- `isDirty` updates immediately
- only the automatic submit is delayed

```tsx
useFilterField(store, {
  type: "string",
  name: "q",
  defaultValue: "",
  debounce: 450,
});
```

## Store-Level `beforeSubmit`

Use store-level `beforeSubmit` for reusable submit policy that should live with the store instance.

```ts
store.configure({
  beforeSubmit: ({ dirtyFields, transaction }) => {
    if (dirtyFields.some((name) => name !== "page")) {
      transaction.set("page", 1);
    }
  },
});
```

`SearchFormProvider` will execute store-level `beforeSubmit` before the provider-level `beforeSubmit` prop.

## Persistence

### URL Persistence

Use this when you want browser URL persistence without router-specific integration.

```ts
const store = createFieldStore({ persistInUrl: true });
```

### React Router

Use this when the subtree creates stores with `useSearchStore()` and should persist through `react-router-dom`.

```tsx
import { useSearchStore } from "@vaened/react-search-builder";
import { ReactRouterPersistenceLayer } from "@vaened/react-search-builder/persistence/react-router";

function SearchPage() {
  return (
    <ReactRouterPersistenceLayer>
      <SearchView />
    </ReactRouterPersistenceLayer>
  );
}

function SearchView() {
  const store = useSearchStore();
  return null;
}
```

This subpath depends on `react-router-dom` and fills the default persistence for the subtree.

### Custom Persistence

Use this when you need a persistence backend that is not covered by the built-in URL or React Router integrations.

Implement the `PersistenceAdapter` contract and pass it to `createFieldStore({ persistence })`.

The adapter must:

- return a `PrimitiveFilterDictionary` from `read()`
- write the next filter state from `write(values, whitelist?)`
- notify external navigation changes through `subscribe(callback)`

For browser URL adapters, the important part is not just writing the URL. The adapter must also subscribe to external history changes so back/forward navigation can rehydrate the store correctly.

If you are extending the library itself, reuse the same helpers and patterns used by the built-in adapters:

- `readDictionaryFromSearch(...)`
- `createSearchParams(...)`
- `NavigationChannel` for router-driven integrations

## Validation

Validation is field-driven. Each field can expose a `validate(context) => ValidationSchema` function, and that function receives the current `registry`.

That means rules can be:

- static
- conditional
- cross-field
- composed

```ts
import { allOf, required, range, when } from "@vaened/react-search-builder";
```

Built-in rules:

- `required()`
- `filled({ field })`
- `length({ min, max })`
- `range({ min, max })`
- `before({ value })`
- `after({ value })`
- `not(rule)`
- `when(...)`
- `allOf(...)`

Example:

```tsx
useFilterField(store, {
  type: "number",
  name: "maxPrice",
  defaultValue: null,
  validate: ({ registry }) => {
    const minPrice = registry.get("minPrice")?.value;

    return [
      when({
        is: filled({ field: "minPrice" }),
        apply: [after({ value: minPrice as number })],
      }),
      range({ min: 0 }),
    ];
  },
});
```

Validation errors are normalized into field state as:

- `name`
- `code`
- `message`
- `params`

The default validator runs rules in fail-fast mode, so the first failing rule wins. If you need a different aggregation strategy, provide a custom `validator` when creating the store.

## Serialization

Default serializers are resolved from `type`, but you can override them per field.

```ts
useFilterField(store, {
  type: "date",
  name: "createdAt",
  defaultValue: null,
});
```

Supported built-in types:

- `string`
- `number`
- `boolean`
- `date`
- `string[]`
- `number[]`
- `boolean[]`
- `date[]`

## Package Scope

This package is the headless core. For Material UI components, use:

- `@vaened/mui-search-builder`

## License

MIT
