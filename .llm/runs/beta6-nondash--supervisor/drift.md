# beta6-nondash supervisor drift

## 2026-07-08 — T5 / #406

- Severity: none.
- No plan or doctrine divergence recorded.
- Operational note: `deno.lock` churned during validation after package import-map additions and
  publish dry-run; the lockfile was reverted per the slice constraint.

## 2026-07-08 — T7 / #408

- Severity: minor.
- The branch's `.llm/runs/beta6-nondash--supervisor/` directory did not contain unsuffixed
  `plan.md`, `plan-eval.md`, `worklog.md`, or `context-pack.md` at slice start; only prior
  slice/evaluator artifacts were present. The user prompt supplied the approved PLAN-EVAL state and
  scope fence, so T7 proceeded without re-planning and created the required T7 worklog/context
  artifacts in this branch.

## 2026-07-08 — T7 adapter size

- Severity: minor.
- The initial Aspire adapter implementation exceeded the 500-line doctrine warning threshold. The
  backend normalization code was split into a sibling adapter-internal module, removing the new
  adapter size warning; remaining telemetry doctrine WARN rows are pre-existing package debt.

## 2026-07-08 — T7 command interruption

- Severity: process.
- A malformed `gh pr comment --body "..."` command interpreted Markdown backticks as shell command
  substitution after the slice commit. It printed shell errors and started `deno task e2e:cli`,
  which was interrupted immediately with Ctrl-C and exited 130. No scaffold runtime verdict was
  produced, and the interrupted command is not used as evidence. The valid T7 evidence remains the
  scoped telemetry wrappers, focused tests, full export doc-lint, and publish dry-run recorded in
  `worklog-408.md`.

## 2026-07-08 — PR #567 merge conflict

- Severity: minor.
- PR #567 conflicted with `main` after T5 / #406 landed. The conflicts were limited to shared
  harness artifacts in `.llm/runs/beta6-nondash--supervisor/`. The resolution was additive and kept
  both T5 span-link evidence and T7 query evidence.
