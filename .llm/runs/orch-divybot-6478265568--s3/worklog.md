# Worklog

## Design

1. Public surface: documented `@netscript/fresh-ui/contracts`, serializable per-component contracts, data attributes on shipped markup, `netscript ui:migrate variants`.
2. Domain vocabulary: contract = shared prop/anatomy/attribute/accessibility interface; style = implementation preserving that interface; part = stable kebab-case anatomy; axis = independent attribute dimension; planned = specified but not implemented in Utility.
3. Ports: Preact rendering, browser computed styles, existing CLI app-root and filesystem ports. Contract data has no IO.
4. Constants: contract vocabulary and legacy modifier-to-attribute mappings centralized; defaults explicit. No listener-based state synchronization.
5. Commit slices: format → category contracts → component migration → CLI migration → render/parity/consumer proof. See plan for owned files and gates.
6. Deferred scope: gap components, token changes, non-Utility styles and S2 registry work, per owner instruction.
7. Contributor path: `packages/fresh-ui/src/contracts/README.md` explains adding a contract and style fixture.

## Routing override (verbatim)

“Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only. Fix once, record both verdicts.”

## Bootstrap

Read the complete assignment, prior S0/S8 memory, harness/doctrine/CLI/PR/tooling/JSR guidance and full component spec. Queried matrix feature row. Consulted NetScript MCP. No duplicate implementation found. Implementation has not started; PLAN-EVAL pending.

## Slice 1 — contract format

PLAN-EVAL round 2 PASS before product implementation. Added explicit documented readonly contract types and pure JSON serialization on ./contracts. No runtime implementation imports or dependencies. Format/serialization tests and scoped check/lint/fmt pending; separate review pending.

Slice 1 terminal: separate Claude review FAIL_FIX repaired once → PASS; scoped test (1 passed), check/lint/fmt and quality:gate all exit 0. Published contributor guide included; full metadata round-trip covered. Reconciled against bootstrap head; no registry/lock changes.

Slice 2: 87 typed catalog entries (66 shipped + 21 approved Figma-category designs), JSON export, coverage/consistency/serialization tests. Source files partitioned into category groups capped below 500 lines; exceeds the target file count because explicit data stays readable. Gate and review pending.

Slice 2 terminal: catalog tests 4/4 PASS; scoped check/lint/fmt and quality:gate exit 0. Separate reviewer FAIL_FIX keyboard findings repaired once → PASS. CI docs export/symbol omission corrected; targeted Fresh UI docs drift checker PASS. Reconciled source catalog and JSON; no lock changes. Next: source migration and parity.

Slice 3 in validation: migrated shipped JSX and CSS selectors, preserving base/element hooks and specificity through :where. Helpers forward data attributes, IconButton separates icon and size, native controls retain behavior. Utility browser parity: 171 cases × 4 scheme/width combinations × rest/hover/focus/pressed = zero computed differences and identical PNG bytes. Focused registry tests 96/96 PASS after replacing old-class assertions. Full package rerun and independent review pending.

Slice 3 review found two remaining raw Badge uses in CLI scaffold templates; corrected before re-review, along with private render-ui category hooks and the spinner part override. DataGrid public types split from rendering to keep the rendering file below 500 lines without changing its public exports. Final parity replay now includes the shell, field, code block, both toggle islands and checked choices.

Slice 3 terminal: scoped package check/lint/fmt PASS, full package tests 222/222 PASS, quality:gate (including arch:check) exit 0. Final parity is 185 cases, four viewport/scheme combinations and four pseudo-state passes: zero computed differences, all four PNG pairs byte-identical. Source/template Badge findings are fixed and guarded. Both slice review FAIL_FIX verdicts remain retained; final independent IMPL-EVAL remains required and pending. No lock or registry tooling changes.

Slice 4 terminal automation: ui:migrate variants is registered through a class command and injected use case/FS/formatter. Versioned hunks handle dynamic 0.0.8 components; static JSX/CSS preserve unrelated text and specificity, unsupported/customized code aborts before writes. Scoped UI tests 12/12 PASS, type/lint/format PASS. Exact archived 0.0.8 scaffold converts 69 files; second dry run changes zero; workspace deno task check passes including all Fresh app sources. App-local check formatting passes, with the pre-existing constant theme script react-no-danger lint finding disclosed separately. Required slice reviewer is unavailable (API usage limit); no review PASS claimed. Final contract tests, new anatomy repairs, generated source edits and complete final proof remain next.

Slice 5 implemented and locally validated: reusable Utility provider renders all 66 shipped identities, with native/context/template distinctions and missing-part/missing-attribute/invalid-value negative controls. Full package tests 298/298 PASS; CLI/app-root tests 13/13 PASS. Source check/lint/fmt PASS; quality:gate including arch:check PASS with durable receipt; contract TS facade and CLI docs lint PASS; JSR static dry run PASS. Utility parity expanded to 187 cases with real Studio/Utility host attributes, own-revision runtimes, input hashes, computed pseudo states and four byte-identical PNG pairs. Full normal browser matrix 24/24 PASS and five axe validator contract tests PASS. Exact 0.0.8 archive replay, dry-run byte preservation, conversion, formatting, workspace check and zero-change second run PASS.

Independent final IMPL-EVAL was invoked after implementation but returned usage_limit_reached (429) before reviewing. No verdict or PASS is claimed. Keep PR draft; required independent signoff remains outstanding. Docker/Aspire runtime acceptance remains unavailable after the single canonical full-suite attempt. Full Fresh UI docs lint has 123 measured baseline diagnostics plus one JSON-data JSDoc limitation; no suppression. App-local lint retains the old constant bootstrap-script react-no-danger finding; workspace check includes all app source and passes. All scope restrictions remain respected. Next: commit/push this final slice, verify generated freshness, record exact head and leave the PR reviewable pending external signoff.

Final safety verification supersedes earlier migration counts: 62 files converted in the exact 0.0.8 scaffold, second application changes zero, dry-run preserves bytes, workspace check and app formatting pass. All 43 copied TSX sources match the maintained registry after normalizing only the installer's two import relocations; 41 are byte-identical. No old state selectors remain. CLI/app-root tests now 16/16 PASS. CLI-generated CSS has a separate 187-case computed-style and PNG parity PASS. Layout aliases remain compatible and controlled component class overrides require a manual prop conversion. IconButton's wrapper is recognized by its versioned signature even though its original source had no ns class string.

Product implementation is complete in this slice. Required independent implementation signoff is unavailable; the PR stays draft. Runtime acceptance remains unproven after Docker/Aspire preflight failed. Full package docs and app-local lint limitations are explicit in the PR and gate records. Post-commit generated freshness will be reported with the pushed head.

Final handoff: required independent IMPL-EVAL was attempted again after all repairs and again failed at the service usage limit before reviewing. Both attempts are unavailable, not code verdicts. Product and local validation are complete; keep the PR draft pending independent signoff and the recorded environment limits. Final counts are 298 package tests, 16 CLI/app-root tests, 24 browser cases, two independent 187-case parity runs, and 62 migrated consumer files with all 43 copied components equivalent after import relocation.

## Resume integration — 2026-10-31

Resumed the existing branch at 1cac8f994 and recovered all prior evidence. Merged main 7907293f3 with a merge commit; resolved the two reference conflicts by preserving main's new layout plus the contract API table and migration instructions. Generated prose is regenerated through existing tooling. Main's other product changes remain intact. The source implementation remains the five approved phase-one slices. Fresh matrix and NetScript MCP queries completed. Required independent IMPL-EVAL and the one-pass runtime suite will run on this integrated tree; earlier unavailable attempts are historical, not verdicts.

Integration validation: Fresh UI check/lint/format cover all 245 selected source files and pass. All 16 migration/app-root tests pass. The original Markdown renderer bridge tests pass with the Lume Page fixture. quality:gate (including deps:check and arch:check) passes after removing the main-introduced test double cast without suppressions. Scoped Fresh UI export/reference drift passes. The one-pass scaffold.runtime run exits 1 at Aspire/Docker preflight; Docker is unavailable and runtime acceptance is unproven. Documentation build/rendered-output checks pass (797 files, 253 HTML pages). Generated-source freshness must be rechecked after committing the regenerated prose. Reconciled against merged main; no lock changes.
