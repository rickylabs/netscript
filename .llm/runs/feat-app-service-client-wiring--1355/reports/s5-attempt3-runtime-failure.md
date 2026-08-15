# S5 attempt 3 runtime failure

## Lease and immutable execution identity

- Central lease checkpoint: `2da4e1b0e874e6d5740355dcd9efd8267dcbf2b0`
- Lease-bound leaf head: `6f813b0db35df38dcd9dc7f1ea333e997399fac0`
- Executed leaf head: `6f813b0db35df38dcd9dc7f1ea333e997399fac0`
- Command: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
- Release-gate verdict: **FAIL**, raw exit code 1
- Suite summary: `passed=32 failed=1 skipped=0`
- Suite-owned raw JSONL output:
  `reports/s5-attempt3-scaffold-runtime-20260815-191609.log`
- Raw-log SHA-256: `677e7912ff0e6e77cd61ecb68a106607b7e6305324575bb5e84c78771f81302c`

The coordinator's preflight leak check refreshed `leak-report.md` after its clean-tree observation.
That run-artifact-only timestamp remained uncommitted during execution; no commit moved the leased
head before or during the suite. No catalog entry or `run-gate.ts` receipt was created for the
release-class gate.

## Gate results

F4's repaired `generated.service-client-contract` passed in 3,079 ms against the real generated
project. It accepted first-call Aspire convergence and proved immediate same-input idempotency.

The sole failing gate was `generated.deno-fmt-check` — "Run the generated workspace format-check
task". Its command, `deno task fmt:check`, exited 1. The generated quality runner reported:

```text
error: Found 12 not formatted files in 172 files
```

The suite then ran `cleanup.aspire-stop`, which passed. No product repair or suite retry followed.

## Attribution

This is a **pre-existing generated-helper formatting failure newly reached by attempt 3**, not a
failure caused by this leaf:

- The captured formatter diff maps to generated
  `aspire/.helpers/register-plugins.mts`.
- A focused read-only `deno fmt --check` of that preserved file alone reproduced exit 1.
- Its generator,
  `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-plugins.ts`, has an
  empty diff between pre-implementation `c53726c69` and the leased head.
- The pre-implementation `scaffold.runtime` suite already places
  `runtime.service-env-fixture` before `generated.deno-fmt-check`, so the unchanged helper generator
  and unchanged formatting gate are both exercised in the baseline sequence.

The original suite log's 12-file count remains the authoritative gate evidence; the single-file
check is attribution evidence only and was not presented as a replacement gate verdict.

## Mandatory cleanup proof

Suite-owned `cleanup.aspire-stop` passed. Run-owned teardown returned:

```json
{
  "applied": true,
  "stoppedAppHosts": [],
  "removedContainers": [],
  "escalated": []
}
```

The post-runtime `agentic:leak-check` returned exit 0 at
`2026-08-15T17:19:05.522Z`:

```json
{
  "probes": {
    "aspire": { "state": "ok" },
    "docker": { "state": "ok" }
  },
  "survivors": []
}
```

The host is empty. Because `scaffold.runtime` failed, `fresh-browser` was **NOT_RUN** and no browser
receipt exists.
