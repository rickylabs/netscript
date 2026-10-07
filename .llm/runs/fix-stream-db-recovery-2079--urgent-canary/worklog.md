# Worklog

## Design

State/lifecycle, identity, transport and clock ports, cancellation, concurrency and checkpoint delivery are locked in plan.md. Preserve existing collection identity; supervisor reopens public read sessions, not databases. Contributor adds recovery classification in adapter and proves behavior at owned handle boundary.

1 Activate: owner harness/PR/doctrine skills loaded.
2 Research: current-main upstream seams and MCP consulted.
3 Plan: contracts, three slices, failure/resume rules locked.
4 PLAN-EVAL: mandatory, pending; implementation has not started.
5 Implement: pending PASS.
6 Gates: pending.
7 IMPL-EVAL: mandatory pending.
8 Review: pending.
9 Close: no merge; truthful issue acceptance and CI required.

PLAN-EVAL PASS at d1848c4e1847c17e98ea58854ad85234b562bcee, independent GLM session ses_ee7e3440effe5BzGXJ43JrSBHD. No implementation preceded PASS. Generator clarification: report parent SHA contains a transcription typo; actual freshly fetched baseline is supervisor SHA. During review the plan clarified direct existing-client declaration, genuine persistent reference server and additive status getter; no changed architecture. Implementation review must cover final public status contract too.

Same-session PLAN-EVAL cycle two PASS at 58933e57c488e87764ffd45c7c3978ab257bc348, covering finite public json() reads, live:false and public long-poll params. Original report retained separately. Failed first seam remains only uncommitted WIP; replace it now, then require every regression and mutation gate.

Implementation follows revised finite native json() seam. All nine affected stream tests pass, including real SIGKILL/restart of the upstream persistent reference server, same collection identity, retained pre-restart row, new post-restart row, resumed offset and no origin replay. Six new lifecycle tests each have isolated red source mutation. Killed-server regression also turns red with recovery disabled and with offset reset; all eight mutations exit 1 by test assertion, and every source is restored byte-for-byte. Restored complete stream suite exit 0. No dependency resolution change: lock delta is one workspace import declaration for the already-resolved client.

Scoped fresh source check: exit 0; streams lint/fmt exit 0; fresh publish dry-run and quality:gate exit 0. Public consumer initially failed with independently ranged nominal client class; exact already-resolved state/client pair preserves public compatibility without upgrading resolutions. Doc lint reports existing other-entrypoint debt; changed streams entrypoint remains clean (entrypoint report retained).

Correction to preceding doc note: the changed streams entrypoint has eleven private-type references and no missing JSDoc, identical to an actual freshly fetched-main doc-lint run. Full fresh doc lint exits 1 for existing debt. No new diagnostic delta; publish dry-run exits 0. Public type-consumer mutation removing the reconnect type export exits 1; restoration passes. Required docs/export/prose/publish-assets carriers regenerated using pinned CI toolchain, all generator exits 0.

Final docs accuracy and all carrier checks exit 0 after committing generated output. JSDoc example gate exits 1 because exact member native imports conflict with ranged root catalog aliases. Correction aligns the canonical catalog to the already-locked compatible state/client pair and declares direct client dependency through the existing package catalog seam. No resolution upgrade. Independent implementation session ses_ee7be024dffeJ5HAlcs9qY7M49 reproduced runtime and mutation results; supervisor interrupted its expanding version probes (launcher 130) and re-steers the same session for bounded final verdict after correction. Critical audit receipt at ae927ce45369aff10506a53f19552660b95a796f records actual exit 1.

Catalog correction: dependency cache, full JSDoc example gate and streams public consumer all exit 0. Locked npm/JSR/remote resolution maps are byte-equivalent as parsed JSON; only canonical specifier/workspace metadata changed.
