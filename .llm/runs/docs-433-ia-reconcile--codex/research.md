# Research

- Re-baselined issue #433 and proposal §2.2 against the current clean branch.
- `docs/site/capabilities/` contains 15 leaf pages plus `index.md`; proposal maps all leaves into the nine pillar folders.
- `_data/xref.ts` owns all `cap:*` destinations. Three pillar landing cards currently route into `capabilities/`: Background Processing, Data & Persistence, and Observability.
- No redirect plugin or redirect-frontmatter convention exists in `_config.ts`; static redirect documents are therefore required for GitHub Pages compatibility.
- The nine pillar nav sections and order are Web Layer, Services & SDK, Background Processing, Durable Workflows, AI & Agents, Data & Persistence, Identity & Access, Orchestration & Runtime, Observability.
- The two fold mappings target existing canonical pillar indexes. Structural-only scope forbids merging prose, so the old URLs redirect to those indexes and the existing indexes remain canonical.

