use harness

## SKILL

- `netscript-harness` — IMPL-EVAL protocol, verdict format, evidence rules.
- `netscript-doctrine` — package boundaries for `packages/cli/e2e`.

## ROLE

INDEPENDENT IMPL-EVAL agent. Verdict only; do not edit files.

Repo: /home/agent/projects/netscript/worktrees/007-s11-eval (read-only, detached at the head below)
PR #1760 (S10), branch `test/aspire-13-5-s10-e2e-gate-upgrades`, head `daeee1fde`, base `main`.

**Do not dispatch or re-run hosted runtime tiers** — they are executing on this head now. Static work
only: `deno check --unstable-kv`, targeted `deno test`, lint on changed paths.

### Scope: the live-process repair, one commit

`git diff 4cce17266..daeee1fde` — `evidence/cleanup.ts`, its test, and the post-stop probe fixture,
plus a clean merge of main `77ad823dc`.

### The defect it claims to fix

`evaluatePostStopProbe` classified **containers** into owned / foreign / **unproven**, but
**processes** into only owned / foreign. A matching `aspire`, `aspire-managed` or `dcp` process that
exposed neither an `--apphost` argv nor `ASPIRE_DCP_APPHOST_PATH` satisfied neither branch and
vanished from the evaluation entirely — so a surviving process could pass `assertNoOwnedSurvivors`
while the cleanup receipt showed nothing. The claim is that classification was not *total*, and the
missing bucket was precisely the one that records "could not tell".

The repair adds `unprovenProcesses`, mirroring `unprovenContainers`: reported, never mutated, not a
failure on its own.

### Judge exactly this

1. **Is the classification now total?** Every matching process must land in exactly one of the three
   buckets. Check the `else` branch cannot be bypassed, and that non-matching process names are still
   filtered out *before* classification rather than becoming spurious unproven entries.
2. **Is the RED/GREEN honest?** The fixture gains pid 45, a `dcp` process with no path evidence.
   Verify the new test genuinely fails against the pre-repair code — check out `4cce17266`, apply the
   test, and confirm it fails — rather than passing trivially. A test that passes both before and
   after is a defect.
3. **Is "report, never mutate" preserved?** `assertNoOwnedSurvivors` must still throw only for owned
   containers and owned processes. An unproven process must **not** become a failure, and must not be
   torn down — that would violate the ownership rule that unproven resources are surfaced for a human.
4. **Blast radius.** Does any consumer of `PostStopProbeEvaluation` need updating for the new field,
   and does the cleanup gate still behave identically for the owned/foreign cases?
5. Anything in the merge of main `77ad823dc` that this slice should have adapted to and did not.

### Validation to run

- `deno check --unstable-kv` on the changed paths
- `deno test --allow-all packages/cli/e2e/tests/` (report counts)

Output STRICT JSONL, last line the verdict:
{"area":"<name>","ok":true|false,"evidence":"..."}
{"verdict":"PASS|FAIL_IMPL","summary":"..."}
Ground every claim in a command you actually ran.
