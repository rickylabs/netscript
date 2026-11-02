# Resume — issue 2591

PR: https://github.com/rickylabs/netscript/pull/2592 (draft; Refs #2591). Branch:
`orch/divybot-6572256863`. Baseline `6766130bbafbe78a9bb5870f704987cb0743c5e6`; implementation
S1 `321eca9b9c53d7ac7b12e832d09b9c43c861bde7`; first runtime candidate
`f82ef33dac6c915d320b0ffd99be24dcc4559263`. No merge, rebase or force push. Main remains held.

S1 independent Opus re-review PASS. It adds event-driven post-seed handoff observation with
failure isolation, shutdown/rearm handling and existing idempotency. `plugin install --service`
persists the service consumer and moves only earlier managed edges; manual links survive.

S2 implements behavior.documented-scaffold after static main init, before all plugin/link/runtime
repair fixtures. It executes the actual documented block in three fresh Postgres workspaces:
skip the handoff, drop the service link, restore. Require real seed-correlated completion and
stream-backed Activity, with stable worker PID. Cleanup reuses the canonical runtime evidence helper.

First CI run https://github.com/rickylabs/netscript/actions/runs/41418574351 failed the new gate.
It proves the seed control goes RED while actual Activity passes. The next variant completed a job
but exposed a test DTO error: execution responses omit correlationId. The repair queries the public
by-correlation route, uses the actual public schema in the fixture, preserves nested errors, retries
transitional projection reads and gives Aspire an explicit startup budget. Generated Aspire
inventory/parity repaired. See memory-runtime-contract.md and worklog.md.

Deno 2.9.7 local results: 191 focused test/step results and all 21 changed TypeScript scoped checks
pass. RTK and Docker daemon unavailable locally. Four carrier generators and all check tasks ran;
final parity inventory refresh is included. Same independent evaluator is reviewing S2 repairs.

Next: commit/push the repaired candidate, run canonical one-pass scaffold.runtime CI at that exact
head, finish all current-head checks and independent evidence review, update PR evidence, and queue
READY through `.divybot-final-report.md` only when every required check is green or policy-skipped.
Keep the head fixed once green. Public run artifacts use repository-relative paths; assignment
and final-report files stay outside Git. No accepted product debt. Cockpit owns review and merge.
