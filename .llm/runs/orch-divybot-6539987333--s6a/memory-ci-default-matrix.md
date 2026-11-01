# Scaffold-default changes also affect browser fixtures

`tools/fresh-ui-browser/tests/design.spec.ts` tests the real maintainer scaffold, including preset preview navigation and an exact axe multiset. A default change requires updating document metadata, preview stylesheet expectations and default-route baseline ownership together. Retain explicit legacy preview routes rather than silently dropping their coverage. Legacy data-theme light/dark aliases require the legacy stylesheet alone; cross-preset preview roots have different cascade precedence.

Core CI also hashes the shared generated query island in `packages/cli/src/kernel/application/resource-slice/render-resource-slice_test.ts`. Review the rendered change before updating all four identical island hashes. Template contracts live in both route-templates_test.ts and template-asset_test.ts; formatting-sensitive assertions should accept whitespace while preserving boolean-attribute semantics.

Compatibility probes must bind actual roles (`--ns-bg`, `--ns-fg`), not plausible names such as `--ns-background`. Assert nontransparent explicit colors, opposite-scheme differences and disabled-stylesheet differences so fallback values cannot satisfy parity. Independent review caught this vacuity before the repair commit.

The required `deps-report` job is policy-skipped on ordinary PRs; it runs only with `ci:full` or release tags. This assignment prohibits labels. Report the native policy skip explicitly rather than claiming dependency freshness executed remotely.
