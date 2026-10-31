# Plan & Design — READY FOR REVIEW

Add explicit optional `exemption: 'inactive-component'` to a contrast pair. Only annotated, disabled foreground roles (`state-disabled-*` or `*-disabled`) at the text threshold qualify; reject unknown exemptions or annotations on active foregrounds. Background names alone never exempt a pair. Existing coverage and thresholds remain enforced, even for exemptions. Do not infer exemptions from a name alone.

Measure all pairs, then partition annotated inactive uses into `exempt` before the pass/fail decision. Every exempt result carries the fixed reason and WCAG criterion. Keep the existing checks denominator; preserve exact source exclusions and stale-exclusion rejection. Annotate exactly the six existing disabled text pair definitions. Remove their 56 obsolete exclusions by the existing source-report generator, not hand edits.

Report JSON includes all failing and exempt rows with roles, rendered colors, ratio and source; exempt rows additionally include reason/criterion. Markdown states active failures and exempt counts, with a link to all detailed rows. The burn-down stays OPEN. No Figma values, presets, assets or WCAG thresholds are corrected.

Single implementation slice: domain contract/checker, six policy annotations, maintainer/check output, contributor docs, focused positive/negative tests, regenerated quality constants/carriers and fresh burn-down reports. Automated gate then independent read-only IMPL-EVAL before supervisor sign-off commit.

Validation: pure exemption tests (passing/failing disabled, unannotated disabled, active/malformed annotations, disabled background only, stale exemptions), actual report/CLI negative controls, full token tests, scoped structured check/lint/fmt, package publish-size, quality:gate, release:preflight, docs:accuracy, all root check:* tasks and canonical carrier checks. Run canonical scaffold.runtime once; Docker absence is UNPROVEN. Final exact-head CI before READY, no merge. Refs #2450 only.

Deferred: Figma status/ink/theme value corrections and re-export, owned by the design pass already recorded on #2450. This is a dependent next step, so no duplicate sibling issue. Existing unrelated architecture/doclint debt remains bounded by #2495.
