# Native Windows cold DB graph source checkpoint

Root accepted the exact two-owner repair after full source/control/gate reads and independent
37-hash verification. [Source acceptance](root-source-acceptance.md) authorizes checkpoint/push
and a separate review PR; independent IMPL and merge acceptance remain pending. The separate
service and Windows qualification PR source sets remain unchanged.

Native `toFileUrl(entry).href` prevents Deno from treating a Windows drive letter as an external
scheme. The analyzer rejects missing/empty/external-only/kind-less module graphs even when
success-shaped metadata supplies one identity. Existing declared npm imports, exact-one peer
identity, unresolved-module checks, cold cache, flags, exit/log behavior and finally cleanup remain.

Two existing owners, +84/-8:

| Owner | Lines / cap | SHA256 |
| --- | --- | --- |
| .llm/tools/deps/check-db-alignment.ts |100 /120|babe9043e1296dac30e9923bbfee9d3c02f96f062c62c3ec1e90e0fdba5186b1|
| .llm/tools/deps/check-db-alignment_test.ts |86 /140|634c289a7f7b60d8212a227294ed096ed70dc35559732de024d6332a2bbaf96b|

The [evidence manifest](evidence/manifest.json) retains all original RED, lint exclusion refusal,
final results and source/protected audit. Executable diagnostic snapshots are archived as .txt
data so they cannot become Deno test candidates. Historical handoff/final-audit pending/no-commit
fields describe their capture time; this root acceptance/checkpoint supersedes only that status.

| Gate | Actual result |
| --- | --- |
| [Owning RED](evidence/owning-unchanged-production-red.json) → [GREEN](evidence/owning-green.json) |2/4/0 →6/0/0; original assertions and real native spaces/# path control remain|
| [Actual cold RED](evidence/cold-unchanged-red.receipt.json) → [GREEN](evidence/cold-green.receipt.json) |both <none>/exit1 → both exactly @tanstack/db@0.13.0_typescript@7.0.2/exit0,7.775s|
| [Bounded adjacent dependency tests](evidence/adjacent-dependency-tests.json) |23/0/0 across six explicit files|
| [Types](evidence/selected-check.json), [format](evidence/selected-fmt.json), [canonical-rules lint](evidence/selected-lint-canonical-rules.json) |two selected/processed,zero findings/drops/refusals|
| [Initial lint refusal](evidence/selected-lint.json) |retained failure: root config excludes .llm; ignored selected lint config copies root rules exactly|
| [Composite arch](evidence/arch-check.receipt.json) |PASS/exit0,24.636s; actual cold prerequisite and doctrine reached|
| [Audit](evidence/final-audit.json), [cleanup](evidence/cleanup.json) |35 protected hashes match; own scratch and observed native fixture processes0|

Tests use cached/frozen/check, explicit ops/resources sanitizers and trace-leaks. Five new
registrations explicitly enable all three sanitizers; original shorthand retains its settings.
Actual production cold info intentionally uses new caches/network under a120s outer deadline.
Composite arch has a180s deadline, existing warnings and a nested metadata-download attempt;
its standard receipt preserves full stream hashes and bounded tails, not the entire stdout body.
There is no whole-command offline/full-raw-output claim. Native local test has a10s deadline.

No dependency/config/lock/API/debt/source scope expansion or failure waiver. Full release-bump/
repository-copy test breadth was outside the proposal's bounded-test condition; those tests stay
live and unchanged. No service/publication/app/CEF/Aspire/installer or paid model gate was run.
Real CI/review may start under root authority; no ready-merge, integration, issue closure or release
follows from this source checkpoint.
