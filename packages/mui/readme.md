# @vaened/mui-search-builder

Material UI implementation of React Search Builder.

This package provides ready-to-use UI components on top of `@vaened/react-search-builder`, while keeping the same store, dirty-state, validation, and persistence model.

Use it when you already work with Material UI and want a practical search-form toolkit instead of wiring custom fields by hand.

## Installation

```sh
pnpm add @vaened/mui-search-builder
```

Peer dependencies:

- `react >= 19.2`
- `react-dom >= 19.2`
- `@mui/material ^7.3.5`
- `@emotion/react ^11.14.0`
- `@emotion/styled ^11.0.0`
- `@mui/x-date-pickers ^8.23.0` for date components from `@vaened/mui-search-builder/dates`

## What This Package Gives You

- A `SearchForm` component already wired to the core provider
- A composed `SearchBar` with query, optional index selector, and flags selector
- `OptionSelect` for scalar and multi-value selection
- `ActiveFiltersBar` to show and clear applied filters
- MUI config hooks for icons and translations
- Date components exported from `@vaened/mui-search-builder/dates`

## Entry Points

### Main package

```ts
import {
  SearchForm,
  SearchBar,
  OptionSelect,
  ActiveFiltersBar,
  createFieldStore,
} from "@vaened/mui-search-builder";
```

### Date components

```ts
import { DateFilter, DateRangeFilter } from "@vaened/mui-search-builder/dates";
```

## Quick Start

```tsx
import React from "react";
import { Grid } from "@mui/material";
import {
  ActiveFiltersBar,
  OptionSelect,
  SearchBar,
  SearchForm,
  createFieldStore,
} from "@vaened/mui-search-builder";
import { DateFilter } from "@vaened/mui-search-builder/dates";

const store = createFieldStore({ persistInUrl: true });

export function Example() {
  return (
    <SearchForm
      store={store}
      submitOnChange
      onSearch={(fields) => {
        console.log(fields.toPrimitives());
      }}>
      <Grid size={12}>
        <SearchBar
          indexes={{ person: "Person", email: "Email", document: "Document" }}
          flags={{ isActive: "Active", hasDebt: "Has debt" }}
          defaultIndex="person"
          debounce={450}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <OptionSelect
          type="string[]"
          name="status"
          label="Status"
          defaultValue={[]}
          items={{ active: "Active", archived: "Archived", pending: "Pending" }}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <DateFilter name="createdAt" label="Created at" />
      </Grid>

      <ActiveFiltersBar limitTags={8} />
    </SearchForm>
  );
}
```

## Core Components

### `SearchForm`

`SearchForm` is the Material UI wrapper around the core `SearchFormProvider`.

```tsx
<SearchForm store={store} onSearch={handleSearch} submitOnChange>
  {children}
</SearchForm>
```

It renders a MUI `Grid` container with `component="form"` and forwards the search lifecycle to the core package.

Relevant props:

- `store`
- `onSearch`
- `onChange`
- `submitOnChange`
- `manualStart`
- `autoStartDelay`
- `configuration`
- standard MUI `Grid` layout props such as `spacing`

### `SearchBar`

`SearchBar` is a composed input that can include:

- query input
- optional index selector
- optional flags selector
- submit trigger button

```tsx
<SearchBar
  indexes={{ person: "Person", email: "Email" }}
  flags={{ isActive: "Active", hasDebt: "Has debt" }}
  defaultIndex="person"
  debounce={450}
/>
```

Important props:

- `indexes`
- `flags`
- `name`
- `submittable`
- `debounce`
- `defaultIndex`
- `defaultFlags`
- `defaultValue`
- `onChange`

Notes:

- `debounce` controls native auto-submit timing through the core store
- flag debounce is derived internally from the searchbar debounce
- the search trigger reacts to real `isDirty` state from the store

### `OptionSelect`

`OptionSelect` wraps MUI `Select` and connects it directly to the field store.

It supports:

- scalar fields: `string`, `number`
- array fields: `string[]`, `number[]`
- object maps or array items with `getValue` / `getLabel`
- custom `toHumanLabel` for filter chips and summaries

```tsx
<OptionSelect
  type="string[]"
  name="channels"
  label="Channels"
  defaultValue={[]}
  debounce={500}
  items={{ web: "Website", referral: "Referral", partner: "Partner" }}
/>
```

For array fields, prefer explicit `defaultValue={[]}`.

### `FlagsSelect`

`FlagsSelect` is the compact filter menu used by `SearchBar`, but it can also be used directly.

```tsx
<FlagsSelect
  name="flags"
  defaultValue={[]}
  debounce={600}
  options={{
    isActive: "Active",
    hasDebt: "Has debt",
    isVip: "VIP",
  }}
/>
```

It supports additive and exclusive flag groups.

### `ActiveFiltersBar`

`ActiveFiltersBar` renders applied filters as chips and lets the user remove them individually or clear everything.

```tsx
<ActiveFiltersBar limitTags={8} />
```

Useful props:

- `limitTags`
- `preserveFieldsOrder`
- `readonly`
- `disableAutoSubmit`
- `unstyled`
- `labels`

It reacts to persisted search state, not arbitrary local UI state.

## Date Components

Date components live in the `./dates` subpath.

### `DateFilter`

```tsx
import { DateFilter } from "@vaened/mui-search-builder/dates";

<DateFilter name="createdAt" label="Created at" />
```

### `DateRangeFilter`

```tsx
import { DateRangeFilter } from "@vaened/mui-search-builder/dates";

<DateRangeFilter
  startFieldName="createdFrom"
  endFieldName="createdTo"
  startFieldLabel="Created from"
  endFieldLabel="Created to"
/>
```

These components depend on `@mui/x-date-pickers`.

## Relationship With The Core Package

`@vaened/mui-search-builder` re-exports the core package, so you can still access:

- `createFieldStore`
- `useFilterField`
- `FilterFieldController`
- validators
- serializers

But the primary value of this package is the UI layer.

If you are building fully custom inputs, prefer reading the core package documentation too:

- `packages/react/README.md`

## Dirty State, Debounce, and Submit Behavior

The MUI package does not implement its own search state model.

It delegates to the core package for:

- `submitted`
- `isDirty`
- `dirtyFields()`
- `beforeSubmit`
- field-level `debounce`

That means the visual behavior of components such as `SearchBar` and `ActiveFiltersBar` reflects the real store state.

## Configuration

The package exposes MUI-specific configuration helpers for icons and translations.

```tsx
import { MuiSearchBuilderConfigProvider } from "@vaened/mui-search-builder";
```

Use them if you want to replace the default icons or provide custom translation strings across the component set.

## Package Scope

This package is the Material UI layer.

If you want only the store, hooks, persistence, and validations without any UI dependency, use:

- `@vaened/react-search-builder`

## License

MIT
