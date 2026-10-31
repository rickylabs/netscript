# S3 phase-one handoff — CI census repair in progress

Existing PR #2467, branch orch/divybot-6478265568. Original baseline 9a31e879c32a8066c50946a57976f3da34ba43a6; merged main 6a71cd0599673d70cd6311de3bb20b2d6a9dde2c. Independently reviewed source head bdb959d102189f5ad530fd3e07d54d29a8dbc0c4; the final evidence-only commit and public READY report identify the pushed head. Stop at READY: Cockpit reviews and merges. This phase leaves #2416 open.

## Delivered

- 87 typed component contracts and JSON catalog: 66 shipped identities and 21 approved Figma designs; explicit planned/native/pseudo/context anatomy, compatibility values and keyboard metadata.
- Utility markup/CSS migration to data attributes, preserving specificity, native behavior and compound delegation.
- ui:migrate variants for 0.0.8 app-owned copies: whole-app preflight, dry-run, versioned source edits, bounded JSX/CSS tokenization, formatting, original-content rechecks, rollback and idempotence.
- Real-render style providers for all shipped identities and meaningful negative controls.
- Main integration; docs reference/carrier reconciliation and main's canonical #2480 fixture fix, superseding the temporary Page.create repair.
- Independent review found one ActionMenu scope blocker; repaired by retaining popover scope, documented in the contract/JSON/naming record, and guarded by a new rendered regression and expanded browser parity.

## Verification

- Fresh UI tests: 299 passed, zero failed/ignored. CLI migration/app-root: 16 passed.
- Structured Fresh UI check/lint/fmt: all 246 files pass; migration check/lint/fmt: all 15 pass. Browser tool check passes.
- quality:gate including dependency/architecture checks passes on the reviewed source head.
- Two expanded 188-case parity runs (authored CSS and actual CLI-transformed CSS), four width/scheme combinations each: zero computed differences; all PNG pairs identical. Open ActionMenu included, with production base tokens, top-layer activation, geometry and stacking checks. Old-scope negative control fails as expected.
- Retained 24-case normal browser matrix with unchanged axe totals. Exact 0.0.8 consumer proof: 62 converted files; dry-run unchanged, idempotent, workspace check includes all app sources, and 43 copied TSX sources equivalent after installer import relocation. Migration implementation remains unchanged.
- Docs build/rendered-output, original docs renderer test, generated embeds/prose/publish/MCP corpus, migration data freshness and Fresh UI export/reference drift pass. Review threads: zero unanswered. No lock changes.
- Separate same-session Claude IMPL-EVAL: FAIL_FIX → one repair → PASS. See evaluate.md and both full verdicts.

## Measured limits and remaining scope

The required single full scaffold.runtime attempt exits 1 at Aspire/Docker preflight; Docker daemon unavailable, no generated runtime starts, runtime acceptance UNPROVEN. Resource reporter finds no positively proven run-owned survivors; every foreign/unknown resource was left untouched.

Retained baseline limitations: 123 existing Fresh UI doc-lint diagnostics plus JSON-data missing-JSDoc limitation; existing exact-0.0.8 app-local constant-script react-no-danger finding. Workspace app check passes; nothing suppressed.

Gap components, additional styles/all-style behavioral tests, tokens and registry v2 remain in their approved later phases. No issue closure, new PR, label change, force-push, merge, tag or release. Do not commit assignment/report handoff files.

Final main reconciliation is verified: upstream #2480 fixture retained, bridge test and quality:gate/arch:check PASS at c433b6e398781fbc586ddcace4d0c7811c9b7f5e; no Fresh UI/CLI/browser code differs from reviewed bdb959d10. The final closeout commit changes evidence only.

Coordinator follow-up 6536466544 supersedes the previous READY: required quality was red for the unratified ui:migrate census. Ratify the two paths, document the group/child, regenerate carriers and pass local docs gates, then obtain independent review and exact-new-head remote quality SUCCESS before a new READY. Same branch/PR; no merge or labels.

Census source is repaired to 99, with a structural ui:migrate heading and its variants preview example in the CLI references. Live command audit is 99/99 with no missing paths; 10 checker tests and scoped wrappers pass; site build and docs links pass. Carriers regenerated; named docs:accuracy/freshness and independent delta review are next. Do not publish a new READY before exact-head remote quality SUCCESS.

Census follow-up source commit 8f9394c71 has independent IMPL-EVAL PASS and all requested local gates PASS, including named docs:accuracy 99/99, docs links, full site build and all four carrier checks. This closeout commit changes evidence only. Next: push the same branch, watch the actual new-head required quality job to SUCCESS, then publish a new READY with that head/job link and stop. The prior READY remains superseded while remote quality is pending.
