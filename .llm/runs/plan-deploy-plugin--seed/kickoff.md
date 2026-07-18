# Kickoff — plan-deploy-plugin--seed (Fable 5 · xhigh orchestrator)

use harness. You are a **planning/seed orchestrator** (Fable 5, effort xhigh) producing a clean new
harness run for the NetScript **deploy plugin** concept. You are a generator of drafts and design
documents ONLY.

## Owner ratification context (#824 redirect)

The prior seed run `.llm/runs/plan-unified-runtime--seed/` (branch `plan/unified-runtime`, worktree
`/home/codex/repos/wt-g8-seed`) reached Stage-H with an adversarial nitro-vs-own analysis. The owner
read `adversarial-nitro-vs-own.md` and ratified a NEW direction. His conclusion, VERBATIM — this is
the concept your run is built on:

> - it is true that we cannot achieve full Deno native no matter we choose nitro, existing Deno
>   adapter (most are insufficient anyway) of imolemnt ourselves : the goal should be reframed as
>   "Deni native first then Node compat where needed"
> - it is true that creating a giant new deploy package is not the appropriate solution, we've
>   learnt from other topic like auth that the best way is to use Netscript at what's it's best :
>   composability --> should we consider a deploy PLUGIN with a plugin core and then adapter the
>   EXACT same way auth works ? would it make sense ? would it also allow us to sprinkle some nitro
>   integration where it make sense, aspire native where it matters and implement ourselves the rest
>   the absolute best possible way : entreprise grade like we did for other package (unless we find
>   specifc well written and standard package that could be valuable to wrap as per our doctrine)
> - if we go the plugin route it refine COMPLETELY the deploy story including what we've already
>   shipped but solves many problems : the plugin allow us to contribute to every layers (even
>   frontend soon) meaning we could imagine SCAFFOLDING a cloudflare optimized project that would
>   ships seams that already are cloudflare first (e.g. workers, durable object, kV, ...) same story
>   for AWS, ... it defeats in some sense the cloud agnostic but at the same time make it actually
>   credible (it's almost Impossible to be TRULY cloud agnostic since each cloud adopt their own
>   standards and adapters have their limit as described in the harness run analysis!)
> - if we go this route we would have plugin deploy, deploy-core, deploy-aws, deploy-cloudflare,
>   deploy-vercel, ... which in some sense start really to look like what other major framework
>   proceed ! with the advantage that in our case leveraging plugins (contribution, scaffolding,
>   CLI, services, ...) makes it much more powerful

(Read "Deni/imolemnt" as "Deno native first, then Node compat where needed" / "implement".)

## Mandate

Take the prior run as evidence base (read its canonical designs, research, adversarial findings,
nitro-vs-own synthesis) but produce a **clean run from scratch** in
`.llm/runs/plan-deploy-plugin--seed/` on branch `plan/deploy-plugin` (this worktree). Cover, at
minimum:

1. **Architecture**: `plugin-deploy` with `deploy-core` + per-cloud adapters
   (`deploy-aws`, `deploy-cloudflare`, `deploy-vercel`, thin adapters for koyeb/sevalla/coolify/
   dokploy/fly.io) modeled the EXACT way the auth plugin composes (core + provider adapters).
   Doctrine archetypes, ports, public surface, gates for each.
2. **Migration**: what happens to the existing shipped deploy layer (current packages, CLI deploy
   commands, Aspire helpers) — concrete migration map, debt entries, deprecation story.
3. **Plugin contributions**: what the deploy plugin contributes to EVERY layer — CLI commands it
   ships, services, scaffolding: what a cloudflare-optimized scaffold looks like (workers, durable
   objects, KV seams cloudflare-first), same for AWS product suites (queues, cache, KV), Vercel;
   how contribution keeps the core cloud-agnostic story credible.
4. **Selective wrapping**: where nitro integration makes sense, where Aspire-native matters, where
   we implement ourselves enterprise-grade, and which well-written standard packages are worth
   wrapping per doctrine (wrap-don't-reinvent).
5. **Deno native first, Node compat where needed** as the stated goal frame throughout.

Consult: `docs/architecture/doctrine/`, `.agents/skills/netscript-doctrine`,
`.agents/skills/netscript-harness`, the auth plugin implementation (`plugins/auth`) as the
composition precedent, and the new enterprise-auth board (issues #871–#887) for pattern parity.
Use `deno doc` before broad source reads.

## Pipeline (supervisor-dispatched — do NOT self-dispatch downstream stages)

1. YOU produce the full seed run (plan.md, design/canonical/*, migration map, contribution matrix,
   scaffold stories, worklog, drift).
2. When complete, write `STAGE-COMPLETE: generator` at the end of `worklog.md` and STOP. The
   supervisor then dispatches a **GPT Sol xhigh adversarial (constructive/collaborative)** pass —
   its role is to ENHANCE your output, not ruin it — then a **Kimi K3 doc-driven story** pass that
   forecasts the public-facing documentation to make the API/DX concrete.
3. You will be resumed to integrate their findings.

## Stop-lines (verbatim, in force)

- Drafts only: no GitHub issues, PRs, labels, or milestones may be created or changed by this run.
- No product code changes: no `packages/` or `plugins/` source edits.
- No merges without CI green + eval PASS + standing authorization; HARD STOP before any release
  publish (release:cut, JSR publish, tag push, canary or stable) — owner sign-off in-turn only;
  HARD STOP before closing milestone 13 — owner only.
- Do not self-arrange evals; the supervisor triggers every downstream stage.
- Commit to this branch only, push with explicit refspec: `git push origin HEAD:plan/deploy-plugin`.
