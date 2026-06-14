# [5d5] `@netscript/fresh/form` — Phase 1 Research

Status: IN PROGRESS — findings appended incrementally.

## 1. MEASURE-FIRST

| Metric | Value | Source artifact |
|--------|-------|-----------------|
| `deno doc --lint` total errors | 74 | `deno-doc-lint.txt` |
| `missing-jsdoc` | 60 | `deno-doc-lint.txt` |
| `private-type-ref` | 11 | `deno-doc-lint.txt` |
| `missing-return-type` (doc lint) | 3 | `deno-doc-lint.txt` |
| Files with doc-lint errors | 4 | `deno-doc-lint.txt` |
| `deno publish --dry-run` total problems | 62 | `dry-run-raw.txt` / `deno-publish-dry-run.txt` |
| `excluded-module` errors | 58 | `dry-run-raw.txt` |
| `missing-explicit-return-type` (dry-run) | 4 | `dry-run-raw.txt` |
| Form files in publish graph | 23 | `dry-run-raw.txt` (mod.ts + 22 deps) |
| Files > layer cap (475 lines) | 3 | `wc -l` on `packages/fresh/form/*` |
| Largest file | `schema-adapter.ts` 576 lines | `wc -l` |
| Second largest | `types.ts` 474 lines | `wc -l` |
| Third largest | `field-descriptors.ts` 518 lines | `wc -l` |

### File-level error distribution (doc lint)

| File | Errors | Kinds |
|------|--------|-------|
| `types.ts` | 62 | `missing-jsdoc` + `private-type-ref` |
| `enhancement.tsx` | 6 | `missing-jsdoc` (4), `private-type-ref` (1), `missing-return-type` (1) |
| `form.tsx` | 3 | `missing-jsdoc`, `private-type-ref`, `missing-return-type` |
| `form-region.tsx` | 3 | `missing-jsdoc`, `private-type-ref`, `missing-return-type` |

### `private-type-ref` detail

| Public symbol | Private referenced type | Location |
|---------------|------------------------|----------|
| `applyCollectionStrategy<TProps extends IntentButtonProps>` | `IntentButtonProps` | `enhancement.tsx:39` |
| `Form<TValues>` | `FormProps` | `form.tsx:21` |
| `FormRegion` | `FormRegionProps` | `form-region.tsx:10` |
| `RuntimeFormState["fields"]` | `FieldDescriptorMap<TValues>` | `types.ts:345` |
| `RuntimeFormState["constraints"]` | `FieldConstraints` | `types.ts:346` |
| `RuntimeFormState["formProps"]` | `FormElementProps` | `types.ts:347` |
| `RuntimeFormState["csrfInputProps"]` | `FormCsrfInputProps` | `types.ts:348` |
| `FormEnhancementSnapshot["constraints"]` | `FieldConstraints` | `types.ts:364` |
| `FormEnhancementSnapshot["formProps"]` | `FormElementProps` | `types.ts:365` |
| `FormEnhancementSnapshot["csrfInputProps"]` | `FormCsrfInputProps` | `types.ts:366` |
| `FormEnhancementState["formProps"]` | `EnhancedFormProps` | `types.ts:405` |

### `deno publish --dry-run` excluded-module detail

The dry-run was run from the root workspace against `@netscript/fresh`. 58 `excluded-module` errors appear for every module in `packages/fresh/*` because the root workspace excludes `packages/fresh/` (see blocker below). 23 of those are the `./form` graph; the other 35 are non-form surfaces (`builders`, `defer`, `error`, `hooks`, `interactive`, `mod.ts`, `query`, `route`, `server`, `streams`, `utils`). 3 return-type errors are inside `./form`; the 4th is `packages/fresh/query/query-island.tsx`.

**Root blocker:** the workspace exclude for `packages/fresh/` makes the whole package unpublishable from root. Resolution is umbrella-level and is tracked as drift entry `D-5d5-1` below.

## 2. PUBLIC SURFACE MAP

`packages/fresh/form/mod.ts` exports 39 public symbols (from `form-symbols.json` / `form-doc-current.json`):

### Constants / tokens
- `CSRF_COOKIE_NAME`, `CSRF_FIELD_NAME`
- `SUBMISSION_ID_FIELD_NAME`
- `INTENT_FIELD_NAME`

### CSRF / idempotency helpers
- `generateCsrfToken`, `readCsrfToken`, `verifyCsrfToken`, `setCsrfCookie`
- `generateSubmissionId`

### Error surface
- `FormErrors`, `FormSchemaValidationError`, `createEmptyFormErrors`, `firstFieldError`, `toFormErrors`

### Enhancement / JSX surface
- `createFormEnhancementSnapshot`
- `applyCollectionStrategy`
- `useFormEnhancement`
- `getSubmissionHiddenInputProps`
- `Form` (component)
- `FormRegion` (component)

### Intent surface
- `applyIntentOperation`
- `collectionIntent`
- `parseFormIntent`
- `submitIntent`

### Pipeline helpers
- `formDataToRawValues`
- `normalizeFormValues`

### Pagination surface
- `buildPaginationState`, `resolvePagination`
- `PaginationInput`, `PaginationState`

### Form state / runtime
- `FormState` (type)
- `resolveFormState`

### Author-facing types (from `types.ts`)
- `FormValues`
- `FormPageMode`
- `FormFieldErrors`
- `FormIntent`
- `RuntimeFormState`
- `FormEnhancementSnapshot`
- `FormCollectionStrategyMode`, `FormCollectionStrategy`
- `FormEnhancementOptions`
- `FormEnhancementState`
- `FormPageInvalidateContext`, `FormPageProps`

### Public type graph
The types file already exports most of the types the doc lint complains are private (`FieldConstraints`, `FormElementProps`, `FormCsrfInputProps`, `EnhancedFormProps`, `IntentButtonProps`, `FormProps`, `FormRegionProps`, `FieldDescriptorMap`). The errors occur because those symbols are declared with `export interface`/`export type` in `types.ts` but `deno doc --lint` considers them "private" relative to the public API surface exported by `mod.ts` — i.e. `mod.ts` does not re-export them, even though `types.ts` exports them. The public function signatures reference them, but consumers cannot name them. Fix: either re-export these supporting types from `mod.ts`, or inline/narrow the public signatures so they no longer leak non-re-exported types.

## 3. INTERNAL SEAMS (DECOMPOSITION RAW MATERIAL)

| File | Lines | Role | Decomposition signal |
|------|-------|------|---------------------|
| `schema-adapter.ts` | 576 | Translates arbitrary validation libraries → `FieldDescriptor` list + validates raw values | Over-cap; split into `schema-adapter/contract.ts`, `standard-schema.ts`, `vendor-adapters.ts` |
| `types.ts` | 474 | Author-facing + internal type kitchen sink | Split by audience: `types.ts` (public), `_internal/types.ts` (descriptor/pipeline internals) |
| `field-descriptors.ts` | 518 | Builds field descriptors from schema, constraints, aria/data-* contracts | Split into `field-descriptors/` with `descriptor.ts`, `constraints.ts`, `collection.ts` |
| `state.ts` | 326 | Runtime state snapshot (`FormState`, `RuntimeFormState`) | Already focused; keep small after type split |
| `pipeline.ts` | 259 | `formDataToRawValues`, `normalizeFormValues` | Keep with extraction helpers |
| `intent.ts` | 320 | Intent parsing, collection intents, apply operation | Consider `intent/` split if it grows |
| `reply.ts` | 213 | Server reply shape helpers | Keep |
| `enhancement.tsx` | 246 | Island enhancement hook + collection strategy JSX | Split state-only (`useFormEnhancement`) from JSX helpers (`applyCollectionStrategy`, `getSubmissionHiddenInputProps`) |

### Important: exported specifier lock
The umbrella plan (`plan.md`) forbids changing export specifiers or public type names without supervisor drift. Decomposition must preserve every `mod.ts` export path and name.

## 4. fresh ↔ fresh-ui SEAM ANALYSIS

Sources: `packages/fresh-ui/registry/components/ui/form-field.tsx`; `packages/fresh-ui/registry/components/ui/control-props.ts`; `packages/fresh-ui/docs/l0-conventions.md`; `packages/fresh/form/types.ts` lines 82–141, 274–297; `packages/fresh/form/field-descriptors.ts` lines 101–172.

### 4.1 fresh-ui inventory (L2 registry presentation)

`FormField` is a Layer-2 registry component. Its props are intentionally small and presentation-only:

| Prop | Type | Role |
|------|------|------|
| `label` | `Renderable` | Visible label rendered via the L1 `Label` primitive |
| `name` | `string` | Becomes `<Label htmlFor={name}>` and should match the control `id` |
| `required` | `boolean` | Visual required indicator on the label |
| `error` | `string` | Single visible error message (renders an `ns-field__error-row`) |
| `helpText` | `string` | Helper text shown when no error is present |
| `children` | `Renderable` | The actual control (Input, Select, Textarea) |
| `class` | `string` | Optional wrapper class |
| spread | `JSX.HTMLAttributes<HTMLDivElement>` | Extra wrapper attributes (excluding `children`/`class`) |

`FormField` does **not** import anything from `@netscript/fresh/form`. It expects the consumer to translate the form runtime's state into these props.

`control-props.ts` is the L2-side adapter for the `controlProps(...)` contract already emitted by fresh field descriptors:

```ts
interface ControlPropSource {
  controlProps(overrides?: Record<string, unknown>): Record<string, unknown>;
}
```

It exports three narrowing helpers:

- `getInputProps(field, overrides?) -> InputControlProps`
- `getSelectProps(field, overrides?) -> SelectControlProps`
- `getTextareaProps(field, overrides?) -> TextareaControlProps`

Each helper coerces the descriptor's `controlProps()` map into a statically-typed Preact prop subset (id, name, form, defaultValue/defaultChecked, `aria-*`, constraint attributes, etc.) while discarding unknown values. This is the exact boundary fresh should preserve: fresh emits a broad, runtime-derived prop bag; fresh-ui narrows it to a safe JSX element contract.

### 4.2 L0 attribute contract

`l0-conventions.md` establishes the rules this seam must respect:

- **Interactive state is platform attributes**: `data-part`, `data-state`, ARIA, and native attributes are the styling/behavior contract; classes are for copy-owned styling only.
- **L1 emits data + ARIA, not `ns-*` classes**: the runtime/fresh package should emit attributes, not component classes.
- **Native-first**: semantic form controls, native validation attributes, and platform popover/dialog behavior are preferred over JS state.
- **Motion rule**: animations must declare reduced-motion behavior; any future form pending/error transition in fresh-ui must respect this.
- **Copy fidelity**: registry files are copied into apps; fresh's runtime contract must remain stable so copied L2 components do not silently break when fresh upgrades.

### 4.3 Mapping fresh runtime state to fresh-ui props

A fresh `FieldDescriptor` already carries everything `FormField` + `control-props.ts` need:

| fresh descriptor | fresh-ui prop / control attr | Notes |
|------------------|------------------------------|-------|
| `id` | control `id`, `Label htmlFor={name}` | `FormField.name` must equal descriptor `id` (current `FormField` uses `name` as `htmlFor`; fresh uses `id` as control id; a consumer must pass `name={field.id}`) |
| `error` | `FormField error={field.error}` | First error only; descriptor exposes full `errors[]` if a richer UI wants the list |
| `required` | `FormField required={field.required}` and `aria-required` / `required` on control | Descriptor emits these via `controlProps` |
| `descriptionProps.id` | `FormField helpText` + `aria-describedby` | Consumer supplies help text and forwards `field.descriptionProps.id` to `aria-describedby` |
| `errorProps.id` | `aria-describedby` | Descriptor's `controlProps` already merges `errorId` into `aria-describedby` when errors exist |
| `controlProps()` | `getInputProps(field)`, `getSelectProps(field)`, `getTextareaProps(field)` | Narrowed before spreading onto the JSX control |
| `data-field-path` | data attribute on control | L0-style state hook (`data-part`-like); can drive scoped CSS or e2e selectors |
| `data-field-invalid` | data attribute on control | L0-style visual state (`data-state`-like) |
| `data-field-dirty` | data attribute on control | L0-style dirty-state hook |
| `data-form-id` | data attribute on control | Ties control back to the owning form |

The current boundary is already clean: `fresh/form` owns "what the field is" (value, errors, constraints, ARIA, intents); `fresh-ui` owns "how it looks" (Label, error row, help text, classes). Neither package imports the other. The consumer JSX is the seam, e.g.:

```tsx
<FormField label="Email" name={email.id} required={email.required} error={email.error} helpText={helpText}>
  <Input {...getInputProps(email)} />
</FormField>
```

### 4.4 Contract gaps / design decisions to lock

1. **ID vs. name in `FormField`**: `FormField.name` is currently used for `htmlFor`. The fresh descriptor's canonical identifier is `id`. A thin mapping is required in consumer code. Plan should decide whether to add an `htmlFor` prop to `FormField` or document the `name={field.id}` convention.
2. **Description wiring**: `controlProps` merges `errorId` into `aria-describedby`, but `helpText` requires the consumer to set the descriptor's `descriptionProps.id` on the wrapper/help text element. A plan-level recipe should show this.
3. **Data-state naming**: fresh uses `data-field-*`; L0 conventions prefer generic `data-state`. Form plan should decide if fresh keeps its domain-specific data attributes or aligns to `data-state="invalid|dirty"` + `data-part="field"`. Either is acceptable if documented.
4. **Pending state**: fresh-ui `FormField` currently has no pending/busy indicator. Fresh's `FormEnhancementState.pending` will need a presentation partner (likely an L1 spinner primitive or an L2 wrapper slot) if the playground requires it.

## 5. STANDARD SCHEMA LANDSCAPE & PROGRESSIVE ENHANCEMENT MARKET BAR

Sources: `packages/fresh/form/schema-adapter.ts`; `packages/fresh/form/types.ts` lines 377–392 (enhancement schema option); Standard Schema spec https://github.com/standard-schema/standard-schema; Zod v3.23 release notes / Standard Schema support https://zod.dev/?id=standard-schema; Valibot Standard Schema support https://valibot.dev/guides/standard-schema/; ArkType "Standard Schema" docs https://arktype.io/docs/standard-schema; Remix `action`/`useActionData` docs https://remix.run/docs/en/main/guides/forms; React Router `Form`/`action` docs https://reactrouter.com/start/framework/form-validation; Next.js Server Actions docs https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations; React `useActionState` docs https://react.dev/reference/react/useActionState; TanStack Form docs https://tanstack.com/form/latest/docs/overview.

### 5.1 Current state: Zod-locked adapter

`schema-adapter.ts` is 576 lines and is the largest file in `./form`. It imports `z` directly, inspects `z.ZodTypeAny`, `z.ZodDefWithInner`, `ZodObject`, `ZodArray`, `ZodDefault`, `ZodCatch`, etc., and emits a `FormSchemaAdapter<TValues, TOutput>`.

The public contract is already library-agnostic:

```ts
export interface FormSchemaAdapter<TValues extends FormValues, TOutput = TValues> {
  parse(input: unknown): Promise<TOutput>;
  safeParse(input: unknown): Promise<FormSchemaParseResult<TValues, TOutput>>;
  getConstraints(): Partial<Record<string, FieldConstraints>>;
  getDefaults(): Partial<TValues>;
}
```

However, the only concrete implementation is `createZodAdapter`. Because `FormSchemaAdapter` is public, the framework could ship multiple vendor adapters, but the over-cap adapter file currently couples defaults, constraints, and error flattening to Zod internals. That is the decomposition target.

### 5.2 Standard Schema spec

Standard Schema (https://github.com/standard-schema/standard-schema) is a community specification that gives validation libraries a single shared entry point:

```ts
interface StandardSchemaV1<Input = unknown, Output = unknown> {
  readonly '~validate': (value: unknown) =>
    | { readonly issues: ReadonlyArray<StandardSchemaV1Issue>; }
    | { readonly value: Output; };
  // optional metadata
  readonly '~types'?: { input: Input; output: Output; };
}
```

Supported libraries (as of 2024–2025):

| Library | Standard Schema support | Notes |
|---------|------------------------|-------|
| **Zod** | v3.23+ ships `~validate` and `~types` | https://zod.dev/?id=standard-schema |
| **Valibot** | v0.30+ ships `~validate` and `~types` | https://valibot.dev/guides/standard-schema/ |
| **ArkType** | v2.0+ ships `~validate` and `~types` | https://arktype.io/docs/standard-schema |

The spec intentionally does **not** expose constraint metadata or defaults. It standardizes *validation*, not *schema introspection*. Therefore a form framework that wants to derive HTML constraints from a schema still needs per-library introspection or a supplementary contract.

### 5.3 Market bar: Remix / React Router, Next.js, TanStack Form

#### Remix / React Router

- **Form model**: HTML `<Form>` posts to a route `action` (server function). `action` receives `args.request`/`args.params`, returns `json({ errors, values })` or `redirect()`.
- **Validation**: bring-your-own (Zod/Valibot/ArkType via Standard Schema is common).
- **Progressive enhancement**: works without JS; JavaScript-enabled clients get client-side navigation and optimistic UI via `useNavigation`/`useFetcher`.
- **Field-level rendering**: no framework-provided field descriptor; authors manually wire `useActionData()` to each input's `defaultValue`, `aria-invalid`, `aria-describedby`.
- **Gaps vs. NetScript form**: no built-in CSRF/idempotency token model; no collection-intent abstraction; no typed HTML-constraint derivation; error wiring is manual.

#### Next.js App Router + Server Actions + `useActionState`

- **Form model**: React Server Action exported from a `'use server'` module is used as the form `action`. `useActionState(action, initialState)` returns `[state, dispatch, isPending]`.
- **Validation**: BYO. Pattern is `await schema.safeParse(formData)` inside the action and return a state object with `fieldErrors`/`formErrors`.
- **Progressive enhancement**: server actions are callable as form actions, so no-JS submission works as long as the action parses `FormData`.
- **Field-level rendering**: authors manually map `state.fieldErrors` to each control. No framework-level descriptor/constraint contract.
- **Gaps vs. NetScript form**: no collection intents; no shared CSRF/idempotency helper in the framework; `useActionState` state shape is user-defined and not type-linked to a schema by default.

#### TanStack Form

- **Form model**: headless form primitives with framework adapters (React, Solid, Vue, Angular, Svelte). Core is `@tanstack/form-core`.
- **Validation**: explicitly supports Standard Schema, plus field-level validators, sync and async validation, field-level debounce.
- **Progressive enhancement**: supports SSR initial values and validation, but the "submit" path is typically client-driven; server submission requires framework adapter wiring.
- **Field-level rendering**: `useField()` returns `name`, `state`, `handleChange`, `handleBlur`, `errors`. ARIA/data attributes are the consumer's responsibility.
- **Gaps vs. NetScript form**: no built-in server-side CSRF/idempotency/collection-intent model; no Fresh-specific islands integration; no HTML-constraint derivation from schema.

### 5.4 Verdict for 5d5 plan

NetScript's form differentiator should be: **one Standard Schema-aware contract drives server validation, client validation, HTML constraints, defaults, and error rendering**, while keeping the no-JS path first-class via Fresh's existing intent/reply/CSRF/idempotency pipeline.

Recommended design decisions:

1. **Make `FormSchemaAdapter` the canonical abstraction**, and add a `createStandardSchemaAdapter(schema)` that works with any Standard Schema (Zod ≥3.23, Valibot ≥0.30, ArkType ≥2.0). Keep `createZodAdapter` if needed for introspection-heavy constraints/defaults, but re-implement it *on top of* `createStandardSchemaAdapter` plus a Zod-specific introspection plugin.
2. **Split `schema-adapter.ts`** along responsibilities:
   - `schema-adapter/contract.ts` — public `FormSchemaAdapter`, `FormSchemaParseResult`.
   - `schema-adapter/standard.ts` — `createStandardSchemaAdapter` and issue-to-form-error mapping.
   - `schema-adapter/zod.ts` — Zod introspection for constraints and defaults.
   - `schema-adapter/mod.ts` — barrel.
3. **Constraint/defaults introspection is per-library** because Standard Schema does not specify it. Provide a small `SchemaIntrospector<TSchema>` plugin interface so adding Valibot/ArkType adapters later is a single file.
4. **Progressive enhancement bar**: the playground must prove no-JS submit, enhanced submit, server validation errors rendered through fresh-ui, pending UX, and CSRF. This matches Remix's no-JS baseline and exceeds Next.js Server Actions by providing typed field descriptors and collection intents.

### 5.5 Defer vs. close

- **Close now**: Standard Schema parse adapter; no-JS/enhanced submit in playground; CSRF/idempotency.
- **Defer**: client-side `onBlur`/`onChange` async validation via Standard Schema (valuable but can be a follow-up slice); Valibot/ArkType constraint introspection (need community-stable introspection APIs); multi-step wizard pagination (exists in `pagination.ts` but not integrated with fresh-ui yet).

## 6. DRIFT / RISKS / GAPS

- **D-5d5-1 — Root workspace exclusion prevents any fresh package from publishing (umbrella-level blocker)**

  `deno.json` excludes `packages/fresh/` from the root workspace:

  ```jsonc
  "exclude": [
    ".llm/tmp/",
    "packages/fresh/"
  ],
  ```

  The dry-run artifact (`dry-run-raw.txt`) reports **116** `excluded-module` errors across `packages/fresh/`. `packages/fresh/form/*` accounts for **23** of those (e.g., `schema-adapter.ts`, `field-descriptors.ts`, `types.ts`, `mod.ts` referenced through the public package graph). Even if every form-internal `deno doc --lint` issue is fixed and `packages/fresh/form/` passes standalone `deno publish --dry-run`, the root-level exclusion means the package still cannot be published as part of the workspace.

  **Impact:**
  - 5d5 can reduce doc-lint errors and decompose the three over-cap files, but it cannot close publishability for `@netscript/fresh/form`.
  - Any new `schema-adapter/` subfolder will inherit the same exclusion, so decomposition alone does not unblock JSR readiness.
  - Because the umbrella plan targets removing the workspace exclude as the final Wave-5 close condition (5d6/final close), D-5d5-1 cannot be resolved inside the 5d5 subtask.

  **Resolution options:**
  1. **Umbrella fix (preferred)**: remove `packages/fresh/` from `deno.json` `exclude` at the 5d6 close, after the broader fresh package graph has been repaired (see umbrella `plan.md`). This makes D-5d5-1 a tracked umbrella dependency rather than a 5d5 deliverable.
  2. **Sub-package publish root**: configure `packages/fresh/` as a standalone workspace member with its own `deno.json`/`publish` block. This is architecturally cleaner but is a larger structural change than 5d5 should own.

  **Mitigation in 5d5:** keep form changes self-contained (no new workspace entries, no lockfile changes) and ensure the internal `deno doc --lint` error count and file-size gates are met. Record the umbrella dependency in the handoff so 5d6 can lift the exclusion.

  **Status:** OPEN — umbrella owner: 5d6 / final close.

- D-5d5-2 through D-5d5-n: reserved for design/implementation phase; none identified during research.

---

