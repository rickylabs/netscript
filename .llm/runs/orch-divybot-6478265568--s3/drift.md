# Drift

- Bootstrap: RTK unavailable; focused native commands and structured wrappers used.
- Evaluator matrix overridden by the explicit owner grant recorded verbatim in worklog.md.
- The specific phase-1 owner instruction forbids closing #2416; it takes precedence over the dispatcher's generic closing-keyword template. PR will start with the requested Refs URL and preserve later phases.
- Registry source embedding may need an S2 hook; no changes to registry schema or ui:build/add/apply are authorized here.

- PLAN-EVAL round 1 FAIL_PLAN preserved in plan-eval.md: registry embed, tokenizer, gate map and contract scope corrected before implementation. Generated registry bytes are within the component delivery surface; tooling/schema are unchanged.
- Scope authority verbatim: “Write the contracts for every component that ships in Fresh UI today, plus the six built Figma categories (P0 and P1 first).” Unshipped contract data is limited to those categories; other gaps stay research-only.
- Initial evaluator invocation disabled persistence; re-review must use a new read-only process carrying the complete prior verdict. This is transport drift; no self-certification or vendor-family substitution.

- CI build failure on cc26ede: docs export/symbol drift required updating docs/site/reference/fresh-ui/index.md for the new subpaths and symbols. This necessary API reference edit extends the declared write surface; no docs style/site implementation changes.

- Source migration also updates the nine raw Button class uses in the scaffold FloatingSurfaceDemo template; otherwise a new scaffold would lose those variants after CSS migration. Existing layout utility BEM selectors remain compatibility aliases (not component variants) because broader scaffold layout markup is outside this phase. Their new data-gap/align/width selectors preserve specificity.
- Utility parity initially caught incorrect Toast error selector classification; fixed before slice review. 171 before/after cases now have zero computed-style differences across rest/hover/focus/pressed at both widths/schemes, with identical full-page PNG bytes.

CLI migration refinement: dynamic 0.0.8 component code uses reviewed versioned source hunks instead of a general JS expression rewriter. This reduces the parser surface and also migrates anatomy and state mutations. Literal JSX/CSS still use the planned bounded tokenizer. Custom hunks fail the whole-app preflight with a manual-merge diagnostic; no dependency/lock or registry lifecycle changes.

Final render checks found public compound markers overwritten by headless getters; getters now preserve explicit part/scope delegation. Existing headless state values remain typed compatibility metadata instead of changing settled Figma values or runtime behavior. Read-only doc lint measures 123 pre-existing package diagnostics at the exact baseline; the contract TS facade is clean, and the JSON data export adds one missing-JSDoc diagnostic because JSON has no JSDoc surface. CLI public docs are clean. No baseline source debt or validator is suppressed.

Browser baseline recorder now skips navigation-only tests while still requiring every matrix axe case. Its old loop demanded axe attachments from newly added navigation tests. Accessibility fingerprints are re-keyed for changed attributes; every route/theme/width preserves its exact rule/impact/count totals, including four zero-allowance Utility cases. A scoped formatter briefly touched CSS/token/doc whitespace; those unrelated edits were restored before any commit.

Final migration safety repair: actual 0.0.8 state selector names differ from public component names. Tests now use the real five state families, scope state conversion to the current compound and compare CLI-transformed CSS against baseline computed styles/pixels. Layout utilities retain compatible class/attribute aliases; controlled component class overrides are refused rather than silently forwarding attributes the component would overwrite. Canonical source edits also preflight any extra literal user markup. This narrows automatic conversion while preserving the whole-app no-write-on-diagnostic contract.

## Resume integration drift — 2026-10-31

The merged main introduced an `as unknown as Element` in docs/site/_plugins/markdown-render-fixture.ts. Required quality:gate fails there before arch:check. Extend the integration surface to this one test fixture and replace its direct parser/cast with Lume's existing Page.create document surface. Preserve the original render assertions; no scanner suppression or allowance changes. Regenerate the MCP export corpus and prose/publish carriers after merging main; freshness is checked only after committing the generated result. The canonical scaffold.runtime attempt exits 1 during Aspire/Docker preflight; Docker daemon is unavailable and no scaffold runtime starts.

## Independent implementation repair — 2026-10-31

IMPL-EVAL round 1 is FAIL_FIX with one blocker: ActionMenu's forced dropdown-menu scope breaks the existing app-owned floating.css selectors. One permitted repair retains the delegated popover scope on trigger/content and uses it for item/separator, records the delegation in contract notes/JSON/naming decisions, updates the style fixture, and adds an actual-render regression. Expand the owned browser parity tool to include ActionMenu and open native popovers so positioning is exercised. Regenerate the existing contract/registry/corpus/prose carriers as needed. Re-review stays in the same Claude session.

Final remote reconciliation: main advanced to 6a71cd059 through #2480, an independently reviewed fix of the same docs fixture. Keep main's canonical fixture in the merge conflict; the earlier local Page.create change is superseded. Reviewed Fresh UI/CLI/parity product code is unchanged. Only docs fixture and quality evidence require refresh.

Coordinator follow-up expands this run's tooling/docs surface to ratify the ui:migrate census and reference entries. The previous local source/quality gates did not include docs:accuracy, so they were insufficient to prove the required remote quality job; use the complete requested docs gate set and verify the actual quality job at the repaired head before READY.
