# Plan & Design — READY FOR REVIEW

## Locked decisions

1. Import #2506 verbatim, updating hash-bound provenance; do not modify Figma values or the selected default preset.
2. Reuse reviewed explicit inactive annotations and strict negative controls from #2500. Inactive text remains measured and separately reported; active text on a disabled background remains checked.
3. Pair accent-fg with the theme-aware accent-hover. Keep raw Base source names as exported data. Restrict Liquid tinted-primary to its actual white label.
4. Adjust only owned NS One legacy values to meet 3:1 non-text / 4.5:1 text, minimizing palette differences. Update the compatibility fixture only for reviewed values.
5. Regenerate exact exclusions from zero and a report enumerating all 48 preset/scheme contexts, including zero failures and separate disabled-exempt counts.
6. Regenerate token, registry, prose, corpus, assets-barrel and publish carriers. Revert docs/site lock churn. Public run artifacts contain relative paths and no session identifiers.

## Gates

Structured targeted token/build/report/native-publish tests, check/lint/fmt; tokens:sources:check, tokens:validate, tokens:check; quality:gate; release:preflight; docs:accuracy; every root check task (review-threads on the new PR); all carrier freshness checks. Canonical one-pass scaffold.runtime; unavailable Docker is UNPROVEN. Independent read-only Anthropic IMPL-EVAL, then exact-head required GitHub checks before READY.

## Risks and deferred scope

Keep faithful themes and S6a default selection unchanged. Reconcile current origin/main before final push, using merge if needed and no force push. Stale generated assets are addressed by full regeneration and committed-source freshness gates. Inherited unrelated doclint debt is reported rather than broadened. No new dependencies, abstractions, labels, issue closure, or merge. No unresolved design decisions remain.

PLAN-EVAL: N/A. Owner supplied exact bounded causes, approved data, thresholds and acceptance; no material architecture change or unresolved trade-off. Mandatory independent IMPL-EVAL remains required.
