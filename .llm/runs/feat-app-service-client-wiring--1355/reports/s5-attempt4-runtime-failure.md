# S5 attempt 4 runtime failure

## Lease and immutable execution identity

- Central singleton lease checkpoint: `4619f4408ac2913879d13a669b1a880b6dc61e30`
- Lease-bound leaf evidence head: `1263f655b37d64a258619403398ca7117ea000d5`
- Lease-bound content head: `fda78ee438ea40888e5fb3870a78df70cabb8c82`
- Executed leaf head: `1263f655b37d64a258619403398ca7117ea000d5`
- Command: `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`
- Release-gate verdict: **FAIL**, raw exit code 1
- Suite summary: `passed=69 failed=1 skipped=0`
- Suite-owned raw output:
  `reports/s5-attempt4-scaffold-runtime-20260815-2037.log`
- Raw-log SHA-256: `b476da4ce039d03785e46669d51919b48c41fbae80ca41ca9188bcbb53e97f23`

The coordinator's preflight leak check refreshed `leak-report.md` after its clean-tree observation,
matching the already-documented attempt-3 behavior. That run-artifact-only timestamp remained
uncommitted during execution. No commit moved the lease-bound leaf head before or during the suite.
No catalog entry or `run-gate.ts` receipt was created for this release-class gate.

## Gate results

F4/F5's intended runtime proofs passed before the later failure:

- `generated.service-client-contract` passed in 5,142 ms against the real generated project.
- `generated.deno-check` passed in 5,722 ms.
- `generated.deno-lint` passed in 255 ms.
- `generated.deno-fmt-check`, the sole attempt-3 failure, passed in 343 ms.

The only failing gate was `behavior.service-client-refetch` — “Prove settled users update
invalidates and refetches its list once.” It ran for 40,602 ms and then failed because the probe's
`finally` block unconditionally called `child.kill('SIGTERM')` after the browser child had already
terminated:

```text
TypeError: Child process has already terminated
    at ChildProcess.kill
    at collectBrowserRefetchEvidence
        (service-client-browser-probe.ts:211:11)
```

The exception occurred during probe cleanup and prevented the gate from returning its collected
evidence, so the behavioral scenario is not reported as passing. Suite-owned `cleanup.aspire-stop`
then passed in 1,946 ms. No product or test repair and no suite retry followed.

## Attribution

This is a **leaf-caused probe defect**, not a carried pre-existing baseline. Read-only measurement at
pre-implementation `c53726c69` returned exit 128 for:

```text
git cat-file -e c53726c69:packages/cli/e2e/src/application/gates/scaffold/service-client-browser-probe.ts
```

The probe file did not exist at that commit. At the leased head, its `finally` block contains the
unconditional `child.kill('SIGTERM')` at line 211. The raw failure names that exact line and failure
mode. No broader product attribution is claimed.

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
`2026-08-15T18:48:31.380Z`:

```json
{
  "probes": {
    "aspire": { "state": "ok" },
    "docker": { "state": "ok" }
  },
  "survivors": []
}
```

The host is empty and the Aspire MCP start helpers were not touched. Because `scaffold.runtime`
failed, `fresh-browser` was **NOT_RUN** and no browser receipt exists.
