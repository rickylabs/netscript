# F6 binding recovery after environmental quarantine

## Attempt-2 verdict

After the coordinator recoverably quarantined the S5 attempt-4 runtime tree, the one authorized
environment rerun passed at unchanged content head
`7fa29ad3ed10ad903b9cbbd518111e6bf2754761`:

- `receipts/f6-test-attempt2.json`
- invocation `app-service-client-wiring-f6-test-attempt2`
- `PASS`, exit 0
- 4,229 passed / 0 failed / 19 ignored (4,248 total; zero unique failures)
- `gitHead == actualGitHead == 7fa29ad3ed10ad903b9cbbd518111e6bf2754761`

All three F6-added results remain in the 4,248-result total and now pass. The permission-denied
failure vanished only after the abandoned tree moved out of the repository, confirming the
environmental attribution.

The original `receipts/f6-test.json` remains an append-only `FAIL`. It is superseded environmental
evidence and is intentionally excluded from the passing evidence set; it was not overwritten,
deleted, or re-pointed.

## Exact contracted passing set

| Receipt | Invocation ID | Outcome | Attested content head |
| --- | --- | --- | --- |
| `receipts/f6-check.json` | `app-service-client-wiring-f6-check` | `PASS`, exit 0 | `7fa29ad3e` |
| `receipts/f6-test-attempt2.json` | `app-service-client-wiring-f6-test-attempt2` | `PASS`, exit 0 | `7fa29ad3e` |
| `receipts/f6-publish-dry-run.json` | `app-service-client-wiring-f6-publish-dry-run` | `PASS`, exit 0 | `7fa29ad3e` |
| `receipts/f6-arch-check.json` | `app-service-client-wiring-f6-arch-check` | `PASS`, exit 0 | `7fa29ad3e` |

`evaluateEvidenceSet` was recomputed over exactly those four files with expected gate IDs `check`,
`test`, `publish-dry-run`, and `arch-check`. The result is **SUFFICIENT** with an empty reasons list.

No product, template, fixture, lockfile, documentation, runtime resource, expensive gate, browser,
Aspire, Docker, lease, evaluator, readiness, label, or metadata change occurred.
