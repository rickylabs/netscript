# Worklog — harness-seed-run-profile--codify

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `harness-seed-run-profile--codify` |
| Branch | `harness/seed-run-profile` (draft PR: TBD) |
| Archetype | N/A — harness-surface docs |
| Scope overlays | `SCOPE-docs.md` |
| Supervisor | see `supervisor.md` (Fable 5, session `1bd79985…`) |

## Design

1. **Public surface** (artifacts this run produces):
   - `.llm/harness/workflow/seed-run.md` — the seed-run profile: stage contracts A–I, hard
     invariants, scale-to-fit rule, filing discipline, landmine index, promotion provenance.
   - `.llm/harness/templates/supervisor.md` — template for the mandatory run-identity file.
   - Wiring edits: `workflow/activation.md`, `.llm/harness/README.md`,
     `.agents/skills/netscript-harness/SKILL.md` (+ regenerated `.claude/skills/` mirror).
2. **Domain vocabulary**: seed run; stage contract; discovery corpus; synthesis; deep-dive pack;
   owner fork; ratification boundary; filing manifest; FILING-LOG; supersession map; authority
   banner; scale-to-fit.
3. **Ports**: none (docs).
4. **Constants**: stage letters A–I with fixed names (doc-level vocabulary, not code).
5. **Commit slices**: per plan.md (S1 scaffolding, S2 profile + template, S3 wiring + mirror,
   S4 adversarial + eval).
6. **Deferred scope**: filing-manifest template promotion (OD-1); filing executor tooling.
7. **Contributor path**: a future supervisor reads `workflow/seed-run.md` top-to-bottom, then
   `lane-policy.md` for bindings, then scaffolds stage A from `templates/`.

## Log

| When | Stage | Note |
| --- | --- | --- |
| 2026-07-05 | S1 | Run dir scaffolded; `supervisor.md` written first (dogfooding the gate the exemplar missed). |
| 2026-07-05 | S2 | Authored `workflow/seed-run.md` (stage contracts A–I, hard invariants, ratification boundary, scale-to-fit, landmine pointers, dogfood acceptance) + `templates/supervisor.md` (fixes the missing-template gap behind drift #2). |
| 2026-07-05 | S3 | Wiring: `workflow/activation.md` (bootstrap step 10 + `supervisor.md` added to Mandatory Artifacts), harness `README.md` (Start Here pointer + artifact list), `.agents/skills/netscript-harness/SKILL.md` (Key Concepts row, decision-tree branch, Reference Files row); `.claude/skills/` mirror regenerated via `sync-claude-skills.ts` (SYNCED, 17 skills). |
| 2026-07-05 | S3 gates | `validate-claude-surface.ts` → all 5 checks ok. Internal references in `seed-run.md` verified to resolve (lane-policy, resource-aggregation, tooling, templates/supervisor.md, labels.yml). fmt note: `.llm/harness/**/*.md` is OUTSIDE the repo fmt surface (`deno.json` fmt.include = packages/plugins ts,tsx); forcing the wrapper over it flags 29 pre-existing files incl. untouched ones — recorded as non-verdict per AGENTS.md, no mutating fmt run. |
