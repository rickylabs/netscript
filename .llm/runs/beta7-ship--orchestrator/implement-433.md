use harness

# Slice brief — #433 (S0): reconcile `docs/site/capabilities/` into the 9 pillar folders

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`,
`.agents/skills/deno-fresh/SKILL.md` (docs site is Lume/Fresh-adjacent — check `docs/site` README),
`.agents/skills/rtk/SKILL.md`. Apply `SCOPE-docs` overlay thinking: structural moves, zero prose
rewrites.

## Identity + ground rules

- WSL Codex implementation agent under the beta-7 orchestrator (Claude session `df71d36c`).
  Do NOT open PRs. **PLAN-EVAL waiver** (owner-waived, drift D1) — plan section in worklog, then go.
- Worktree: `/home/codex/repos/ns-wt-433`, branch `docs/433-ia-reconcile-capabilities`.
- Push: `git push origin HEAD:refs/heads/docs/433-ia-reconcile-capabilities`.
- Worklog at `.llm/runs/docs-433-ia-reconcile--codex/worklog.md`, committed with the slice.
- Lock hygiene: no `deno.lock` churn (acceptance requires it).

## Task (issue #433 — read it + design sources first)

Read `.llm/runs/plan-roadmap-expansion--seed/design/CD-docs/proposal.md` §2.2 and
`.llm/runs/plan-roadmap-expansion--seed/design/CD-docs/epic-and-issues.md` §2 (S0) — the issue body
says `design/CD-docs/...` but the actual checked-in location is under that run dir. This is a
STRUCTURAL move slice — hard precursor for all docs authoring:

1. Move every `docs/site/capabilities/*.md` page into its target pillar folder per proposal §2.2
   mapping. Content as-is: do NOT rewrite prose (workstream D's job).
2. Add a URL redirect for each old `/capabilities/<x>/` path (find the site's redirect mechanism —
   check `docs/site/_config` / Lume plugins).
3. Retarget every `comp.xref({ key: "cap:<x>" })` to the new pillar path.
4. Update `_data.ts` "Overview & Concepts" cards on the 3 pillars that route into `capabilities/`.
5. Add two net-new empty-but-navigable pillar leaf stubs: `orchestration-runtime/cli-scaffold.md`,
   `ai/mcp.md`.
6. Delete `capabilities/index.md` after redirects land.

Non-goals: tutorial-chapter nav anchors untouched; no framework source; no prose rewrites.

## Acceptance (from the issue — each needs evidence in the worklog)

- `deno task verify` green in `docs/site` (build → `check:links` → `check:caveats`), zero broken
  internal links.
- Every old `/capabilities/<x>/` URL redirects to its new pillar path (nav-check all 15 moved pages
  against a local build; curl is fine).
- `capabilities/` not referenced by any `comp.xref` key or `_data.ts` entry (grep clean output in
  worklog).
- `_data.ts` nav renders the 9 pillars unchanged in count/order; 3 rerouted cards point in-pillar.
- Two new leaf stubs reachable from nav.
- No `packages/`/`plugins/` file touched; no `deno.lock` churn.

## Done means

All boxes evidenced in worklog, committed + pushed. Report "DONE" or "BLOCKED: <why>".
