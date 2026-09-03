# F7 binding recovery — clean exact-content checkout

## Authorization and environment correction

The coordinator accepted `receipts/f7-test.json` as an honest environmental red, quarantined the
S5 attempt-5 workspace recoverably at `/tmp/netscript-f7-quarantine.iXF6fb`, and authorized one
environment-only test rerun. The original receipt and evidence commit `885f352e7` remain unchanged.
The original `f7-check.json` PASS was retained and was not rerun.

The leaf worktree contained a coordinator-owned timestamp/content update to `leak-report.md`, so it
was not used as the gate cwd and that change was neither staged nor modified. A detached clean
worktree was created at:

```text
/home/codex/worktrees/netscript-f7-binding-e45144db6
```

Before and after the recovery gates, it reported exact HEAD
`e45144db643f6bde85552a615812c8371e4ce792`, detached state, and an empty short status. No
`allowGitHeadMismatch` option was used.

## Serial recovery receipts

`f7-test-attempt2` ran first. Only after it passed did publish dry-run run; only after that passed
did architecture check run. Each generated receipt has matching `gitHead` and `actualGitHead` at the
immutable content commit.

| Receipt | Invocation ID | Outcome |
| --- | --- | --- |
| `receipts/f7-check.json` | `app-service-client-wiring-f7-check` | retained PASS — 2,944 files, 25 batches, zero diagnostics |
| `receipts/f7-test-attempt2.json` | `app-service-client-wiring-f7-test-attempt2` | PASS — 4,237 passed, 0 failed, 19 ignored (4,256 total) |
| `receipts/f7-publish-dry-run.json` | `app-service-client-wiring-f7-publish-dry-run` | PASS — workspace publish simulation completed |
| `receipts/f7-arch-check.json` | `app-service-client-wiring-f7-arch-check` | PASS — zero doctrine failures; existing warnings remain visible |

The passing 4,256-result run is the same result set as the red attempt: the only verdict change is
the disappearance of the quarantined directory-walk failure. This confirms the F7 source delta was
already green and the first receipt's failure was environmental.

## Exact-set sufficiency

`evaluateEvidenceSet` was recomputed over exactly these four files:

1. `.llm/runs/feat-app-service-client-wiring--1355/receipts/f7-check.json`
2. `.llm/runs/feat-app-service-client-wiring--1355/receipts/f7-test-attempt2.json`
3. `.llm/runs/feat-app-service-client-wiring--1355/receipts/f7-publish-dry-run.json`
4. `.llm/runs/feat-app-service-client-wiring--1355/receipts/f7-arch-check.json`

The result is **`SUFFICIENT`** with an empty reason list. `receipts/f7-test.json` is deliberately
excluded as a superseded red: including it would introduce duplicate `test` gate IDs and a `FAIL`,
making the set insufficient despite the passing recovery.

## Preservation and stop boundary

No source, test, template, fixture, lockfile, README, `docs/**`, or coordinator-owned leak report was
changed. The quarantine and every prior S4/F4/F5/F6/F7 log, receipt, report, hash, and attributed
baseline remain append-only. No runtime attempt, lease, `scaffold.runtime`, `fresh-browser`, Aspire,
Docker, evaluator, readiness, or metadata action occurred.
