# F6 binding-gate stop — permission-denied runtime residue

## Verdict

The serial F6 binding sequence stopped at `test`. `check` passed, `test` failed, and
`publish-dry-run` plus `arch-check` were not run. No missing receipt was authored. Exact-set
sufficiency is `INSUFFICIENT`.

All executed receipts attest immutable content head
`7fa29ad3ed10ad903b9cbbd518111e6bf2754761` with matching `gitHead` and `actualGitHead` and no
mismatch override.

| Contracted receipt | Invocation ID | Outcome |
| --- | --- | --- |
| `receipts/f6-check.json` | `app-service-client-wiring-f6-check` | `PASS`, exit 0 — 2,944 files, 25 batches, zero diagnostics |
| `receipts/f6-test.json` | `app-service-client-wiring-f6-test` | `FAIL`, exit 1 — 4,228 passed, 1 failed, 19 ignored (4,248 total results) |
| `receipts/f6-publish-dry-run.json` | not invoked | missing / `NOT_RUN` |
| `receipts/f6-arch-check.json` | not invoked | missing / `NOT_RUN` |

`evaluateEvidenceSet` over exactly those four named paths reports:

```text
INSUFFICIENT
- missing receipt for arch-check
- missing receipt for publish-dry-run
- test did not pass (FAIL)
```

## Sole failure and attribution

The sole repo-wide test failure is:

```text
repository contains no shared-host bulk teardown command
.llm/tools/agentic/teardown/forbidden-commands_test.ts:14
PermissionDenied: readdir
.llm/tmp/cli-e2e/plugin-smoke-20260815-203755/.data/postgres/18/docker
```

The failing test and teardown tree have no diff between pre-implementation `c53726c69` and the F6
content head. The test's last source commit is `4634afe56df52c51f9d0c427cd97cc55f4d6827c`
(`2026-08-03`, #1077). The filesystem path is not tracked product code: the outer
`plugin-smoke-20260815-203755` directory was created at `2026-08-15 20:37:56 +0200`, matching the
S5 attempt-4 runtime workspace, and the blocked descendant is mode `0700`, owner `dnsmasq:root`.
The F6 two-file repair did not create or modify the failing test or this residue.

Attribution is therefore **earlier S5 runtime-workspace filesystem residue, not an F6 source
regression**. It is still a binding-gate failure and cannot be carried as a sufficient result. The
directory was not chmodded, deleted, or otherwise mutated; the test was not retried, and no
downstream binding gate was started.

## Preserved evidence

The F6 focused deterministic suite remains 14 passed / 0 failed. The S5 attempt-4 raw log remains
unchanged with SHA-256
`b476da4ce039d03785e46669d51919b48c41fbae80ca41ca9188bcbb53e97f23`. Every earlier attempt,
report, receipt, and carried Fresh/SDK baseline remains append-only.

No `scaffold.runtime`, `fresh-browser`, Aspire, Docker, lease, evaluator, readiness, metadata,
lockfile, documentation, or product repair occurred during this binding stop.
