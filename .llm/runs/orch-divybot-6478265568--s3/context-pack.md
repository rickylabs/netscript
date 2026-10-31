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

The related contributor inventory test now includes ui:migrate and uses a type-only Command import. Its focused suite and check/lint/fmt all pass. Only the test expectation changed after a5077091a; docs/carrier/runtime inputs remain unchanged. Same-session independent delta re-review and final-head CI are next.

Final local census/test ratification source is independently approved at 06cca412b; all focused test/check/lint/fmt results are committed. Push this evidence-only successor and wait for the actual required quality job at that final head. The earlier quality green at a5077091a is historical. Both medium migration review threads are answered and remain unresolved for Cockpit; no runtime migration fix is claimed.

Coordinator's independent review supersedes READY at acd9a5abe: repair both migration edge cases and the CLI reference claim; runtime addendum also requires the copied Markdown attribute fix and both scaffold-runtime CI tiers green at the final head. The two existing review threads must be resolved only after repairs/tests. Follow the new worklog contract; one approved repair round, no merge.

Repair source faad5805c is integrated with main at d5f5fa5f3 without product changes. CLI/app-root 19/19 and template guard/copied Markdown 2/2 PASS. All three restored-old-implementation controls fail as expected. Both 188-case parity runs PASS; exact consumer62/second0/workspacecheck PASS. Merged quality:gate including architecture/dependencies PASS. Local canonical runtime attempt still exits1 at Aspire/Docker preflight: no daemon. This does not satisfy runtime; required cloud CI plus both runtime tiers must be green at final pushed head. Independent same-session Opus review and full Fresh UI suite are nonterminal.

Same-session repair review round1 found Markdown formatter idempotence and literal-class-before-spread blockers. Both now reproduce RED then pass after one corrective pass. Actual canonical formatter integration test covers old Markdown -> apply -> second0 and customized-anatomy rejection. Preflight covers trailing spreads, preserving literal-after-spread precedence. CLI/app-root20/0, complete Markdown consumer/template tests3/0, structured check/lint/fmt262 PASS. Exact0.0.8 replay now explicitly installs Markdown and passes62/second0/check/fmt. Full Fresh UI300/0 before canonical-only template normalization; final rerun is in flight. Re-steer same Opus reviewer for final PASS, push stable head, resolve both threads, require final-head all CI and both runtime jobs before READY.
