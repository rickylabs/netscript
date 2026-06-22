# Phase 4 implementation review findings

Reviewer: Codex, independent adversarial implementation review.
Branch: `docs/v4-impl-review`.
Build tip reviewed: `86945d2d`; inline-fix commit: `f8797a1c`.

## Summary table

| ID | Area | Finding | Verdict | Evidence / action |
| --- | --- | --- | --- | --- |
| F-01 | Caveats | Several authored pages stated limitations without tracked caveat markers: alpha `^1.0.0` specifiers, auth single-active backend, hosted Web Layer sandboxes, app-wide shutdown, deploy artifacts, Fresh app telemetry defaults, and non-Deno task sandboxing. | Fixed | Added seven debt ids to `.llm/harness/debt/arch-debt.md`; added 22 caveat markers. `deno task check:caveats` now reports 34 markers across 23 pages. |
| F-02 | Prose | Authored pages had no banned `honest` / candor-announcing language, but a few phrases used soft convenience or pep-talk framing. | Fixed | Rewrote `all you need` -> `sufficient`, `just type netscript` -> `use netscript`, and removed the "We'd rather..." sentence from the "not the right tool" callout. |
| F-03 | Caveat model | Some repeated limitations had no stable caveat id, forcing pages either to omit markers or use vague prose. | Fixed | Added debt ids: `alpha-specifiers-forward-looking`, `auth-single-active-backend-boundary`, `fresh-hosted-example-sandboxes`, `runtime-app-wide-shutdown-orchestrator`, `cli-deploy-artifacts-missing`, `fresh-app-telemetry-defaults`, `workers-non-deno-task-sandbox-boundary`. |
| F-04 | better-auth docs | The new better-auth plugins leaf states the R0 passthrough accurately and marks R1 schema generation plus R2 interactive-flow limits. | Fixed / no further inline change | Existing markers resolve to `arch-debt:seamless-auth-roadmap`; `deno doc --filter createNetscriptBetterAuth packages/auth-better-auth/mod.ts` shows `plugins: [organization()]` in the documented example. |
| F-05 | Built site gates | Baseline and post-fix site gates passed. | Fixed | Post-fix `deno task verify`: exit 0; 18453 internal links across 130 pages; 34 caveat markers resolve. |
| B-01 | Service docs | `ServiceApp` is a real mountable/in-memory service surface, but the authored docs do not teach "test or embed a service without opening a listener" as a workflow. | Backlog | `deno doc --filter ServiceApp packages/service/mod.ts`: `fetch(request)` and `request(input, init?)`; module docs say `build()` returns a non-listening `ServiceApp`. |
| B-02 | Service docs | Health composition is richer than the current task docs make obvious: service-to-service and custom health probes are real. | Backlog | `deno doc packages/service/mod.ts`: `healthChecks` includes `database`, `kv`, `service(name, baseUrl)`, and `custom(name, fn)`; `ServiceBuilder` exposes `withHealthCheck` and `withReadinessCheck`. |
| B-03 | Plugin authoring | The plugin manifest builder has lifecycle, metadata, permissions, telemetry, migrations, and dependency axes that deserve a task page or API table, not only an example snippet. | Backlog | `deno doc --filter PluginBuilder packages/plugin/mod.ts`: `withHooks`, `withPermissions`, `withMetadata`, `withDependencies`, `withTelemetry`, `withMigrations`, `withE2e`, `withAspire`. |
| B-04 | Streams testing | Streams has real test-only producer and fixture helpers that are absent from authored task docs. | Backlog | `deno doc packages/plugin-streams-core/src/testing/mod.ts`: `MemoryStreamProducer`, `MemoryStreamEvent`, `createStreamTopicFixture`. Search found no authored usage outside reference. |
| B-05 | Fresh interactive | `@netscript/fresh/interactive` exposes Suspense promise helpers that are not taught in the Web Layer pages. | Backlog | `deno doc packages/fresh/src/runtime/interactive/mod.ts`: `usePromise<T>(promise)` and `resolvedPromise<T>(value)`. Search found no authored `usePromise` coverage. |
| B-06 | Fresh forms | The public form surface is much larger than the current form page's workflow coverage. Collection intents, CSRF helpers, Standard Schema adapters, `Form`, `FormRegion`, and enhancement state need a deeper guide. | Backlog | `deno doc packages/fresh/src/application/form/mod.ts`: `Form`, `FormRegion`, `collectionIntent`, `createStandardSchemaAdapter`, `generateCsrfToken`, `verifyCsrfToken`, `FormSchemaAdapter`, `RuntimeFormState`, submission result unions. |
| B-07 | Docs components | The site has reusable components (`apiTable`, `fileTree`, `tabbedCode`, diagrams), but some pillars still rely on prose where competitors would use signature tables, file trees, and "what you will build" blocks. | Backlog | Competitor research: TanStack API signatures, Astro file trees/diff code, Medusa module diagrams, Laravel production deep dives. |

## Part 3 backlog: best-in-class documentation improvements

1. **Typed API signature component fed by `deno doc` extracts.** Add a page-local component for exact signatures, options, defaults, return values, and caveats. Use it first on `ServiceBuilder`, `PluginBuilder`, Fresh form helpers, and auth backend factories. This copies TanStack's signature-first API pages without duplicating generated reference.

2. **Workflow recipe shell.** Add a reusable "What you will build / prerequisites / files touched / verify / production notes" component. Use it on auth, streams publishing, service health, plugin authoring, and deploy guides. This borrows Astro tutorial checkpoints and Medusa recipe decomposition.

3. **Production-readiness checklists per pillar.** Add one checklist band to services, background jobs, durable workflows, auth, streams, database, and deploy. Include required env, health checks, data stores, trace surface, shutdown behavior, and known caveats. Laravel-style depth signal; no marketing copy.

4. **Architecture diagrams per module with data/resource ownership.** Existing diagrams are good at flows. Add ERD/resource diagrams for auth tables, stream collections, plugin process/resource graphs, and service health topology. This is the Medusa module-schema pattern.

5. **Tabbed code for runtime variants.** Use tabs consistently for local-source vs public JSR, kv vs prisma, kv-oauth vs workos vs better-auth, Deno task vs external task, and Aspire vs no-Aspire. The component exists; the backlog is systematic use.

6. **File-tree component pass.** Apply `fileTree` to scaffold-heavy pages: quickstart, add authentication, author a plugin, database migration, Fresh UI customization, and deploy. Astro's file-tree pattern would reduce prose and make generated ownership clearer.

7. **Reference-to-guide bridge cards.** Generated reference pages are complete but isolated. Add "learn/do/reference" cards at the top or bottom of high-value reference pages, especially service, plugin, fresh, fresh form, streams core, and runtime-config.

8. **Runnable examples index.** Replace the "planned sandboxes" note with a real examples directory: local command, expected ports, source path, and later StackBlitz/GitHub Codespaces links. Track under `fresh-hosted-example-sandboxes`.

## Part 4 backlog: undocumented real features grounded in `deno doc`

### `ServiceApp` mount/test surface

- Evidence: `deno doc --filter ServiceApp packages/service/mod.ts` shows `ServiceApp` with `fetch(request)` and `request(input, init?)`. Module docs also state `build()` returns a non-listening `ServiceApp`.
- Gap: The services page mentions `ServiceApp` at a high level, but there is no task-oriented recipe for embedding a service into another host or testing a service in memory without a port.
- Proposal: Add "Test or mount a service without listening" to `how-to/add-a-service.md` or a new service testing page.

### Service health probes and readiness composition

- Evidence: `deno doc packages/service/mod.ts` shows `healthChecks.database`, `healthChecks.kv`, `healthChecks.service`, `healthChecks.custom`, plus `ServiceBuilder.withHealthCheck` and `ServiceBuilder.withReadinessCheck`.
- Gap: The docs show database and service probes but do not teach composing custom readiness or cross-service health as a recipe.
- Proposal: Add a "compose health/readiness checks" how-to with DB + KV + dependent service + custom business invariant.

### Plugin manifest lifecycle and contribution axes

- Evidence: `deno doc --filter PluginBuilder packages/plugin/mod.ts` shows `withHooks`, `withPermissions`, `withMetadata`, `withDependencies`, `withTelemetry`, `withMigrations`, `withE2e`, `withRuntimeConfigTopics`, `withContractVersions`, `withAspire`.
- Gap: `how-to/author-a-plugin.md` introduces several axes, but lifecycle hooks, metadata, permissions, telemetry, and migrations are not elevated into their own decision table.
- Proposal: Add a "manifest axes" section/table to plugin-system docs and a separate advanced authoring recipe for lifecycle hooks and generated resource contributions.

### Streams testing helpers

- Evidence: `deno doc packages/plugin-streams-core/src/testing/mod.ts` shows `MemoryStreamProducer`, `MemoryStreamEvent`, and `createStreamTopicFixture`.
- Gap: Streams docs teach publishing and live consumption but not unit-testing producers without opening the `:4437` runtime.
- Proposal: Add a testing subsection to `how-to/publish-a-durable-stream.md`: replace the durable producer port with `MemoryStreamProducer`, assert `events()`, and use `createStreamTopicFixture()`.

### Fresh interactive Suspense helpers

- Evidence: `deno doc packages/fresh/src/runtime/interactive/mod.ts` shows `usePromise<T>(promise)` and `resolvedPromise<T>(value)`.
- Gap: The Web Layer explains islands and query hydration, but not the package-owned Suspense promise helpers.
- Proposal: Add a short `web-layer/interactive.md` section showing an island reading a server-provided promise with `usePromise` and a test/default path with `resolvedPromise`.

### Fresh form runtime surface

- Evidence: `deno doc packages/fresh/src/application/form/mod.ts` shows `Form`, `FormRegion`, `collectionIntent`, `applyIntentOperation`, `createStandardSchemaAdapter`, CSRF helpers, field descriptors, form enhancement helpers, and submission result unions.
- Gap: The form page covers the happy path and `generateSubmissionId`, but not collections, Standard Schema adapters, CSRF lifecycle, or progressive enhancement state as first-class concepts.
- Proposal: Split the form docs into one overview plus three task leaves: server validation, collection intents, and schema adapters/CSRF.

## Representative before -> after patterns

### Soft convenience language

Before:

```md
... on the strict happy path above, the four steps are all you need.
```

After:

```md
... on the strict happy path above, the four steps are sufficient.
```

### CLI pep-talk phrasing

Before:

```md
Install once (below), then just type `netscript`.
```

After:

```md
Install once (below), then use `netscript`.
```

### Candor-announcing / persuasion copy

Before:

```md
We'd rather you pick the right tool than a regretful one.
```

After:

```md
<removed; the factual "When NetScript is NOT the right tool" list now carries the point directly>
```

## Validation evidence

Post-fix gate:

```text
cd docs/site
deno task verify
exit code: 0
18453 internal links across 130 pages - all resolve
34 caveat markers across 23 pages - all references resolve
```
