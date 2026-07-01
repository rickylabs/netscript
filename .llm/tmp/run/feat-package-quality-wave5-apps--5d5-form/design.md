# [5d5] `@netscript/fresh/form` — Design Document

Status: **PLAN phase — proposed, pending Plan-Gate.**
Run: `27465201406-1` · Branch: `feat/package-quality-wave5-apps-5d5-form` · PR #38.

## 1. Design authority and constraints

- **Umbrella target architecture:** `.llm/tmp/run/feat-package-quality-wave5-apps--5d-fresh/plan.md`.
- **RFC 15:** forms system owned by `packages/fresh/form/`, public surface via `./form`.
- **fresh-ui seams (5c):** `packages/fresh-ui/registry/components/ui/form-field.tsx` and `packages/fresh-ui/registry/lib/control-props.ts`.
- **L0 attribute contract:** `packages/fresh-ui/docs/l0-conventions.md`.
- **F-16 lock:** existing export specifiers and public type names must not change without umbrella drift.

## 2. Baseline measurements (research.md, re-baselined)

| Metric | Value | Source |
|--------|-------|--------|
| `deno doc --lint` total errors | 74 | `deno-doc-lint.txt` |
| `missing-jsdoc` | 60 | `deno-doc-lint.txt` |
| `private-type-ref` | 11 | `deno-doc-lint.txt` |
| `missing-return-type` (doc lint) | 3 | `deno-doc-lint.txt` |
| `deno publish --dry-run` problems | 62 | `dry-run-raw.txt` |
| `excluded-module` errors | 58 | `dry-run-raw.txt` |
| `missing-explicit-return-type` (dry-run) | 4 | `dry-run-raw.txt` |
| Over-cap files (>475 LOC) | 3 | `wc -l` |
| Largest file | `schema-adapter.ts` 576 LOC | `wc -l` |
| Second largest | `field-descriptors.ts` 518 LOC | `wc -l` |
| Third largest | `types.ts` 474 LOC | `wc -l` (right at cap) |

> The root `deno.json` excludes `packages/fresh/`; therefore `deno publish --dry-run` from root can never PASS for `@netscript/fresh/form` from this branch. 5d5 retires the form-internal gates; the workspace exclusion is tracked as drift `D-5d5-1` and is out of scope here.

## 3. Open decisions from research.md — resolved

### 3.1 Form / decomposition

**Decision:** Split the three over-cap files by audience and responsibility, preserving every public symbol path/name.

| Current file | New shape | Rationale |
|--------------|-----------|-----------|
| `schema-adapter.ts` (576 LOC) | `schema-adapter/contract.ts`, `schema-adapter/standard.ts`, `schema-adapter/zod.ts`, `schema-adapter/mod.ts` | Separate the library-agnostic contract, the Standard Schema validator, and the Zod introspection plugin; leaves room for `valibot.ts`/`arktype.ts` later without touching public exports. |
| `field-descriptors.ts` (518 LOC) | `field-descriptors/descriptor.ts`, `field-descriptors/constraints.ts`, `field-descriptors/collection.ts`, `field-descriptors/aria-data.ts` | Split descriptor construction, HTML constraint derivation, collection-key handling, and `data-*`/ARIA emission. Public `FieldDescriptor` shape is preserved. |
| `types.ts` (474 LOC) | `types.ts` (author-facing public types, ≤300 LOC) + `_internal/types.ts` (descriptor/pipeline/internals) | `private-type-ref` errors are caused by public signatures referencing types that are not re-exported from `mod.ts`. Move internals to `_internal/types.ts` and either re-export the supporting types from `mod.ts` or narrow signatures so they no longer leak internals. |

**Constraint:** no export specifier changes, no public type renames. Internal files may move; public re-exports stay stable.

### 3.2 fresh ↔ fresh-ui seam

**Decision:** Keep the seam *value-level and attribute-level*, not import-level. Neither package imports the other.

- `fresh/form` emits `FieldDescriptor` objects with `controlProps(overrides?)` returning a `Record<string, unknown>` bag.
- `fresh-ui` exposes `getInputProps`, `getSelectProps`, `getTextareaProps` in `control-props.ts` to narrow that bag to typed JSX props.
- `fresh-ui` `FormField` remains presentation-only: `label`, `name`, `required`, `error`, `helpText`, `children`.

**Mapping contract:**

| fresh runtime | fresh-ui / control attr | Consumer obligation |
|---------------|--------------------------|---------------------|
| `field.id` | control `id` + `<Label htmlFor={field.id}>` | Pass `name={field.id}` to `FormField` (or use `htmlFor` override documented in recipe). |
| `field.error` (first error string) | `FormField error={field.error}` | Map `field.errors` → first string if UI wants single error. |
| `field.required` | `FormField required={field.required}` and `required`/`aria-required` on control | Already in `controlProps()`. |
| `field.descriptionProps.id` | `aria-describedby` | Consumer places help text element and forwards `field.descriptionProps.id`. |
| `field.errorProps.id` | `aria-describedby` | `controlProps()` merges `errorProps.id` when invalid. |
| `field.controlProps()` | `getInputProps(field)`, etc. | Narrow before spreading onto control. |
| `data-field-path` | data attr on control | L0-style hook for scoped CSS / e2e selectors. |
| `data-field-invalid` / `data-field-dirty` | data attrs on control | Visual state hooks. |
| `data-form-id` | data attr on control | Ties control to owning form. |

**ID/name gap resolution:** Add an optional `htmlFor` prop to `FormField` defaulting to `name`, so consumers can write `<FormField label="Email" name="email" htmlFor={email.id} …>` when the descriptor id differs from the form field name. This is a fresh-ui change but is required to make the seam ergonomic. It is a new optional prop, backward compatible.

**Data-state naming resolution:** fresh keeps domain-specific `data-field-*` names; they are documented as the form-layer state vocabulary. Fresh-ui CSS may select on them or map them to `data-state` inside copied L2 components at consumer discretion. This avoids breaking existing descriptor consumers and respects L0 "platform attributes first" rule.

**Pending state resolution:** `FormEnhancementState.pending` is emitted by `useFormEnhancement`. The recipe will show wrapping the submit button or form region with an L1 spinner primitive or an L2 `FormPending` wrapper (new registry component, out of scope for 5d5 implementation unless the recipe/playground demands it). 5d5 adds a pending indicator to the playground route to prove the state path.

### 3.3 Standard Schema interop

**Decision:** Make `FormSchemaAdapter` the canonical abstraction and add `createStandardSchemaAdapter(schema)` that works with any Standard Schema v1 implementation (Zod ≥3.23, Valibot ≥0.30, ArkType ≥2.0).

- Standard Schema only standardizes *validation*, not constraint/defaults introspection. Therefore constraint/defaults introspection remains a pluggable `SchemaIntrospector<TSchema>` interface.
- `createZodAdapter` is re-implemented *on top of* `createStandardSchemaAdapter` plus a Zod introspector.
- No new runtime dependency is added to the package; Standard Schema is a protocol, not a library.
- The public adapter contract is unchanged.

**Deferred:** Valibot/ArkType constraint introspection adapters (file-only additions, no surface change), client-side `onBlur`/`onChange` async validation via Standard Schema.

### 3.4 Progressive enhancement strategy

**Decision:** Keep the existing no-JS first-class path and augment it with islands.

- No-JS: server receives `FormData`, CSRF/idempotency tokens, intent fields; server returns reply state; route renders `Form` with server-provided `FormState`.
- Enhanced: `useFormEnhancement` hydrates the form, adds `pending`, prevents double submit via idempotency, wires collection intents, and preserves the same server reply contract.
- The playground will prove: no-JS submit, enhanced submit, server validation errors rendered through fresh-ui fields, pending UX, CSRF/idempotency.

**Market bar:** Remix/React Router no-JS actions and Next.js `useActionState` are the baseline. NetScript exceeds them with typed field descriptors, HTML constraints derived from schema, collection intents, and CSRF/idempotency baked in.

## 4. File decomposition detail

### 4.1 `schema-adapter/` (new folder)

| File | Role | Public symbols |
|------|------|----------------|
| `contract.ts` | `FormSchemaAdapter`, `FormSchemaParseResult`, shared parse-result types | unchanged public contract |
| `standard.ts` | `createStandardSchemaAdapter(schema)` | new function, additive |
| `zod.ts` | Zod introspector + `createZodAdapter` rebuilt on standard adapter | `createZodAdapter` preserved |
| `mod.ts` | barrel: re-exports contract + standard + zod | new internal barrel; public still imports via `form/mod.ts` |

### 4.2 `field-descriptors/` (new folder)

| File | Role |
|------|------|
| `descriptor.ts` | `FieldDescriptor` class/object and core factory |
| `constraints.ts` | HTML constraint derivation (`FieldConstraints`, pattern/length/range) |
| `collection.ts` | collection-key helpers and list/dict descriptor variants |
| `aria-data.ts` | `data-*` and ARIA prop emission used by `controlProps()` |
| `mod.ts` | internal barrel |

### 4.3 `types.ts` split

| File | Audience | Content |
|------|----------|---------|
| `types.ts` | Public | Author-facing types referenced by `mod.ts`: `FormValues`, `FormPageMode`, `FormFieldErrors`, `FormIntent`, `RuntimeFormState`, `FormEnhancementSnapshot`, `FormCollectionStrategy*`, `FormEnhancementOptions`, `FormEnhancementState`, `FormPageInvalidateContext`, `FormPageProps`, plus the previously "private" supporting types now re-exported. |
| `_internal/types.ts` | Internal | Descriptor/pipeline/internals: `FieldDescriptorMap`, `FieldConstraints`, `FormElementProps`, `FormCsrfInputProps`, `EnhancedFormProps`, `IntentButtonProps`, `FormProps`, `FormRegionProps`. |

## 5. Public surface stability

- `mod.ts` keeps all 39 exported symbols (constants, helpers, components, types).
- New additions: `createStandardSchemaAdapter` exported from `schema-adapter/standard.ts` and re-exported through `mod.ts`.
- No renames, no signature removals.
- Private types referenced by public signatures are either (a) re-exported from `mod.ts` or (b) replaced by equivalent public type aliases so `deno doc --lint` is clean.

## 6. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Splitting `types.ts` leaks internal shapes if not carefully scoped | Every public signature is inspected with `deno doc --lint` after the split; private internals move to `_internal/types.ts`. |
| Standard Schema adapter produces different error shapes than current Zod adapter | Unit tests assert parity of `toFormErrors` output for equivalent schemas; playground route uses the new adapter. |
| fresh-ui `FormField htmlFor` addition is rejected as out-of-scope | Document it as a recommended fresh-ui follow-up; the seam still works via `name={field.id}` without the new prop. |
| Workspace exclusion blocks JSR publishability | Tracked as `D-5d5-1`; form-internal gates (doc-lint, file-size, slow types) are retired here so 5d6 can lift the exclude cleanly. |
| Over-decomposition creates forbidden sub-barrels | `schema-adapter/mod.ts` and `field-descriptors/mod.ts` are internal aggregation files with `// arch:barrel-ok` justification; public surface remains `form/mod.ts`. |

## 7. Dependencies on sibling sub-gates

- **5d1 (support spine):** error taxonomy + telemetry conventions bind form error handling and `telemetry.ts`. Form's `errors.ts` and `telemetry.ts` must align with 5d1 decisions; assume already landed on the 5d umbrella branch.
- **5d4 (streaming):** implementation order is 5d1→5d4→5d5 per umbrella sequencing; 5d5 branch may need to merge 5d4 landing before implementation starts.
- **5c (fresh-ui):** form-field/control-props seams are delivered and stable; only the optional `htmlFor` prop is a new request.

---
*Proposed for Plan-Gate review.*
