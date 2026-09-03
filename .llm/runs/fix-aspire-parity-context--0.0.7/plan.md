# Plan

Profile: bounded tooling validation repair (CLI/tooling principles), no package behavior/public API
change; package touch is one version-neutral JSDoc line. PLAN-EVAL: N/A, complete bounded contract.
Part of #1712, not closure of the epic. No unresolved architecture decisions or new debt.

## Locked scope

1. Add narrowly owned version-floor and negative-version-guard classifications to the existing
manifest generator. Parse only explicit plus-suffixed floor guidance and direct forbidText second
string-literal arguments. Do not exempt entire active files. Classify the upgrade guide as the
existing dual-train compat-fixture kind.
2. Tests prove old pins elsewhere in those files still fail, ordinary positive guards and other
argument positions fail, unowned floors fail, and compat guidance still requires the current train.
3. Make one stale resource-name JSDoc version-neutral; do not change grammar/runtime.
4. Regenerate the manifest from its canonical generator. No consumer bundle edits or manual TSV.

Gates: baseline red, focused tests/check/lint/fmt, phases 1 and 2 including manifest freshness,
source-quality/architecture review, CI, independent substantive review and formal IMPL-EVAL.
Runtime/release gate N/A for this tooling-only leaf; the parent release still requires the full
published canary pair. No Docker/Aspire start, no workflow edits, dependency edits, phase-2 disable,
blanket archival exemptions, or cleanup of historical harness runs.

Risk: broad text matching could hide a pin. Mitigate with narrow owned syntax and negative tests;
fail closed on unfamiliar syntax instead of inventing a general TypeScript parser.

