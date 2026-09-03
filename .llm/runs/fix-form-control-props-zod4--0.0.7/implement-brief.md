use harness

## SKILL

- `netscript-harness` — run dir, worklog/drift, RED→GREEN discipline, separate-session eval.
- `netscript-doctrine` — `packages/fresh` archetype gates before changing framework code.
- `netscript-pr` — PR body/labels/milestone; closing keyword only when both halves land.
- `netscript-deno-toolchain` — `deno doc` for the form surface; never hand-roll registry checks.

# Implement brief — #1249 `controlProps()` element-assignability + Zod 4 constraint derivation

Branch `fix/form-control-props-zod4` (from `main` `8c549c061`), worktree `007-leaf-1249`.
Harness: `use harness`. Generator: Codex `gpt-5.6-sol` · medium. Evaluator is a separate
opposite-family session (not you). Run dir: `.llm/runs/fix-form-control-props-zod4--0.0.7/`.

## Situation (issue #1249, verified on this base)

1. `ControlProps.role?: string` (`packages/fresh/src/application/form/_internal/prop-types.ts:166`)
   is not assignable to Preact's `role?: Signalish<AriaRole | undefined>`, so the canonical
   `<input {...state.fields.email.controlProps({ type: 'email' })} />` fails `deno check` (TS2322)
   under `jsx: "precompile"` / `jsxImportSource: "preact"`. `role` is the only offending property.
2. `packages/fresh/src/application/form/schema-adapter/zod-constraints.ts` — `applyNumberChecks`
   switches on `'min'`/`'max'`/`'multipleOf'`; Zod 4.4.3 (catalog `zod ^4.4.3`) emits
   `greater_than`/`less_than` (`value`, `inclusive`) and `multiple_of` (`value`). `.regex()` arrives
   as `string_format` with `format: 'regex'` and `pattern` on `_zod.def`; only `format === 'url'`
   is handled. Result: numbers lose `min`/`max`/`step`; regex loses `pattern`. Strings/arrays work
   only via `minLength`/`maxLength` accessors and `min_length`/`max_length` names.

Issue admission rule: both halves get independent red-first probes. The `controlProps` half is
admitted for 0.0.7. If the Zod half does not reproduce against the exact locked dependency family,
it moves visibly to 0.0.8 with the probe output recorded — never silently checked off.

## Slices (contract → implementation → tests; RED before GREEN, one commit each)

- **S1 RED** — a `_test.tsx`/type-level test that spreads `controlProps()` onto `<input>`,
  `<select>`, `<textarea>` under the package's own compiler options and fails `deno check` today.
  **S1 GREEN** — narrow `ControlProps['role']` to the JSX-compatible role type (prefer deriving from
  Preact's `JSX.HTMLAttributes['role']`/`AriaRole`; do not widen to `unknown`). Do not touch
  `@netscript/fresh-ui` narrowing helpers in this slice (record as follow-up in drift).
- **S2 RED** — regression test asserting the full constraint map for the issue's five-case schema
  (`email`, `slug`, `homepage`, `quantity`, `tags`) — must fail on `slug.pattern` and
  `quantity.min/max/step` today. Record the raw failing output in the worklog (this IS the probe).
  **S2 GREEN** — extend `readCheckKind` handling: `greater_than`/`less_than` with `inclusive`
  (exclusive bounds: record in drift how you map them — do not invent an off-by-one), `multiple_of`
  → `step`, `string_format` + `format:'regex'` → `pattern` from `_zod.def.pattern.source`. Keep the
  existing kinds working. If S2 RED unexpectedly passes, stop the Zod half, record the probe output,
  and scope the PR to S1 with the Zod half stated as deferred to 0.0.8.
- **S3** — `deno doc --lint` on the form surface unchanged or improved; README/JSDoc touch only
  where the narrowed type is documented. No docs-site edits (`docs/site/web-layer/form.md` prose
  simplification is a docs-lane follow-up; note it in drift).

## Ceiling

`packages/fresh/src/application/form/**` and `packages/fresh/tests/**` (+ the run dir). No changes
to `packages/fresh-ui`, `packages/cli`, `deno.json`, catalogs, or `deno.lock`. No dependency
bumps. No `.github/` changes.

## Local gates before each push

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/fresh --ext ts,tsx`
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/fresh/tests packages/fresh/src/application/form`
- `.llm/tools/run-deno-lint.ts` / `run-deno-fmt.ts` on `packages/fresh --ext ts,tsx`
- `deno task quality:gate`; `deno.lock` byte-identical to base.
Record exit codes in `worklog.md`; drift in `drift.md`.

## PR

Push with explicit refspec `HEAD:refs/heads/fix/form-control-props-zod4`. Open a **draft** PR:
title `fix(fresh/form): make controlProps() element-assignable and derive Zod 4 constraints`,
labels `type:fix area:fresh priority:p2 orchestrator:fixes status:impl ci:full`, milestone `0.0.7`.
Body: Summary / Scope / Slices (with RED/GREEN commits) / Validation (exit codes) / Harness /
Drift / Definition of Done. Use `Closes #1249` only if both halves land; otherwise `Refs #1249`
with the deferred half stated. Do not self-certify; supervisor triggers IMPL-EVAL.
