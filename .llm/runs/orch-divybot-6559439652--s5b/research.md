# Research

Baseline: `1e4e58fcc0d3e9bd8ca32862adcde42e70a49b99`. Full #2568 body/comments read. No existing S5b PR found. #2488/#2538 are open; current-contract proof is independent of them.

The public `componentContracts` catalog has 87 contracts; 66 are shipped. `freshUiRegistryJson` owns registry source identities and `style-utility.meta.components` owns logical-to-source mappings. Some registry names intentionally differ from contract names; an identity-only alias join is required. Runtime-only contracts without registry items remain visible in coverage, outside generated copy-library membership.

The embedded Figma collections carry code-owned names/types/modes/WEB syntax and Figma-owned values. Existing `assertFigmaTokenNames` validates them. Bind through Scheme, Theme set and Density; never directly to Theme or Theme B. Token shorthand in the catalog must expand deterministically and reject nonexistent expansions. No component values, props or anatomy may be copied into a parallel authoring spec.

Official Figma documentation confirms HTML `figma.connect`, `figma.enum` and `html` tagged templates; native sets use `combineAsVariants`. No Figma connector/editor exists in this session: live execution stays UNPROVEN.

Repository root wrappers exclude tools; this unit needs explicit structured check/test/lint/fmt wrappers and a dedicated CI workflow. Existing `tools/figma-plugin` remains untouched. This is repository tooling shaped by Archetype 6 concerns; no published package, CLI command, dependency or scaffold changes. JSR audit/publish gates are N/A for the new tool.
