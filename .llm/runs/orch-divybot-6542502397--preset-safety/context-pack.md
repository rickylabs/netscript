# Resume

PR #2518 on orch/divybot-6542502397 implements only issue 2516 requirements 1–2. Public and maintainer init prepare presets before scaffold writes; resolver validates remote registry schema and HTTPS/loopback policy; retained bytes are reused after scaffold. CLI reference and prose carrier updated, including recovery from later application-stage failures.

Independent read-only claude-opus-5-5 review: implementation PASS (evaluate.md), with same evaluator reviewing both advisory fixes. Full selected CLI suite: 43 passed; final focused regressions: 10 passed; scoped check/lint/fmt, quality:gate, JSR audit, release:preflight, docs:accuracy, 13 root check tasks and all four site checks passed. Runtime scaffold.runtime ran once with cleanup: exit 1 because Docker unavailable, verdict UNPROVEN. Leak reporter: no proven owned resources; 24 unknown/unproven survivors left untouched.

Implementation slice 4407df5 is committed/pushed. Post-commit assets-barrel passed; every root check:* task is green. Next: push final evidence and transition out of draft to materialize CI. Post READY only if required exact-head checks are green, with the head included. No merge (Cockpit owns it), no labels, no closing keyword, no session identifiers or machine paths in public evidence. Refs #2516 only.

## CI repair in progress

Owner reported quality FAILURE at 411c058. Cause: new init regression test was untracked during initial local Aspire manifest gate, so its --no-aspire reference was missing from the generated inventory. Canonical regeneration adds one TSV row. Local parity and 26 parity tests now pass; carrier/publish asset checks pass; deterministic regeneration confirmed. Same independent evaluator returned repair PASS after independently checking fresh parity (998 checked, zero failures). Repair is ready for commit/push and new-head CI. Prior implementation review/tests remain valid because no source/test behavior changed.
