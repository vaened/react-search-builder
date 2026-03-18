# @vaened/react-search-builder

Headless search form state management for React.

This package contains the core store, hooks, validations, serializers, and form orchestration primitives behind React Search Builder.

Use it when you want full control over the UI and do not want your search logic tied to a component library.

## Installation

```sh
pnpm add @vaened/react-search-builder
```

Peer dependencies:

- `react >= 19.2`
- `react-dom >= 19.2`

## What This Package Gives You

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

Import the store, hooks, serializers, validations, and controller from:

```ts
import { createFieldStore, useFilterField, FilterFieldController } from "@vaened/react-search-builder";
```

### Form context entry point

Import form orchestration primitives from:

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

Create a store once and use it as the single source of truth for the form.

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

Use this when building custom headless inputs.

```tsx
const { value, errors, set, field } = useFilterField(store, {
  type: "number",
  name: "page",
  defaultValue: 1,
});
```

Important field metadata available through `field`:

- `field.submitted`
- `field.isDirty`
- `field.isHydrating`
- `field.errors`
- `field.debounce`

### `FilterFieldController`

Use this when your UI component already expects `value` and `onChange`, but you want the library to normalize event handling for you.

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

For array fields, prefer passing an explicit `defaultValue` such as `[]`.

### `SearchFormProvider`

`SearchFormProvider` connects the store with submit orchestration.

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

## Dirty State and Submit Semantics

Each registered field tracks:

- `value`: current value in the store
- `submitted`: last value successfully submitted
- `isDirty`: whether `value` differs from `submitted`

This lets the library distinguish between:

- current UI state
- committed search state
- pending changes still not submitted successfully

`dirtyFields()` is derived from real submitted state, not from accumulated interaction history.

## Debounce

`debounce` is metadata on the field, not delayed store state.

That means:

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

If you need reusable form policy, configure it on the store instance.

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

Quick URL persistence:

```ts
const store = createFieldStore({ persistInUrl: true });
```

Custom persistence:

```ts
import { createFieldStore, type PersistenceAdapter } from "@vaened/react-search-builder";

const persistence: PersistenceAdapter = {
  read: async () => new URLSearchParams(window.location.search),
  write: async (params) => {
    const search = params.toString();
    window.history.replaceState({}, "", search ? `?${search}` : window.location.pathname);
  },
};

const store = createFieldStore({ persistence });
```

## Validation

Built-in validators are pure and store-driven.

```ts
import { allOf, required, range, when } from "@vaened/react-search-builder";
```

Examples:

- `required()`
- `length({ min, max })`
- `range({ min, max })`
- `before("endDate")`
- `after("startDate")`
- `when(...)`
- `allOf(...)`

## Serialization

The package resolves default serializers automatically from `type`, but you can override them per field.

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

This package is the headless core.

If you want ready-made Material UI components such as `SearchBar`, `OptionSelect`, `DateFilter`, or `ActiveFiltersBar`, use:

- `@vaened/mui-search-builder`

## License

MIT
