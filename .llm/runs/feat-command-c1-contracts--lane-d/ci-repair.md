# C1 CI repair — Fresh UI private-lock qualification

use harness

## SKILL

Use netscript-harness, netscript-doctrine, netscript-tools, netscript-deno-toolchain, jsr-audit and netscript-pr.

## Narrow change and historical evaluation

CI failed the frozen Fresh UI package check because its private lock omitted service workspace metadata for the new declared database0.0.7 and StandardSchema1.1.0 dependencies. The failing gate was reproduced with exit1 and no private-lock rewrite. The package-owned `deno task --cwd packages/fresh-ui lock:update` then passed, selecting150files in2batches.

Only `packages/fresh-ui/deno.lock` changes outside run artifacts: two service dependency metadata entries are added. Native Deno2.9.7 also normalizes17 npm peer keys and9 specifier peer identifiers. [Full semantic diff evidence](./ci-repair-lock-diff.json) proves exact JSR resolved bodies, npm bodies after peer-key normalization, specifier names/resolved versions, and all versions/integrities unchanged. No dependency upgrade, runtime/UI behavior, declaration/export change, tooling rewrite or new test is included. No cache/lock deletion or reload occurred.

The historical opposite-family PASS at `e64c841bc9c1a9f967afa357b54f454445807db8` remains unchanged. All22 recorded C1 product hashes still match. evaluate.md SHA-256 remains `83d3f9b63cc78ed88e30f9767415ea7f4a63d64885189217744c1be4a3f80837`. This metadata repair creates a new qualification head; it is pending substantive supervisor review and same-session reevaluation. No new PASS is asserted by the implementation lane.

## Actual gates

[Gate evidence](./ci-repair-gate-evidence.json) records exact commands/exits and lock stability. [Source manifest](./ci-repair-source-manifest.json) identifies the repaired private lock, unchanged root lock, workflow/task definitions and historical evaluator identity.

| Gate | Actual exit | Result |
| --- | --- | --- |
| Reproduced exact frozen private check before repair | 1 | Stale metadata rejected; lock unchanged |
| Package-owned native lock:update | 0 | 150files,2batches, no diagnostics |
| Exact downstream CI frozen check after repair, local Deno2.9.7 | 0 | 150files,2batches, no diagnostics; repaired lock unchanged |
| Supervisor exact CI runtime Deno2.9.5 package check | 0 | Native runtime selected for all child wrappers;150files,2batches, no diagnostics; before/after private-lock hashes equal |
| Exact package lint gate | 0 | No findings |
| Existing frozen-lock workflow/regression gate | 0 | 2 tests pass, including refusal without rewriting a stale lock |
| Frozen Fresh UI package tests | 0 | 172 passed,0 failed,0 ignored |
| Native lock JSON stdin format check | 0 | Explicit JSON parsing/formatting, no lock rewrite |
| quality:scan / arch:check | 0 / 0 | Durable receipts, no new findings/suppression; baseline architecture warnings |
| Native Fresh UI publish dry run | 0 | Default publication/fast declaration bar succeeds |
| Root frozen production install | 0 | Native deno ci --prod; root/private locks unchanged |
| git diff --check | 0 | No whitespace defects |

One exploratory direct `deno fmt --check packages/fresh-ui/deno.lock` probe exited1 because .lock is not a selected formatter extension. The corrected native `deno fmt --check --ext=json -` checks exact lock bytes through stdin and passes0; both receipts are retained. No formatting debt or source suppression is hidden.

CI's final clean-worktree invariant awaits the supervisor-owned commit; an intentionally uncommitted review patch cannot satisfy it. The implementation lane has not claimed a new live-CI PASS. No new behavioral tests were necessary for metadata reconciliation, and existing C1 behavioral/mutation evidence remains intact.

## Frozen supervisor handoff

The repair is frozen for substantive supervisor review, commit/push/comment and same-session reevaluation. Current C1 CI status/closing claim and later-leaf release remain supervisor-owned. C2 product is paused. Historical evaluate.md is untouched; no commits/pushes/GitHub/evaluator writes by this lane. All writable runtime directories and raw receipts remain task-private; public evidence contains repository-relative paths only.
