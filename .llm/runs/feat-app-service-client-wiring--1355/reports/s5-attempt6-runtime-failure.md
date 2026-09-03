# S5 attempt 6 — runtime failure and cleanup

## Immutable execution identity

- Lease record: features topic `ac1ec35cf`
- Product content: `e45144db643f6bde85552a615812c8371e4ce792`
- Leased evidence: `ed3f78e0d87784b1869166bd2574737c62fac0af`
- Tier-A: `4a65a2670`
- Executed checkout: `/home/codex/worktrees/netscript-s5-a6-ed3f78e0d`
- Executed HEAD: `ed3f78e0d87784b1869166bd2574737c62fac0af`

The leaf checkout had a coordinator-generated `leak-report.md` timestamp change after preflight.
It was neither overwritten nor staged before execution. A new detached checkout at the exact
leased evidence commit was clean before the gate and was used for the one authorized invocation.
No commit occurred between the lease grant and execution.

## Browser selection evidence

The runtime command was launched with the strict override:

```text
NETSCRIPT_E2E_BROWSER_EXECUTABLE=/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
```

The exact-head selector measurement records:

```json
{
  "path": "/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome",
  "source": "NETSCRIPT_E2E_BROWSER_EXECUTABLE",
  "version": "Google Chrome for Testing 151.0.7922.34"
}
```

The durable selector record is
`reports/s5-attempt6-browser-selection-20260815-205715.json`, SHA-256
`fd208b82c31497801ab4d396321685d7858ecbf07788a66353a6618f24f0e1da`. This was a
bounded `--version` selector measurement after the red, not a second runtime or browser-behavior
attempt. The timed-out child emitted no stdout or stderr into the suite report, so this separate
selector record preserves source, path, and version without claiming that refetch behavior returned
evidence.

## Suite-owned verdict

Exactly one release-class command ran:

```text
NETSCRIPT_E2E_BROWSER_EXECUTABLE=/home/codex/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome \
  deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

- Raw exit code: **1**
- Terminal counts: **69 passed / 1 failed / 0 skipped**
- Sole failed gate: `behavior.service-client-refetch`
- Failure: child command exited 143 after **900,030 ms**; expected 0
- Retry: none
- `cleanup.aspire-stop`: PASS, 1,432 ms
- Suite-owned Docker cleanup: PASS; three suite-created containers recorded as removed
- `generated.service-client-contract`: PASS
- `generated.deno-fmt-check`: PASS

The failed child has empty stdout/stderr tails. Attempt 6 therefore proves that F7 selected a valid
explicit browser executable, but it still returns no mutation/refetch evidence before the
suite-owned 900-second command boundary. This is an honest runtime red; its deeper cause remains
unattributed pending review. It is not relabelled as a product refetch failure or as a pass.

Durable suite evidence:

- Pretty raw log:
  `reports/s5-attempt6-scaffold-runtime-20260815-205715.log`, SHA-256
  `1bf8cb03aaa3be0ba900254abdaf3065aa9f7c8cae5989bac37ed396a919aaa0`
- Suite-owned NDJSON with the complete per-gate ledger:
  `reports/s5-attempt6-scaffold-runtime-20260815-205715.ndjson`, SHA-256
  `ffab7e7f0b7764c7d2e0eca5873fa9d5cfee7c5f278743a8886e7bbba53de356`

Because `scaffold.runtime` failed, `fresh-browser` is **NOT_RUN** and no catalog receipt exists.

## Mandatory cleanup and D-18 audit

The first post-suite `agentic:leak-check` reported Aspire `ok`, Docker `ok`, and `survivors: []`.
The independent process audit additionally found three run-owned Aspire NuGet search children:
PIDs `896151`, `896186`, and `896190`, each with cwd under the attempt-6 generated project's
`aspire/` directory. They were revalidated immediately before cleanup, then sent `SIGTERM` and
`SIGCONT`; all three exited without `SIGKILL`. Foreign Aspire MCP helpers were not touched.

The first D-18 scan found exactly one unreadable run-owned directory:

```text
/home/codex/worktrees/netscript-s5-a6-ed3f78e0d/.llm/tmp/cli-e2e/
  plugin-smoke-20260815-225723/.data/postgres/18/docker
```

The complete generated project and its suite log were moved, not deleted, to the timestamped
recoverable quarantine:

```text
/tmp/netscript-s5-a6-quarantine-20260815-4M9v8k/
```

The source project path is absent; the quarantined project directory and its suite log are present.

The final independent audit reports:

- `agentic:leak-check`: Aspire `ok`, Docker `ok`, `survivors: []`
- `aspire ps --format json`: `[]`
- `docker ps -aq`: empty
- run-owned processes: `[]`
- run-owned listeners: `[]`; `ss` listener scan exit 0
- detached-checkout `.llm/tmp` unreadable-directory scan: exit 0, empty
- leaf `.llm/tmp` unreadable-directory scan: exit 0, empty
- quarantine: preserved and not deleted

The host is empty of attempt-6 resources. This cleanup proof relinquishes the leaf's use of the
singleton runtime lease; central release remains the coordinator's durable state transition.

## Stop boundary

No source, test, template, fixture, lockfile, README, or `docs/**` file changed. No second runtime
attempt, `fresh-browser`, evaluator, readiness transition, label, acceptance box, merge, or
quarantine deletion occurred. All attempts 1–6, the preserved `f6-test.json` and `f7-test.json`
reds, and all prior S4/F4/F5/F6/F7 evidence remain append-only.
