# Plan & Design — READY FOR REVIEW

Add explicit optional `exemption: 'inactive-component'` to a contrast pair. Only annotated, disabled foreground roles (`state-disabled-*` or `*-disabled`) at the text threshold qualify; reject unknown exemptions or annotations on active foregrounds. Background names alone never exempt a pair. Existing coverage and thresholds remain enforced, even for exemptions. Do not infer exemptions from a name alone.

Measure all pairs, then partition annotated inactive uses into `exempt` before the pass/fail decision. Every exempt result carries the fixed reason and WCAG criterion. Keep the existing checks denominator; preserve exact source exclusions and stale-exclusion rejection. Annotate exactly the six existing disabled text pair definitions. Remove their 56 obsolete exclusions by the existing source-report generator, not hand edits.

Report JSON includes all failing and exempt rows with roles, rendered colors, ratio and source; exempt rows additionally include reason/criterion. Markdown states active failures and exempt counts, with a link to all detailed rows. The burn-down stays OPEN. No Figma values, presets, assets or WCAG thresholds are corrected.

Single implementation slice: domain contract/checker, six policy annotations, maintainer/check output, contributor docs, focused positive/negative tests, regenerated quality constants/carriers and fresh burn-down reports. Automated gate then independent read-only IMPL-EVAL before supervisor sign-off commit.

Validation: pure exemption tests (passing/failing disabled, unannotated disabled, active/malformed annotations, disabled background only, stale exemptions), actual report/CLI negative controls, full token tests, scoped structured check/lint/fmt, package publish-size, quality:gate, release:preflight, docs:accuracy, all root check:* tasks and canonical carrier checks. Run canonical scaffold.runtime once; Docker absence is UNPROVEN. Final exact-head CI before READY, no merge. Refs #2450 only.

Deferred: Figma status/ink/theme value corrections and re-export, owned by the design pass already recorded on #2450. This is a dependent next step, so no duplicate sibling issue. Existing unrelated architecture/doclint debt remains bounded by #2495.

## Risk register and open decisions

- Accidental active failure suppression: require explicit metadata AND a disabled foreground naming boundary, text threshold, and preserve all coverage invariants; negative controls for active foregrounds on disabled backgrounds, focus/chart/syntax and malformed markers.
- Lost visibility: measure exempt passing and failing pairs alike, retain denominator and full rows/reason/criterion in reports; integration asserts 58 exemptions and475 active failures against pinned inputs.
- Stale embedded policy: regenerate before reporting, then regenerate after source exclusions refresh and check embedded freshness.
- Publish/surface risk (JSR rubric): no export-map changes, no new public dependencies, no inferred public return types, internal interfaces have explicit readonly annotations; gzip policy must stay within existing native publish-size budget. Existing package doclint/contracts.json debt is inherited, not a new PASS claim. Gate matrix Archetype1 domain policy plus existing Archetype6 maintainer adapter paths apply; no runtime API behavior changes.
- Open decisions: none. Non-text disabled roles are safe to defer until the registry contains an actual inactive non-text use; this leaf only annotates text at4.5 under SC1.4.3.

## PLAN-EVAL cycle1 repairs (locked)

Consumer audit: current component TSX/Markdown uses none of the four disabled foregrounds; no active preset/bridge alias targets them. Only the existing Tailwind token alias exists. Repeat this audit when adding annotations (README contributor rule). A later active consumer is not covered by the exemption and must have an active-use pair.

Eligibility requires the existing foregroundRole predicate AND a disabled naming boundary AND minimum4.5. An annotated state-disabled-container is invalid. Annotated pair applicability must include at least one effective context; no-context exemption is stale and fails. Unknown markers fail at the adapter boundary and domain validation. Exempt rows never consume exclusions; supplying one is a stale/unused error. Keep data version1: additive optional metadata is validated/narrowed by default-token-quality.ts and propagated through generated quality data; no new parser protocol.

Add a real internal checker negative control `--negative-control=exempt-active`, which annotates fg/bg and must exit nonzero. Existing active contrast control remains red. This is not a new public CLI command. JSR public-surface audit is N/A: no exports or mod.ts change and no new inferred public types/slow-type risk; publish budget/dry-run still prove shipped assets.

Additional risks: owner intent could be masked if a disabled token gains active consumers (repeat consumer audit); exclusions refresh could alter unrelated data (assert exact equality to baseline with only56 disabled removals); old copies could omit new metadata (version1 adapter validation + generated freshness/carrier gates); Docker absence leaves runtime residual risk (attempt exact command, explicitly UNPROVEN in PR regardless of other green checks).

Exact implementation file list (14 planned, plus <=6 generated carrier diffs if regeneration changes them; under30): domain/{contrast-contract,check-token-contrast}.ts; adapters/default-token-quality.ts; scripts/{check-tokens,report-token-contrast}.ts; tests/tokens/{contrast,contrast-report,check-command}.test.ts; tokens/{contrast-pairs.json,contrast-exclusions.json,README.md}; src/tokens/assets/quality.generated.ts; this run worklog/context/report/evaluation artifacts (one bounded run surface); canonical carriers packages/cli/src/kernel/assets/{agent-docs-prose.generated.ts,embedded.generated.ts,agent-docs.generated.ts,publish-assets.generated.ts} and packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts and packages/mcp/src/publish-assets.generated.ts only if generated. Actual filenames will follow checked-in task output, drift recorded for any different path. Gate mapping: pure tests prove domain; real report/command tests prove adapters; all token tests + publish budget prove regenerated data; four carrier checks plusquality/release/docs prove publication; independent IMPL-EVAL reviews whole slice before sign-off.
