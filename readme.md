# React Search Builder

[![Tests](https://github.com/vaened/react-search-builder/actions/workflows/tests.yml/badge.svg)](https://github.com/vaened/react-search-builder/actions/workflows/tests.yml)
[![Software License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](license)

Centralized state management for search forms.

Strict typing, cross-field validations, and automatic synchronization with the URL or any persistence mechanism.

### 🛠️ Installation

**With Material UI**

```sh
pnpm add @vaened/mui-search-builder
```

**Headless / Custom UI**

```sh
pnpm add @vaened/react-search-builder
```

### 📋 Problem It Solves

Advanced search forms usually require:

- Bidirectional synchronization between multiple inputs.
- Cross-field validations (ranges, field dependencies).
- Manual parsing of query strings.
- Constant conversion between string, number, Date, etc.
- State persistence across reloads or navigation.

In practice, this logic often ends up scattered across components, effects, and ad-hoc utilities.

_**React Search Builder** centralizes all these responsibilities into a single Store._

### 💡 Quick Example (Material UI)

A typical **Customer Search** form with URL persistence, mixed filter types, and an active filters summary.

```tsx
const store = useSearchStore({ persistInUrl: true });

<SearchForm store={store} onSearch={console.log} spacing={2}>
  <DateRangeFilter startFieldName="createdFrom" endFieldName="createdTo" startFieldLabel="Created from" endFieldLabel="Created to" />

  <DateFilter name="lastActivityAt" label="Last activity" />

  <OptionSelect
    type="string[]"
    name="channels"
    label="Acquisition channels"
    items={{ web: "Website", referral: "Referral", partner: "Partner" }}
  />

  <SearchBar
    indexes={{ fullName: "Name", email: "Email", document: "Document" }}
    flags={{ isActive: "Active", hasDebt: "Has debt", isVip: "VIP" }}
    defaultIndex="fullName"
  />

  <ActiveFiltersBar limitTags={8} />
</SearchForm>;
```

### 📦 Packages and Features

The project is split into two complementary packages:

- `@vaened/react-search-builder` (Core)  
  Pure logic and state management. Use it if you want to build your own UI or integrate the system into an existing component library.

  - **Universal Integration (`FilterFieldController`)**: Connect any UI component (from a simple native `<input/>` to complex selectors from libraries like AntD or Chakra). You get `value`, `onChange`, and `errors` ready to use.

  - **Asynchronous Hydration**: Support for async serializers that pause initialization until data is ready and verified, preventing inconsistent states.

  - **Declarative Validation**: Define complex conditional and cross-field business rules using the `when` function, keeping your components clean of if/else logic.

  - **Performance**: When typing in a field, only that component updates. The rest of the form stays static. This keeps the UI smooth even with dozens of filters, avoiding unnecessary re-renders across the app.

  - **Data Humanization**: Turn technical values (IDs, codes) into user-friendly text. Ideal for filter summaries or search “chips”.

- `@vaened/mui-search-builder` (UI Kit)  
  Ready-to-use components based on Material UI. Designed for the most common use cases in admin dashboards and backoffice apps.

  - **Unified SearchBar**: A composed component that integrates three features into one visual row:

    - **Query Input**: With automatic debounce.
    - **Index Select**: Lets the user change the search criterion without taking extra UI space.
    - **Flags**: Quick boolean filters integrated visually.

  - **Validated DateRangeFilter**: Abstracts the complexity of handling two DatePickers. It automatically enforces range constraints: selecting a start date disables earlier days in the end date, and vice versa, ensuring a valid range.

  - **Polymorphic OptionSelect**: A flexible wrapper around MUI Select that accepts multiple data shapes. You can pass a simple dictionary or an array of complex objects with accessors (getValue, getLabel), removing the need for manual `.map()` in JSX.

  - **Reactive ActiveFiltersBar**: Closes the UX loop by visually showing applied filters. Users can remove individual filters or clear everything with one click, automatically syncing with the URL and the Store.

### ✨ Design Principles

- #### 🧠 Headless & Reactive Architecture

  State lives completely decoupled from React’s component tree.

  - **Atomic Subscriptions**  
    Each field subscribes individually to the Store. Typing in an input does not re-render the whole form—only the affected component.

  - **Inversion of Control**  
    Enables communication between sibling components (for example, a _Country_ selector clearing a _City_ selector) without prop drilling.

  > Internally, it guarantees concurrent consistency through `useSyncExternalStore`.

- #### 🔌 Decoupled Persistence (Persistence Adapters)

  The storage mechanism is completely agnostic to business logic.

  - **Interchangeable Adapters**  
    `WindowUrlPersistenceAdapter` (included) syncs with `window.location`, but the architecture supports async adapters for **Next.js**, **React Router**, or storage in **LocalStorage**.

  - **Smart Hydration**  
    The Store manages loading states (`isHydrating`) and task queues (`TaskMonitor`), ensuring the form is not interactive until the URL has been parsed and validated correctly.

- #### 🛡️ Strict Typing and Serialization

  Automatic and transparent data transformation between the persistence layer and the application layer.

  - **Declarative Definition**  
    Configure fields as `date`, `number`, `boolean`, or array variants (`number[]`, `string[]`).

  - **Type Inference**  
    TypeScript automatically infers the value type returned by hooks based on the field configuration.

- #### ✅ Validation Oriented to the Filter Domain

  Validation rules are pure and executed in the Store, not in the UI.

  - **Composed Rules**
    Native support for complex validation strategies (`allOf` with `failFast` or error collection).

  - **Domain Validations**
    - Structural: `required`, `length`
    - Relational: `range`, `after`, `before` (cross-field validation between dates or numbers)
    - Conditional: `when` (run validations on field A only if field B matches a condition)

### 📚 Documentation

This repository provides a headless core and a ready-to-use Material UI implementation.  
Each package has its own detailed documentation:

- **Core (Headless)**

  - `@vaened/react-search-builder`  
    Architecture, store, hooks, validation system, and persistence adapters.

- **Material UI Kit**
  - `@vaened/mui-search-builder`  
    Prebuilt components and real-world examples using Material UI.

Use the **Core** package if you need full control over the UI.  
Use the **MUI** package if you use Material UI and want a set of ready-to-use components.

### 📄 License

This library is licensed under the MIT license. For more information, see the `license` file.
