# Drift Log: generated design registry catalog drift gate

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-15 — frontend overlay legacy pointer absent

- **What:** The frontend overlay's additional-read list names `.claude/05-frontend.md`, which does
  not exist in this checkout.
- **Source:** `rg --files . | rg '/05-frontend\\.md$|frontend\\.md$'` returned no matching
  authority file.
- **Expected:** `.llm/harness/archetypes/SCOPE-frontend.md` lists the file as an additional input.
- **Actual:** Fresh 2.x guidance and the fresh-ui L0/theme authority chain are present and were read.
- **Severity:** minor
- **Action:** accept for this leaf; no implementation decision depends on the missing pointer.
- **Evidence:** `.agents/skills/deno-fresh/SKILL.md`,
  `.agents/skills/fresh-ui-horizontal/l0-conventions.md`,
  `.agents/skills/fresh-ui-horizontal/theme-authoring.md`, `packages/fresh-ui/README.md`.
