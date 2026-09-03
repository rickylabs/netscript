# F7 binding-gate stop — attempt-5 runtime residue

## Verdict

The serial F7 binding sequence stopped at `test`. `check` passed, `test` failed, and
`publish-dry-run` plus `arch-check` were not run. No missing receipt was authored. Exact-set
sufficiency is `INSUFFICIENT`.

Both executed receipts attest immutable content head
`e45144db643f6bde85552a615812c8371e4ce792` with matching `gitHead` and `actualGitHead`, no mismatch
override, and distinct invocation IDs.

| Contracted receipt | Invocation ID | Outcome |
| --- | --- | --- |
| `receipts/f7-check.json` | `app-service-client-wiring-f7-check` | `PASS`, exit 0 — 2,944 files, 25 batches, zero diagnostics |
| `receipts/f7-test.json` | `app-service-client-wiring-f7-test` | `FAIL`, exit 1 — 4,236 passed, 1 failed, 19 ignored (4,256 total results) |
| `receipts/f7-publish-dry-run.json` | not invoked | missing / `NOT_RUN` |
| `receipts/f7-arch-check.json` | not invoked | missing / `NOT_RUN` |

`evaluateEvidenceSet` over exactly those four named paths reports:

```text
INSUFFICIENT
- missing receipt for arch-check
- missing receipt for publish-dry-run
- test did not pass (FAIL)
```

## Sole failure and attribution

The sole repo-wide failure is:

```text
repository contains no shared-host bulk teardown command
.llm/tools/agentic/teardown/forbidden-commands_test.ts:14
PermissionDenied: readdir
.llm/tmp/cli-e2e/plugin-smoke-20260815-213942/.data/postgres/18/docker
```

The failing test has no diff from pre-implementation `c53726c69`; its last source commit is
`4634afe56df52c51f9d0c427cd97cc55f4d6827c` (`2026-08-03`, #1077). The blocked descendant belongs
to the preserved S5 attempt-5 runtime workspace: its outer directory timestamp is 21:43, its
Postgres 18 directory is `root:root`, and the unreadable `docker` descendant is mode `0700`, owner
`dnsmasq:root`. F7 changed only the browser probe and its focused test and did not create or mutate
the failing walker or runtime workspace.

The result arithmetic independently proves the F7 delta executed. F6 attempt 2 had 4,248 total
results. F7 has 4,256, exactly eight more. The focused F7 file grew from 14 to 22 tests, also exactly
eight; the full gate records seven additional passes while the one unrelated traversal failure
replaces the otherwise eighth pass. The focused suite itself passed 22/0, including every new F7
case.

Attribution is therefore **S5 attempt-5 runtime-workspace filesystem residue, not an F7 source
regression**. It remains a binding-gate failure and cannot be carried into a sufficient set without
coordinator disposition. The residue was not deleted, moved, chmodded, or otherwise mutated. There
was no retry, and no downstream binding gate was started.

## Preserved evidence and stop boundary

`receipts/f7-test.json` remains the append-only red. The five S5 attempt logs and hashes,
`f6-test.json` as its earlier superseded red, every S4/F4/F5/F6/F7 report and receipt, and the Fresh
45 / SDK 3 attributed baselines remain unchanged.

No `scaffold.runtime`, `fresh-browser`, runtime lease, browser process, Aspire, Docker, evaluator,
readiness, metadata, lockfile, documentation, or product repair occurred during this stop.

## Coordinator disposition and environment-only recovery

The coordinator accepted this receipt as an environmental red, quarantined the S5 attempt-5 tree
recoverably at `/tmp/netscript-f7-quarantine.iXF6fb`, and authorized one clean-checkout rerun. The
original receipt remains unchanged and excluded from the passing evidence set.

At the same immutable content commit, `receipts/f7-test-attempt2.json` passes with 4,237 passed,
zero failed, 19 ignored, and the same 4,256 total results. Conditional publish dry-run and
architecture check then pass serially. Exact-set recovery evidence is recorded separately in
`reports/f7-binding-recovery.md`; this failure record is not relabelled or overwritten.
