# Form Architecture

The form subsystem is the RFC 15 state and submission layer for `@netscript/fresh`. It is scoped as
a Runtime/Behavior surface because it owns submission identity, CSRF/idempotency, form state, intent
handling, field descriptors, and client enhancement state.

## Public Surface

The public surface is the `@netscript/fresh/form` subpath. `mod.ts` remains a manifest of named
exports. Runtime implementation files are package-local and may be decomposed without changing
consumer import paths.

The current surface groups into:

- reply/result unions for route actions,
- runtime state and field descriptors for rendering,
- native pipeline helpers for `FormData`,
- CSRF and idempotency helpers,
- intent helpers for submit and collection operations,
- Preact rendering/enhancement helpers.

## State Model

The canonical runtime state is `RuntimeFormState<TValues>`. It contains:

- the form identity, action, method, and hidden-token props,
- current values, initial values, and field/form errors,
- submission metadata such as intent, submission id, and CSRF token,
- field descriptors generated from values, constraints, errors, and collection keys,
- HTML form props that can be rendered directly by `<Form>`.

The state is designed for server render first. Client enhancement receives a serializable snapshot
and returns additional form props plus pending and client-side error state.

## Validation Boundary

Validation is behind a package-owned schema-adapter contract. The adapter is responsible for:

- parsing unknown submitted values,
- returning normalized field and form errors,
- exposing conservative HTML constraint metadata,
- exposing default values when the schema supports them.

The planned Standard Schema slice keeps this boundary and adds a library-agnostic adapter without
making `@netscript/fresh/form` re-export Zod, Valibot, ArkType, or any upstream schema package.

## UI Seam

The Fresh package and Fresh UI package meet through values and attributes, not imports.

`FieldDescriptor.controlProps()` emits platform-native props:

- `id`, `name`, `form`, `defaultValue`, `defaultChecked`,
- native constraints such as `required`, `minLength`, `maxLength`, `min`, `max`, and `pattern`,
- ARIA state such as `aria-invalid`, `aria-required`, and `aria-describedby`,
- `data-field-path`, `data-field-invalid`, `data-field-dirty`, and `data-form-id`.

Design-system components narrow these bags and render presentation. This keeps `@netscript/fresh`
free of cross-package presentation imports.

## Failure Boundaries

Expected validation failures are result-shaped and return `invalid` replies. CSRF expiration and
application failures return `error` replies. Redirects are explicit `redirect` replies. Route
handlers own the final HTTP response mapping; the form runtime owns the normalized data shapes.

## Decomposition Direction

The approved 5d5 implementation splits the current monolithic files by responsibility:

- `types.ts` becomes a smaller public type surface plus internal-only support types,
- `field-descriptors.ts` splits descriptor construction, constraints, collections, and ARIA/data
  emission,
- `schema-adapter.ts` splits contract, Standard Schema, and Zod-specific introspection.

Public export names and import paths remain stable through that decomposition.
