# Research

Baseline `9a31e879c32a8066c50946a57976f3da34ba43a6` contains the 0.0.8 Fresh UI registry and package runtime. Main and `design/component-contract-spec` were fetched. The spec is retained as `spec-reference.md` for exact decisions; its authoritative source remains that design branch. #2463 only documents styles and is not duplicate implementation. #2416 has no orchid-triage comment.

NetScript MCP `find_guidance` and `search_docs` were called through the repository stdio server. The results in `guidance.jsonl` point to GUIDELINES §2.6: attributes are the shared contract, copied source remains app-owned. No backend is introduced.

Doctrine: the contract is Archetype 1 (small immutable data); the migration is Archetype 6 (CLI tooling), within the existing Fresh UI runtime. Public subpaths are explicit facades, pure data belongs in `src/contracts/`; use category grouping to preserve folder cardinality. No runtime FS or dependency imports on the contract subpath. Existing package shape and native interactive behavior remain.

Today the registry components use BEM modifiers and several `is-*` states; interactive namespaces already expose `data-part`, `data-state`, `data-scope`. Registry `cn` calls and static class strings require syntax-aware conversion. CSS selectors must retain their specificity. Registry source is embedded in `registry.generated.ts`; S2 owns that build seam. Regenerate registry.generated.ts with the existing generator and validate freshness; no build/schema command implementation edits.

Figma spec §4.5–4.6 resolves primary vs default, md vs default, logical icon slots, Field vs FormField, Dropdown menu vs ActionMenu, native Select vs future custom listbox, and selected vs interaction pressed. Parts represented by native text/controls or CSS pseudo-elements require an explicit implementation representation; future parts/axes must be marked planned rather than falsely claimed shipped. Semantic token/focus/shadow value changes are deferred to S6 to preserve Utility parity.

JSR planned-surface audit: `./contracts` reexports documented explicit readonly types/data/functions only; no inferred unnameable exports or slow types. JSON is generated from this same data. No dependencies or lock changes. Existing parser dependencies are not directly locked import specifiers, so a small conservative tokenizer is required; adding an upstream parser would violate lock ownership. Tests/scripts excluded by existing publish map. Verify with structured doc-lint and JSR audit.
