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

Read:
- `packages/fresh-ui/registry/components/ui/form-field.tsx`
- `packages/fresh-ui/registry/lib/control-props.ts`
- `packages/fresh-ui/docs/l0-conventions.md`

(Placeholder — will be filled from file reads below.)

## 5. STANDARD SCHEMA LANDSCAPE & PROGRESSIVE ENHANCEMENT MARKET BAR

(Placeholder — will be filled from file reads and web sources below.)

## 6. DRIFT / RISKS / GAPS

- D-5d5-1: TODO

---

