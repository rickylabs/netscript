# [5d5] Drift Ledger

Status: IN PROGRESS

- **D-5d5-1 — Root workspace exclusion prevents any fresh package from publishing (umbrella-level blocker)**

  `deno.json` excludes `packages/fresh/` from the root workspace:

  ```jsonc
  "exclude": [
    ".llm/tmp/",
    "packages/fresh/"
  ],
  ```

  The dry-run artifact (`dry-run-raw.txt`) reports **116** `excluded-module` errors across `packages/fresh/`, with **23** of those originating from `packages/fresh/form/*` (`schema-adapter.ts`, `field-descriptors.ts`, `types.ts`, `mod.ts`, and their downstream graph). Fixing `deno doc --lint` inside the form package does not unblock publishing because the root workspace exclude is still in force.

  This is therefore an umbrella-level risk for 5d6 / final Wave-5 close, not a 5d5 deliverable. The 5d5 implementation must stay self-contained (no workspace excludes, no lockfile changes) and record the dependency so the umbrella close can lift `packages/fresh/` from `deno.json` `exclude`.

  - Status: OPEN
  - Owner: 5d6 / umbrella final close
  - Proposed close gate: root `deno publish --dry-run` passes for `@netscript/fresh/form` after `packages/fresh/` is removed from `deno.json` `exclude`.

- **D-5d5-2 — fresh-ui `FormField` needs optional `htmlFor` prop for ergonomic seam**

  The RFC 15 `FieldDescriptor` emits `field.id` for the control and the label must point to that id. `fresh-ui` `FormField` currently uses `name` as both label `htmlFor` and control `name`. The seam works by passing `name={field.id}`, but that is awkward when the descriptor id differs from the form path. Plan proposes adding an optional `htmlFor` prop to `FormField` defaulting to `name`.

  - Status: OPEN
  - Owner: 5d5 (slice 13) if supervisor confirms; otherwise fresh-ui follow-up.
  - Proposed close gate: Playground route renders with correct label-to-control association using either `name={field.id}` or `htmlFor={field.id}`.

- **D-5d5-3 — Standard Schema adapter may shift error-shape assumptions for consumers**

  `createStandardSchemaAdapter(schema)` will be the recommended adapter for Zod ≥3.23, Valibot, and ArkType. The public contract (`FormSchemaAdapter`, `FormSchemaParseResult`) is preserved, but the exact error messages and issue paths may differ from the current Zod-only adapter. Consumers using brittle message assertions will need migration guidance.

  - Status: OPEN
  - Owner: 5d5 implementation (slices 9–11)
  - Proposed close gate: Unit tests prove `toFormErrors` parity for representative Zod schemas; README migration note added.

- **D-5d5-4 — Internal barrels in `schema-adapter/` and `field-descriptors/` need architectural justification**

  Decomposition creates internal aggregation files (`schema-adapter/mod.ts`, `field-descriptors/mod.ts`). The public surface remains `form/mod.ts`; these internal barrels are only imported by `form/mod.ts` and the package-local tests. They must carry `// arch:barrel-ok` justification to pass F-18.

  - Status: OPEN
  - Owner: 5d5 implementation (slices 3, 4)
  - Proposed close gate: Internal barrels annotated; `deno doc --lint` and lint pass.

- **D-5d5-5 — Root `deno check` excludes `packages/fresh/`; form package check must run scoped**

  Because root `deno.json` excludes `packages/fresh/`, CI/root `deno check` will not cover `@netscript/fresh/form`. The implementation must add a scoped `deno check` step (via `packages/fresh/deno.json` `tasks.check`) and capture evidence in the run artifacts.

  - Status: OPEN
  - Owner: 5d5 implementation (slice 22)
  - Proposed close gate: `deno check --unstable-kv packages/fresh/form/mod.ts` passes and evidence is archived.

- **D-5d5-6 — Supervisor sync changed form baseline before implementation**

  Re-baseline on 2026-06-14 after supervisor sync commit `ff8cf6f` found the package no longer
  matches the PLAN-phase measurements:

  - `deno doc --lint packages/fresh/form/mod.ts` now reports 0 errors.
  - `packages/fresh/form/types.ts` is now 753 LOC, not the planned 474 LOC.
  - `schema-adapter.ts` remains 576 LOC and `field-descriptors.ts` remains 518 LOC.
  - Scoped form check via `.llm/tools/run-deno-check.ts --root packages/fresh/form --ext ts,tsx`
    passes with 0 occurrences.

  This does not expand 5d5 scope, but it changes the decomposition budget. Slice 2 must now split a
  larger `types.ts`; the doc-lint budget is already retired by upstream work and should be treated
  as verification rather than planned cleanup.

  - Status: CLOSED by slice 2 type split (`types.ts` now 50 LOC; public doc-lint remains clean)
  - Owner: 5d5 implementation (slice 2 budget update, final evidence)
  - Proposed close gate: `types.ts` is brought under the file-size cap without public export
    renames, and final form doc-lint remains clean.
