# S5 attempt 5 runtime failure

## Lease and immutable execution identity

- Central singleton lease: S5 attempt 5, granted for PR #1664 at topic checkpoint `a4224dbb1`.
- Lease-bound leaf evidence head:
  `a8a160285d4f9bddb95a5dac6cfbde85e1265ebc`.
- Lease-bound product head:
  `7fa29ad3ed10ad903b9cbbd518111e6bf2754761`.
- Executed leaf head: `a8a160285d4f9bddb95a5dac6cfbde85e1265ebc`.
- Command, executed exactly once:
  `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`.
- Release-gate verdict: **FAIL**; inner `deno task` exit code 1.
- `fresh-browser`: **NOT_RUN** because the scaffold prerequisite failed; no receipt exists.

The complete pretty transcript is preserved at
`reports/s5-attempt5-scaffold-runtime-20260815-2139.log`, SHA-256
`ff349b40f7f70341934e170df7c67d147c0ed983173b41871421755ad55e062b`.

The suite-owned NDJSON event log is preserved at
`reports/s5-attempt5-scaffold-runtime-20260815-2139.ndjson`, SHA-256
`e35d6fbcbdfc0b046be3fec29fa5dee0b0369094645b75cb42fca1e0350bbc16`.
Its terminal `suite-end` record contains every step ID, verdict, duration, and evidence object.

The capture pipeline streamed the complete transcript through `tee`; its outer shell status was 0.
The inner command's raw status is still unambiguous and is recorded as 1: the transcript ends in
uncaught `RemoteError(1, 'CLI E2E suite failed')`, while the suite-owned terminal report has
`ok: false` and one failed step. No retry was used to replace this evidence.

## All gate counts

The suite-owned terminal report contains **70 total steps: 69 passed, 1 failed, 0 skipped**.

| Gate family | Passed | Failed | Skipped | Total |
| --- | ---: | ---: | ---: | ---: |
| `preflight.*` | 2 | 0 | 0 | 2 |
| `scaffold.*` | 15 | 0 | 0 | 15 |
| `generated.*` | 11 | 0 | 0 | 11 |
| `runtime.*` | 21 | 0 | 0 | 21 |
| `database.*` | 5 | 0 | 0 | 5 |
| `behavior.*` | 13 | 1 | 0 | 14 |
| `cleanup.*` | 2 | 0 | 0 | 2 |
| **Total** | **69** | **1** | **0** | **70** |

The pretty transcript contains 68 explicit `PASSED` gate-end lines, one explicit `FAILED` line,
and the same summary. The 69th pass is the suite runner's synthetic
`cleanup.docker-created-containers` step, which is present in the NDJSON terminal report but is
added after reporter gate events and therefore has no separate pretty line. The two cleanup passes
are `cleanup.aspire-stop` (576 ms) and `cleanup.docker-created-containers` (0 ms).

The runtime-correctness gates repaired earlier in this leaf stayed green:

- `scaffold.service-client-add` — passed in 1,481 ms;
- `scaffold.service-client-generate` — passed in 1,038 ms;
- `generated.service-client-contract` — passed in 3,096 ms;
- `generated.deno-check` — passed in 4,137 ms;
- `generated.deno-lint` — passed in 211 ms;
- `generated.deno-fmt-check` — passed in 260 ms.

All 70 exact IDs, outcomes, durations, and evidence are retained in the NDJSON log rather than
being reconstructed from the summary line.

## Sole failure and attribution

The only failed step was `behavior.service-client-refetch` after 38,072 ms:

```text
Error: timed out waiting for Chrome DevTools target
    at waitUntil (service-client-browser-probe.ts:339:9)
    at waitForDebugTarget (service-client-browser-probe.ts:357:3)
    at collectBrowserRefetchEvidence (service-client-browser-probe.ts:136:20)
```

The probe failed before connecting a CDP client, navigating to the generated app, issuing the users
mutation, or counting a settled list refetch. This is therefore **not a verdict on refetch
behavior**. The behavior remains unproven.

This gate and probe are leaf-added. At pre-implementation `c53726c69`, `git cat-file -e` for
`service-client-browser-probe.ts` exits 128 because the file does not exist, and `git grep` for
`behavior.service-client-refetch` exits 1 with no match. Attribution is therefore a **leaf-caused
probe/runtime-integration failure**, not a carried baseline or a generated application failure.

The host has no Linux Chrome/Chromium candidate from the probe's allowlist; Windows Chrome and Edge
candidates exist, and the probe selects Windows Chrome first. That is an observed environment fact,
not a proven mechanism: browser stderr is drained without retention and the temporary profile is
removed in `finally`, so the exact reason the child exposed no DevTools target is unknown. No
product or probe repair was attempted under the lease.

## Mandatory cleanup and independent host audit

Suite-owned `cleanup.aspire-stop` passed. The suite-owned Docker-prune step also passed. Run-owned
teardown was previewed and applied and reported no AppHosts, containers, or escalations:

```json
{
  "applied": true,
  "stoppedAppHosts": [],
  "removedContainers": [],
  "escalated": []
}
```

The final `agentic:leak-check` at `2026-08-15T19:48:35.122Z` returned exit 0:

```json
{
  "probes": {
    "aspire": { "state": "ok" },
    "docker": { "state": "ok" }
  },
  "survivors": []
}
```

Independent checks found `aspire ps --format Json` equal to `[]`, an empty `docker ps`, no
AppHost/DCP/application/browser/runtime process, and no relevant TCP listener. The process audit
showed only the session-owned `aspire mcp start` helpers, which were preserved.

Three stopped `aspire-managed nuget search` children were briefly observed with arguments rooted at
this run's generated `plugin-smoke-20260815-213942/aspire` directory. They exited naturally between
the ownership check and the targeted TERM call (`No such process` for every PID), so no signal was
delivered. The final process audit contained none of them.

The leaf releases the singleton lease only after this empty-host proof. Because scaffold failed,
the conditional browser gate and its second cleanup audit are **NOT_REACHED / NOT_APPLICABLE**.

All four earlier S5 attempts, every earlier failure report and receipt, `f6-test.json`, and the
Fresh 45 / SDK 3 carried baselines—including the separately named plugin-streams diagnostic—remain
append-only and unchanged.
