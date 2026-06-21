# Codex Panel Findings — Docs v3 IA Plan

Reviewer: Codex adversarial panel  
Branch: `docs/v3-ia-plan`  
Scope: planning artifacts only; no public doc prose or framework code changed.

## Findings

1. **blocker — Plan-Gate contract is not satisfied by the run artifacts.**  
   **Location:** `plan.md:31-113`; run directory `.llm/tmp/run/docs-v3-ia-plan--supervisor/`  
   The harness requires a Design checkpoint in `worklog.md`, an open-decision sweep, enumerated commit slices under 30, and run artifacts including `worklog.md`, `drift.md`, and `commits.md`. The run directory currently contains only `context-pack.md`, `research.md`, `doc-architecture-v3.md`, `plan.md`, and `ground/*`; there is no `worklog.md`, `drift.md`, or `commits.md`. The plan has workstreams, not commit slices: no slice lists the exact files it will touch, the gate that proves it, or the output it introduces. It also has no open-decision sweep.  
   **Required change:** Add the missing mandatory harness artifacts, add `worklog.md` with `## Design`, add an explicit open-decision sweep, and convert WS1-WS8 into ordered commit slices with touched file/path sets and proving gates before submitting this to PLAN-EVAL.

2. **blocker — The public-surface inventory is incomplete, so the plan cannot deliver "every shipped public surface has a discoverable home."**  
   **Location:** `research.md:52-65`, `doc-architecture-v3.md:19`, `plan.md:51-57`  
   The plan audits a few packages (`fresh`, `sdk`, `database`, `plugin-sagas-core`, `service`, and a coarse standalone bucket), but the checked-out branch exposes many additional public package/plugin surfaces that are not classified into narrative home vs generated reference vs intentionally reference-only. Examples verified from export maps: `@netscript/plugin-workers-core` publishes `./builders`, `./contracts/v1`, `./registry`, `./state`, `./executor`, `./workflow`, `./streams`, `./presets`, `./shutdown`, `./schemas`, `./telemetry`, `./abstracts`, `./testing`, `./config`, and `./runtime` (`packages/plugin-workers-core/deno.json:6-23`); `@netscript/plugin-triggers-core` publishes `./adapters`, `./builders`, `./config`, `./contracts/v1`, `./domain`, `./ports`, `./public`, `./runtime`, `./telemetry`, and `./testing` (`packages/plugin-triggers-core/deno.json:6-18`); `@netscript/plugin-auth-core` publishes auth domain/ports/contracts/telemetry/streams/config/presets/testing (`packages/plugin-auth-core/deno.json:6-16`). The same gap exists for `queue`, `telemetry`, `aspire`, `plugin`, auth backend packages, and first-party plugin packages.  
   **Required change:** Generate a complete export-map/`deno doc` inventory for every `@netscript/*` package and plugin, then explicitly classify each public subpath as: capability narrative, how-to/tutorial coverage, explanation coverage, generated reference only, testing-only, or intentionally deferred with debt. Update the IA and WS3 acceptance against that complete matrix.

3. **blocker — Tutorial Tracks B and C are claimed as playground-validated, but the grounding artifact says the opposite for their central promises.**  
   **Location:** `plan.md:22-25`, `plan.md:44-49`, `doc-architecture-v3.md:117-129`, `ground/playground-showcase-map.md:31-32`, `ground/playground-showcase-map.md:218-224`  
   The plan says all four real-app rosters are "validated vs the `netscript-start` playground showcase." The showcase explicitly reports no user-auth surface and no login/session/RBAC in the playground, while Track B is an auth/orgs/team-workspace tutorial. It also says non-TS polyglot tasks are asserted but not demonstrated in playground code, while Track C centers ERP sync with polyglot tasks. Deferring verification to the later build run is not enough because these tracks determine the IA and page roster now.  
   **Required change:** Either replace Tracks B/C with tracks grounded by existing runnable examples, or add a pre-authoring proof plan for each: exact scaffold command, package/plugin APIs used, minimal app skeleton, and a smoke gate that proves auth/orgs and non-TS task execution before prose is authored.

4. **major — Foundational implementation choices are left open even though they can force rework.**  
   **Location:** `doc-architecture-v3.md:174-199`, `plan.md:59-76`, `plan.md:115-117`  
   The foundation work leaves unresolved choices that affect file ownership, build integration, accessibility, and migration mechanics: Mermaid is "client-side or at build"; xref is "`comp.xref`/filter"; xref storage is `_data.ts` or `_data/xref.ts`; version switcher may be real or a static pill; Pagefind indexing scope is not locked. These are not cosmetic implementation details. They decide whether diagrams are no-JS accessible, whether generated reference links can be keyed, how build failures surface, and whether every page must be rewritten again after the first pass.  
   **Required change:** Lock these as architecture decisions before PLAN-EVAL: diagram rendering mode, static fallback format, xref implementation surface and key namespace, Pagefind index inputs including `reference/**`, and alpha/version UI behavior for this release.

5. **major — Acceptance gates are slogans rather than executable verdicts.**  
   **Location:** `plan.md:107-113`, `doc-architecture-v3.md:204-210`, `ground/leakage-diagram-barraising.md:126-145`  
   The plan says "Lume build green," "leakage scan = 0," "accuracy dossiers not regressed," and "visual/structural audit green," but does not name the actual commands, scan patterns, checked roots, branch checkout, or expected artifacts. It also omits the docs overlay gates: source alignment, scope separation, link integrity, terminology, and drift logging. The leakage report says several categories have zero hits, but there is no reusable scanner definition to prevent a different evaluator from counting different strings.  
   **Required change:** Add a gate table with exact commands/scripts, inputs, expected outputs, and ownership. Include link/path check over the generated xref map, a deterministic leakage scanner with its allowlist, a source-alignment checklist that ties each prescriptive claim to code/doctrine/RFC, and a visual screenshot matrix for desktop/mobile.

6. **major — The capability hub template is too shallow for the APIs the plan promises to cover.**  
   **Location:** `doc-architecture-v3.md:97-113`, `ground/playground-showcase-map.md:198-225`, `plan.md:92-98`  
   A uniform "3-5 sentence explanation + one diagram + minimal example + option table" hub will not close the hardest gaps. The playground calls out `definePage().withLayer/.withForm/.withResource/.withLayout/.withMeta/.withPolicy/.withTelemetry`, layer/partial/island, cache-first SWR, StreamDB preload/dehydrate, query-key bridging, forms modes, and `withPolicy` values as missing conceptual material. The current hub template can still produce polished but thin pages that restate the gap.  
   **Required change:** Add per-capability content contracts for the complex hubs (`fresh-framework`, `sdk`, `background-jobs`, `durable-sagas`, `triggers`, `services`, `database`, `auth`). Each must name the concepts, APIs, option tables, runnable examples, diagrams, how-tos, and generated reference links required before the hub is accepted.

7. **major — The public-voice plan contradicts itself on whether "archetype" is public vocabulary.**  
   **Location:** `ground/leakage-diagram-barraising.md:48-84`, `doc-architecture-v3.md:78-84`, `plan.md:78-90`  
   The leakage audit correctly flags public prose that exposes internal doctrine taxonomy and the word `archetype` as a user-facing concept. The proposed IA then adds `explanation/plugin-system` with "archetypes (public-facing framing)" and WS7 only says to scrub `author-a-plugin.md` phrasing. That keeps the same internal taxonomy in the public explanation zone under a new label.  
   **Required change:** Decide that archetypes are internal contributor doctrine and remove them from public IA/glossary/tutorial authoring, or explicitly justify the one public use case and define a user-facing vocabulary that does not leak doctrine mechanics. The plan should not both flag and preserve the term.

8. **major — Marketplace CLI commands are stubs, but the IA treats them as normal CLI surface.**  
   **Location:** `research.md:79`, `doc-architecture-v3.md:89`, `doc-architecture-v3.md:152`, `packages/cli/src/public/features/marketplace/search/marketplace-search-command.ts:1-8`, `packages/cli/src/public/features/marketplace/search/marketplace-search-command.ts:29-32`, `packages/cli/src/public/features/marketplace/publish/marketplace-publish-command.ts:1-8`, `packages/cli/src/public/features/marketplace/publish/marketplace-publish-command.ts:28-30`  
   The plan says to add `marketplace publish|search` to the full CLI reference. The implementation identifies both as stubs and prints "Plugin marketplace coming soon" / "Plugin marketplace publishing coming soon." A production-grade public reference must not present these like working marketplace functionality.  
   **Required change:** Document them as alpha/stub commands with exact current behavior, put them behind a status badge/caveat, or exclude them from the "full CLI surface" until the marketplace actually works. Add a CLI smoke check that captures command output so the docs cannot overpromise.

9. **major — Production deployment is named, not designed.**  
   **Location:** `doc-architecture-v3.md:75`, `doc-architecture-v3.md:131-133`, `plan.md:44-49`, `plan.md:92-98`  
   Every tutorial track ends in `deploy`, and WS8 adds a production checklist, but the IA does not define the production target(s), supported deployment mode, minimum environment/secrets/migrations/health/observability contract, or a verification command. "Aspire -> prod checklist" is not enough for production-grade public docs; it can easily become generic deployment prose.  
   **Required change:** Lock a production deployment model for the first build run, or explicitly split deployment into local/Aspire-only and production-deferred docs. If kept, define the target platform(s), exact commands, environment contract, migration step, health/readiness checks, rollback/drain behavior, and validation evidence.

10. **minor — The plan relies on a target docs branch/tree that is absent from this PR without recording how reviewers reproduce target-site checks.**  
    **Location:** `doc-architecture-v3.md:5`, `research.md:98-100`, `ground/leakage-diagram-barraising.md:3-7`  
    The PR branch does not contain `docs/site/**`; the artifacts point to deployed `origin/docs/user-site` and prior research. That can be valid for a planning PR, but the plan does not give reviewers the exact checkout/ref, deploy artifact, or command sequence needed to reproduce the leakage, diagram, and structural gap counts.  
    **Required change:** Add a reproducibility section with the exact `docs/user-site` commit/ref, checkout path, commands used to scan `docs/site/**`, and how generated `reference/**` is excluded.

## Overall Read

Not ready to drive a production-grade build. The direction is right: Diátaxis, capability hubs, independent tutorials, xref, diagrams, search, and public-voice cleanup are the correct levers. But the plan is still an ambitious intent document, not an executable IA contract. It fails harness readiness, under-inventories the actual shipped public surface, overclaims tutorial grounding, leaves rework-prone foundation choices open, and lacks deterministic gates. Tighten those items before authoring starts; otherwise the build run will rediscover the same gaps after prose and components already exist.
