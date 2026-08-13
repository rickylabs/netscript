use harness

## SKILL

Read `AGENTS.md` and the full `netscript-harness`, `netscript-tools`, `netscript-pr`,
`netscript-cli`, `netscript-doctrine`, `netscript-deno-toolchain`, `jsr-audit`, `aspire`, and `rtk`
project skills. Then read the IMPL-EVAL protocol/verdict definitions, complete leaf run, live issue
#1243, PR #1643, coordinator scope comments, full diff, Tier-A review, and receipts.

Act only as the fresh separate formal IMPL-EVAL. Do not launch before 2026-08-15 00:00
Europe/Zurich. Use native Claude/Fable 5 medium and immediately enable `/remote-control`; record
session ID, bridge ID, PID, cwd, requested route, and observed route. No substitute provider/model.

Worktree `/home/codex/repos/netscript-007-leaf-legacy-port-pin-sweep`; branch
`fix/legacy-port-pin-sweep`; immutable base `01e0960494c95ce56eb35892c211a095eb13e6ed`;
exact remote PR/source head `e6ba15ec6414c0a42b1f9870791131162ea71c36`. Fetch and resolve both
PR and branch independently; refuse any mismatch. This exact head supersedes the stale `af3dca0f5`
value in the older leaf-local `evaluate-prompt.md`.

Independently verify the auth command has no silent localhost:4437 default, requires explicit
`--stream-url`, fails before the session adapter when omitted, and gives actionable Aspire endpoint
discovery guidance. Verify manifest/copy port fields remain coordinator-classified compatibility
metadata, broad formatting remains mechanically isolated, lock/JSR/publish evidence is honest, and
there is no hidden behavioral or scope drift. Run only the smallest non-expensive checks needed; do
not run scaffold.runtime, Aspire, Docker, or publish and do not implement.

Write `evaluate.md` with exactly one harness verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or
`FAIL_DEBT`. Commit only it and push explicitly to the existing branch. Post one structured PR
comment with phase, verdict, evaluated head, evaluator commit, and remote-control identity. Keep PR
#1643 draft at `status:impl`; do not merge, publish, relabel, or mutate central state.
