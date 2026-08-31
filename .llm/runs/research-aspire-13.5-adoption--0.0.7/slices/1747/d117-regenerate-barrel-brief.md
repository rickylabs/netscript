use harness

## SKILL

- netscript-harness — commit + push, run-dir artifacts.
- netscript-doctrine — `packages/cli` is framework code: no `any`/casts/lint-ignores introduced.
- netscript-tools — `gen:assets-barrel`/`check:assets-barrel` are the canonical embedded-snapshot
  regeneration/verification tasks; use them, don't hand-edit generated files.

## D-117 bounded correction: regenerate the stale embedded asset barrel

This PR (#1747, `fix/aspire-reference-name-validation`) changed
`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-background.ts` to emit
background-processor name/executable literals via `JSON.stringify(name)` (safe quote/backslash/
backtick escaping) instead of bare `'${name}'` interpolation, and updated
`packages/cli/e2e/src/application/gates/scaffold/prepare-flow-b-fixture.ts`'s own parser to expect
that new double-quoted shape. Both are consistent with each other.

However, `packages/cli/src/kernel/assets/embedded.generated.ts` — the embedded snapshot the actual
CLI runtime (`netscript init`, `netscript plugin install`, etc.) loads generators from — was never
regenerated after that source edit. Confirmed by direct grep: the live source has 4 occurrences of
`JSON.stringify(name)`; the embedded barrel has 0. Reproduced statically (no Aspire/Docker): scaffold
a project, `netscript plugin install workers --name workers`, inspect the generated
`aspire/.helpers/register-background.mts` — it still emits single-quoted `'workers'` literals,
which is why `runtime.flow-b-fixture`'s regex (expecting double-quoted `"workers"`) failed with
`generated register-background.mts did not contain the workers resource block`.

### Scope (bounded — regeneration only, no new source logic)

1. Run `deno task gen:assets-barrel`.
2. Run `deno task check:assets-barrel` and confirm it is diff-clean (deterministic reproduction —
   this task re-runs `gen:assets-barrel` and diffs the generated files against what's committed).
3. Statically re-verify (no Aspire/Docker): scaffold a throwaway project locally
   (`netscript init <name> --db postgres --no-git --non-interactive`, then
   `netscript plugin install workers --name workers`) and confirm the regenerated
   `aspire/.helpers/register-background.mts` now emits `builder.addExecutable("workers", ...)` and
   `config.BackgroundProcessors["workers"]` with double quotes.
4. Commit exactly the regenerated asset files (`embedded.generated.ts` and any sibling
   `*.generated.ts`/snapshot files `gen:assets-barrel` touches) plus the run-dir note. Do not modify
   any other source file, gate logic, or test — this is a pure regeneration commit.
5. No PLAN-EVAL, no DeepSeek/OpenRouter rerun — this is a bounded mechanical fix confirming the
   already-accepted plan/implementation, not new design.

### Do not

- Start Aspire, Docker, or any runtime process. Everything above is scaffold-only, local-filesystem
  work.
- Touch `.github/workflows/`, S6's branch/files, or anything outside this PR's own scope.

### After this change

Commit and push. The coordinator will independently re-verify the regenerated barrel and, once
confirmed, request a fresh runtime lease to run the full `scaffold.runtime` suite and prove
`runtime.flow-b-fixture` passes end-to-end.
