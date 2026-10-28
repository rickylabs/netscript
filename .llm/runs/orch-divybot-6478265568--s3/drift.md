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
