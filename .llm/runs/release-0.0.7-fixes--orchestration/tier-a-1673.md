# Tier-A running notes — #1673 plugin doctor registry drift

Branch `fix/plugin-doctor-registry-drift` off `main@13878a80a50c55b9662099fed64555f2310ae4a3`.
Author thread `01a04fd2-563e-7250-9173-f6befd6db8f2`, `gpt-5.6-sol` · high.

## Plan review at `d37b278b6` — accepted, one gate addition requested

Strengths: explicit six-path ceiling; reverse-drift coverage (registry entry with no backing source);
lock hygiene gated; and the red-before requirement written as a **gate condition** rather than an
aspiration — "focused structured test must fail on baseline because the command exits 0".

Requested addition: the plan names `doc:lint` and publish dry-run but not the derivative cascade. The
leaf adds a new file under `src/public/features/plugins/doctor/` and touches
`public-command-dependencies.ts`, either of which may move the published export surface. Asked for
`check:mcp-export-corpus` and `check:publish-assets` on the final tree regardless, with the outcome
recorded **either way** — including as a measured negative — and an explicit statement that
`check:assets-barrel` does not apply. Same plan shape as #1112, where CI caught what the plan, the
supervisor Tier-A, and a formal IMPL-EVAL all missed.

## Red-before independently verified at `c947b8fa4`

The author committed the regression test alone, before any product change. Supervisor re-derived it
from a pristine `git archive` of that commit:

```
run-deno-test.ts -- --allow-all \
  packages/cli/src/public/features/plugins/doctor/doctor-plugin-registry-drift_test.ts
→ exit 1, passed 0, failed 1
  AssertionError: Expected function to reject.
```

That is the defect stated precisely: a saga authored after `generate plugins` is absent from the
registry and `doctor` does **not** reject. The test fails against the unmodified command, so a later
green is evidence rather than decoration.

### Reviewer near-miss recorded

The first verification attempt selected test files with a `find` glob, which matched three unrelated
drift tests (`version-drift_test.ts`, `quickstart-command-drift_test.ts`,
`record-drift-command_test.ts`) and returned **exit 0, 4 passed**. That green said nothing about the
regression test and would have falsely confirmed the red-before claim. Corrected by reading the
commit's actual file list. Rule: when verifying a specific claim, name the file from the commit, never
from a pattern — a green from the wrong file is indistinguishable from a green from the right one.

## Infrastructure note

Two supervisor background monitors were killed mid-flight. The Codex author session survived — it runs
under the app-server daemon, independent of the supervisor's shell — and continued to `c947b8fa4`.
Verified by `codex-status` rather than assumed. The consequence that did matter: the queued gate-set
note was never delivered, so it must be re-sent.

## Monitoring constraint — 2026-08-30

Three supervisor background monitors have now been killed mid-flight (`booauapa5`, `bm4xe9qgp`,
`b368gfdo9`). The Codex author is unaffected — it runs under the app-server daemon, independent of the
supervisor's shell — and remains `working` at `c947b8fa4`.

Consequence: the supervisor cannot hold a long-lived wait, so monitoring is turn-driven rather than
continuous, and the queued gate-set note has not been delivered. The supervisor has stopped
re-spawning the waiter rather than repeatedly restarting work that keeps being reaped.

**This costs nothing material.** The note asks for `check:mcp-export-corpus` and
`check:publish-assets` on the final tree with the outcome recorded either way. If the author omits
them, Tier-A catches it before IMPL-EVAL is dispatched, so the worst case is one bounded correction
rather than a review cycle — which is the same outcome the note was buying. The red-before evidence,
which was the part that had to be right at the moment it was produced, is already verified and
committed at `c947b8fa4`.
