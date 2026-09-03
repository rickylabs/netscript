# Plan

Profile: bounded tooling validation repair (CLI/tooling principles), no package behavior/public API
change; package touch is one version-neutral JSDoc line. PLAN-EVAL: N/A, complete bounded contract.
Part of #1712, not closure of the epic. No unresolved architecture decisions or new debt.

## Locked scope

Owner amendment (2026-09-03): Aspire checks must ignore ALL generated harness run files and transient
state, not flag these as framework/documentation defects. Fold this directly into existing PR #1982.

1. Shared scan-scope policy excludes every .llm/runs directory, .llm/tmp, .agents/generated working
copy and transient caches/dependency/runtime state from parity, host-port and polling checks.
The manifest no longer re-includes its owning research run. Retain committed files; no cleanup.
2. Keep the narrowly owned negative-version-guard classification; only direct forbidText second
string-literal arguments are ignored. Classify the maintained upgrade guide as the existing
dual-train compat-fixture kind. The earlier generated-guide version-floor exception is removed
because those working copies are now wholly outside the scan domain.
3. Tests prove excluded rows are never read, live manifest contains no run/transient rows, and the
same violations in framework/docs still fail. Preserve shipped generated source and compat cases.
4. Make one stale resource-name JSDoc version-neutral; do not change grammar/runtime.
5. Regenerate the manifest from its canonical generator. No consumer bundle edits or manual TSV.
6. Record the durable scan-versus-retention rule in AGENTS.md; extend the existing tests only.
7. Keep the shipped host-port checker import-closed: declare its scope helper as a consumer-tools
support module and regenerate its canonical embedded carrier. Existing bundle closure tests prove it.

Gates: baseline red, focused tests/check/lint/fmt, phases 1 and 2 including manifest freshness,
source-quality/architecture review, CI, independent substantive review and formal IMPL-EVAL.
Runtime/release gate N/A for this tooling-only leaf; the parent release still requires the full
published canary pair. No Docker/Aspire start, no workflow edits, dependency edits, phase-2 disable,
blanket archival exemptions, or cleanup of historical harness runs.

Risk: broad text matching could hide a pin. Mitigate with narrow owned syntax and negative tests;
fail closed on unfamiliar syntax instead of inventing a general TypeScript parser.
