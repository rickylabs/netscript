use harness

# NetScript DevTools Contribution Architecture RFC — planning-only seed run

You are the Tier-A planning orchestrator for a new, planning-only NetScript RFC. Run natively in
Claude Code as **Opus 5, effort high**, with bypass permissions and native Remote Control enabled.
Work autonomously through bootstrap, evidence gathering, synthesis, design, adversarial review,
formal PLAN-EVAL, and owner handoff. Do not implement framework/product code.

## SKILL

- `netscript-harness` — activate first; follow the seed-run A–I stage contracts and mandatory
  generator/evaluator separation.
- `claude-manager` — manage native Claude workflows/subagents and preserve observable identities.
- `netscript-doctrine` — ground proposed packages, plugins, contribution axes, ports, runtime
  boundaries, and debt in the Architecture Doctrine.
- `netscript-pr` — open and maintain the draft planning PR, phase comments, labels, milestone, and
  issue/epic draft taxonomy; no board filing before owner ratification.
- `netscript-tools` — use canonical evidence, verification, diff, and lock-hygiene surfaces.
- `netscript-deno-toolchain` — inspect current public APIs and dependency surfaces using native Deno
  tooling rather than inferred source-only claims.
- `netscript-cli` — evaluate generated registries, `fresh-ui` commands, plugin discovery, doctor,
  dev loops, and possible contributed CLI extensions.
- `deno-fresh` — ground Fresh 2/Vite routing, islands, mounting, HMR, SSR, and host composition.
- `fresh-ui-horizontal` — understand the actual registry/component/token pipeline and how a future
  contribution contract can extend it without bypassing its authority chain.
- `design` — establish a distinctive, evidence-backed DevTools information architecture and UX;
  this is design planning, not visual implementation.
- `aspire` — preserve the boundary that Aspire owns resources, logs, traces, metrics, health, and
  process lifecycle while NetScript owns framework-domain state/actions and deep-links outward.
- `rtk` — keep broad repository and GitHub research compact.
- `codex-wsl-remote` — launch and record the mobile-visible Codex PLAN-EVAL correctly through the
  managed daemon/toolchain, never an ad-hoc rival session.

Read every activated skill completely and follow its referenced instructions before acting.

## Identity, routes, and evaluation

- Primary orchestrator: native Anthropic Claude Opus 5, effort high, bypass permissions, Remote
  Control on this exact session.
- Delegate complex architecture/technical decision deep-dives to native Fable 5 medium subagents.
- Use Claude Workflows only for high-value parallel research/synthesis and commit the workflow
  artifact before executing it when the harness requires that provenance.
- Because this is major UI/UX architecture, obtain the required GLM 5.2 xhigh pure-design pass via
  the canonical `major_ui_ux_design` or `major_ui_ux_adversarial_review` route. Record honestly that
  the OpenRouter GLM transport has tools/streaming but no reasoning trace. Do not use it as the
  formal evaluator.
- Add the Kimi K3 vision-capable OpenCode evidence lane only when screenshots or visual artifacts
  materially improve the architectural judgment; it complements rather than replaces GLM.
- Formal PLAN-EVAL: a fresh daemon-attached Codex GPT-5.6 Sol high session, separate from every
  generator/reviewer session, following `evaluator/plan-protocol.md` and `gates/plan-gate.md`.
- No IMPL-EVAL is needed because this run produces no implementation. The docs/RFC changeset must
  still receive the appropriate accuracy/link/format gates and opposite-family plan evaluation.
- Do not use OpenHands. OpenRouter is limited to the required major-UI design lane or a genuinely
  authorized fallback/third opinion.

## Worktree, branch, and run shape

- Worktree: `/home/codex/repos/ns-rfc-devtools-contribution`
- Branch: `plan/devtools-contribution`
- Baseline at launch: `origin/main` at `2256a67bf` (re-fetch and record the actual baseline before
  locking any claim; do not rebase away work after the run starts).
- Run root: `.llm/runs/plan-devtools-contribution--seed/`
- Write `supervisor.md` first. Then create all mandatory seed-run and supervisor artifacts,
  including `research.md`, `plan.md`, `worklog.md`, `context-pack.md`, `drift.md`,
  `phase-registry.md`, design packs, decision brief, supersession map, and filing manifest drafts.
- Open a proper draft PR against `main` with the bootstrap commit in this same session. Keep it
  draft. Apply intentional docs-only CI labels and the RFC/status taxonomy according to
  `netscript-pr`.
- Planning-only mutation boundary: the run branch, its draft PR, phase comments, and labels are
  writable. Do not create/edit/close/move issues, epics, milestones, repo labels, or existing PRs
  before the owner ratifies the final decision brief in-turn. Do not merge the RFC yourself.

## Authoritative evidence inputs

Re-baseline every carried design against current `main`; previous artifacts are evidence, not
binding architecture unless already ratified.

1. **Frontend Contribution Layer** — merged RFC PR #890, epic #922, children #923–#946, and the
   committed `plan-frontend-contrib--seed` record. Preserve its versioned envelope/generated
   registry pattern, but recognize that it principally ratified the userland `app` family.
2. **Runtime-Versioned Automation** — draft RFC PR #1446 at final evaluated head `6cb79675c`, and
   `/home/codex/repos/ns-rfc-runtime-versioned-automation/docs/architecture/rfc/rfc-0001-runtime-versioned-automation.md`
   plus its evidence corpus. Consume its P-6 DevTools dependency and its stable management,
   audit/history, convergence, and OTel contracts. Do not reopen its backend decisions.
3. **Typed SDK client contributions** — draft RFC PR #1390 and tracking issue #1348. Determine the
   DevTools client/data-access dependency without inventing a second SDK extension mechanism.
4. **Existing Dev Dashboard evidence** — epic #400, merged design umbrella #685, draft visual PR
   #780, older closed prototype #506, issues #410–#432 and later dashboard-related issues, plus
   `.llm/runs/dashboard-rescope--seed/`. Treat all pre-modern-RFC dashboard design as research
   evidence to keep, amend, supersede, or reject—not as a ratified architecture.
5. Current `packages/fresh`, `packages/fresh-ui`, plugin manifest/contribution axes, generated
   registries, CLI plugin generation/doctor/dev flows, Aspire contributions, telemetry contracts,
   MCP surfaces, Scalar links, and scaffolded `/design` resources.
6. Current docs and architecture doctrine, relevant open issues/milestones, and the Fable 5
   remediation roadmap. Deduplicate every proposed issue against live GitHub state.
7. Primary-source market research. At minimum compare Nuxt DevTools, TanStack Devtools, Vite
   DevTools/inspect ecosystems, Medusa admin zones/extensions, Backstage, Directus/Strapi, Grafana
   plugin extensions, Aspire Dashboard, and Scalar. Add or remove comparators when evidence shows a
   better analogue. Separate developer tooling from production admin consoles and generic browser
   extension models.

## Five frontend contribution surfaces — mandatory framing

The plan must model these as related but distinct seams, and decide dependencies/ownership rather
than collapsing them into one vague `frontend` axis:

1. **Userland frontend code** — routes/islands/nav/theme/zones, inspired by Medusa zones and already
   substantially covered by RFC #890.
2. **Fresh UI registry/component/style-dictionary contributions** — plugin-supplied registry items
   generated/copied into userland, with a possible contribution mechanism that safely extends
   existing `fresh-ui` CLI commands.
3. **Vite plugin contributions** — deferred unless the RFC proves a minimal safe contract; ordering,
   trust, build determinism, local/JSR resolution, and failure containment must be explicit.
4. **DevTools contributions** — the primary subject of this RFC: a first-class host/family through
   which plugins add developer-facing routes, panels, inspectors, visualizers, actions, commands,
   diagnostics, navigation, and deep-links.
5. **SDK contributions** — owned by PR #1390; consume rather than duplicate it.

## Questions the RFC must decide

1. Is NetScript DevTools a separate first-party plugin/resource/host, an app-mounted mode, or a
   composed combination? Define local-development, deployed-production, and remote-exposure
   behavior without ambiguity.
2. Define the DevTools contribution envelope/family versioning, identity, discovery, generated
   registry, host capabilities, compatibility negotiation, ordering, collision policy, quarantine,
   budgets, and removal/update behavior. Reuse #890's pattern where sound; do not copy its app
   payload blindly.
3. Define contribution kinds and their contracts. Evaluate at least pages/routes, zones/panels,
   inspectors, visualizers, actions/commands, diagnostics/data sources, navigation, external
   deep-links, and optional setup/onboarding. Avoid a speculative union: each retained kind needs a
   real first-party consumer and host behavior.
4. Separate **production/admin management** from **developer diagnostics**. The runtime automation
   admin console remains a userland app contribution; DevTools consumes the same typed management
   and observability contracts for diagnostics without duplicating the console.
5. Preserve the old dashboard's correct ownership thesis: Aspire owns resource/process state,
   logs, traces, metrics, and health; Scalar owns API schemas/reference/try-it; NetScript DevTools
   owns framework-only state, contribution wiring, contract provenance, generated-surface drift,
   runtime-domain journeys, and safe framework actions. Deep-link instead of cloning upstream UIs.
6. Decide the data plane: typed contracts, SDK extensions, server/client context, live updates,
   caching, auth/principal propagation, streaming, OTel correlation, and how plugins expose data
   without direct arbitrary service URLs or a confused-deputy proxy.
7. Decide security/trust tiers: read-only default, write/action capabilities, CSRF/origin, auth and
   RBAC, local-only defaults, production enablement, secrets, plugin trust, iframe/process
   isolation where warranted, and auditability.
8. Decide build/dev mechanics: Fresh/Vite integration, HMR, island registration, source maps,
   package/local resolution, generated registry transactions, plugin install/update/remove,
   `plugin dev`, doctor diagnostics, and whether a generic Vite-contribution RFC is prerequisite or
   explicitly deferred.
9. Define a compelling, non-generic information architecture grounded in NetScript's seams. Include
   worked first-party examples for workers, sagas, triggers, streams, contracts/SDK, plugin registry,
   generated artifacts, and runtime automation. Include loading, empty, degraded, incompatible,
   unauthorized, and failure states—not only happy screenshots.
10. Reconcile the existing dashboard board: produce a file-level and issue-level supersession map
    (`KEEP`, `AMEND`, `FOLD`, `SUPERSEDE`, `CLOSE-LATER`) for #400 and every relevant child/PR.
11. Define packages/plugins and doctrine archetypes, public API sketches, contributor journeys,
    threat model, observability, accessibility, responsive behavior, testing, browser gates,
    release gates, and an implementation DAG of small coherent PR slices.
12. Decide what must be a separate follow-up RFC: Fresh UI contribution, generic Vite contribution,
    deployment/remote DevTools, or other seams. Each staged RFC needs consumed contracts, entry
    criteria, and an owning implementation dependency—not a vague deferral.

## Required deliverables

- A canonical RFC under `docs/architecture/rfc/` with diagrams, normative contracts, API examples,
  explicit alternatives, threat model, lifecycle, failure behavior, package ownership, frontend
  host split, and implementation roadmap.
- A cited current-state matrix and market/competitor architecture study.
- A five-surface frontend contribution map showing dependencies and non-overlap.
- A DevTools host/contribution-family design pack with worked plugin examples and contributor DX.
- A design/UX evidence pack that incorporates the required GLM pass and any justified Kimi visual
  evidence, with per-finding dispositions.
- A complete supersession map for the existing dashboard epic/issues/PRs.
- A draft epic and one-file-per-issue set, milestone proposal, dependency DAG, agent briefs, and a
  committed one-shot filing manifest—draft text only until owner ratification.
- An owner decision brief listing every genuine fork; no decision that would force rework may hide
  under `safe to defer`.
- Formal Codex Sol high PLAN-EVAL evidence against an immutable commit, with fix cycles until PASS
  or harness escalation.
- A clean, pushed worktree and current draft PR that remains draft pending owner ratification and
  board filing authorization.

## Boundaries

- No framework/product source implementation.
- No board mutation before explicit owner ratification in-turn.
- Do not merely modernize the visual design of #400; architecture and contribution mechanics are
  the primary deliverable.
- Do not duplicate Aspire, Scalar, #890 userland contributions, #1390 SDK contributions, or #1446
  runtime management architecture.
- Do not claim isolation, security, compatibility, performance, or production readiness without
  executable gates or cited evidence.
- Do not ask routine questions. Record owner forks, make reversible evidence-backed recommendations,
  and continue autonomously until the draft RFC and PLAN-EVAL are complete.
