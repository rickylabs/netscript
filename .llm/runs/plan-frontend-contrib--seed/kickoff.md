# Kickoff — plan-frontend-contrib--seed (Fable 5 · high)

use harness. You are a **planning/seed agent** (Fable 5, effort high) designing the missing
**frontend contribution layer** for NetScript plugins. Drafts and design documents ONLY.

## Owner mandate (verbatim intent)

The frontend contribution layer of plugins is currently missing, and multiple future features are
limited without it: the **dev dashboard**, **auth**, **ai**, and now **deploy** (the new
deploy-plugin direction on branch `plan/deploy-plugin` will contribute cloud-specific frontend
seams). The owner wants an **ABSOLUTE PERFECT frontend contribution layer** that solves all these
limitations while being extremely elegant to work with, flexible, and **DX PERFECT**. The doc/API
story must force implementation to think DX first, not just implement.

This caveat was identified long ago during dev-dashboard planning: grep the harness run history
(`.llm/runs/`, git log across `plan/*` branches, dashboard runs from beta-10) for the prior
analysis — e.g. `rtk grep -ri "frontend contribution\|plugin island\|plugin ui" .llm/runs/` and the
beta-10 dashboard run dirs — and treat what you find as evidence.

## Mandate

Produce a clean seed run in `.llm/runs/plan-frontend-contrib--seed/` on branch
`plan/frontend-contrib` (this worktree). Cover, at minimum:

1. **Contribution model**: how a plugin contributes frontend surface (islands, routes, components,
   nav entries, theme tokens) to a Fresh/fresh-ui host app — registration, discovery, type safety,
   SSR/hydration boundaries, isolation. Contract first: schema/type contracts before mechanism.
2. **Consumers**: concrete contribution stories for the four blocked features — dev dashboard
   panels, auth UI (sign-in flows, org/member management), ai surfaces, deploy plugin dashboards —
   each as a worked example against the proposed API.
3. **Scaffolding + registry**: how `netscript` CLI scaffolds and regenerates frontend contribution
   registries (precedent: existing plugin registry generation), and how contributions appear in a
   scaffolded project.
4. **Doctrine fit**: archetype, public surface, gates, debt; precedence from shipped packages
   (`@netscript/fresh-ui` namespaces, plugin registry patterns). Wrap Web Platform / Fresh
   primitives; do not reinvent.
5. **DX**: the developer experience of authoring a contribution must be front and center — show
   the exact code a plugin author writes, keep it minimal and harmonized across adapters/ports.

Use `deno doc` on `@netscript/fresh-ui` and the plugin packages before broad reads.

## Pipeline (supervisor-dispatched — do NOT self-dispatch downstream stages)

1. YOU produce the seed run (plan.md, design/canonical/*, worked examples, worklog, drift).
2. When complete, write `STAGE-COMPLETE: generator` at the end of `worklog.md` and STOP. The
   supervisor then dispatches a **Codex GPT-5.6 Sol high adversarial/collaborative** pass (enhance,
   not ruin), you integrate fixes/enhancements, then a **Kimi K3** pass writes the public-facing API
   + documentation story to make the final product concrete.
3. You will be resumed to integrate findings.

## Stop-lines (verbatim, in force)

- Drafts only: no GitHub issues, PRs, labels, or milestones may be created or changed by this run.
- No product code changes: no `packages/` or `plugins/` source edits.
- No merges without CI green + eval PASS + standing authorization; HARD STOP before any release
  publish (release:cut, JSR publish, tag push, canary or stable) — owner sign-off in-turn only;
  HARD STOP before closing milestone 13 — owner only.
- Do not self-arrange evals; the supervisor triggers every downstream stage.
- Commit to this branch only, push with explicit refspec:
  `git push origin HEAD:plan/frontend-contrib`.
