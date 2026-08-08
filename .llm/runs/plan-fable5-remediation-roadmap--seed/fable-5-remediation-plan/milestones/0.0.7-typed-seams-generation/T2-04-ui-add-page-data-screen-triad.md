# fix(cli): ui:add page --island emits a useSignal counter and an empty queryLoaders object instead of the advertised data-screen triad — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T2-04 · **Proposed milestone:** 0.0.7 (new "Typed seams + generation" cut per the
Stage-E rename-shift; if the train is not shifted, `0.0.6`) · **Labels:** `type:fix` `area:cli`
`area:fresh` `priority:p1` `status:triage` · **Depends on:** T2-03 (app-root targeting), T2-01
(the slice contract this command is the minimal mode of), T2-02 (the query factory the island binds)

## Summary

`ui:add` describes itself as scaffolding "the Fresh page + island + query-loader triad for a data
screen", and the generated app `AGENTS.md` tells every coding agent to reach for it first. What it
emits is a page with a `() => ({})` layer loader, an island that is a `useSignal(0)` counter button,
and a file containing `export const queryLoaders = {} as const;`. The one command the framework
points agents at produces a counter where a data screen was promised — which is the measurable
mechanism behind agents hand-rolling their own screens.

## Evidence

- `research/repo-audit/web-layer.md` §8 (full emission breakdown) and gap register item 9;
  `research/repo-audit/mcp-cli.md` §3.5.
- Repo, verified at `fac9e339042c`, `packages/cli/src/kernel/application/ui/web-scaffold.ts`:
  - `:15-42` — `scaffoldUiPage` writes exactly three files; the page's only layer is
    `.withLayer('<name>', () => <Island/>, () => ({}))` with no loader, no `withResource`, no query.
  - `:34` + `:66-68` — the island content is `signalIslandTemplate`, i.e.
    `const count = useSignal(0); return <button …>{count}</button>;`.
  - `:37` — the third file is literally
    `export const queryLoaders = {} as const;`.
  - `:51` — `ui:add island --query` emits `<QueryIsland><div>Name</div></QueryIsland>`: a provider
    around a static div, no `useQuery`, no key, no factory.
  - `:60` — any pre-existing target file is a hard refuse; there is no `--force` and no `--dry-run`,
    unlike every other generator (`install-plugin-command.ts` has both).
  - `:20` — the route id is a hand-derived dotted string with no link to the generated manifest, and
    the page declares `createRouteReference` inline instead of registering in `router.ts`.
- Advertised behavior it contradicts:
  `packages/cli/src/public/features/ui/add/add-ui-command.ts:26-28` (the description quoted above)
  and `packages/cli/src/kernel/templates/app/agent-conventions.ts:137-139` (the three commands
  agents are told to use; line 137 promises "a typed Fresh route, a colocated hydrating island, and
  its query-loader seam").
- Behavioral consequence measured in the field: #1333 body (Wave-6 `rickylabs/loom` built routes
  with hand-rolled tables and a 676-line island); #1090 holds the observational box "an agent
  building a data screen runs `ui:add` or records why not".

## Current surface

Three files, none of which loads data. Two island conventions from one command: `ui:add page
--island` writes to `routes/<seg>/(_islands)/`, `ui:add island` writes to top-level `islands/`.
`UiAddCommandInput` (`add-ui-input.ts`) omits `route`, `island` and `query`, so the exported public
type under-describes the public CLI.

## Target contract

`ui:add page <path> --island` emits a **working data screen** — the minimal composable core of the
T2-01 slice, not a second generator:

1. The page uses the typed route surface (registered through `router.ts`/`appRoutes`, not an inline
   `createRouteReference`) and a real layer loader.
2. The `(_shared)` file contains a cache-first loader bound to a real query factory and returning
   `cachedAt`; it is not an empty object.
3. The island is a `QueryIsland` + `useIslandQuery` bound to the factory's `clientKey`, seeded with
   the loader's data and `initialDataUpdatedAt` (T2-07) — not a counter.
4. `ui:add island --query` emits an island that actually issues a query.
5. When the target app has no service/contract to bind, the command **says so and names the verb to
   run first** rather than emitting a placeholder that type-checks and does nothing.
6. Island placement is one documented convention, with the divergence between the two commands
   resolved explicitly.
7. `--force` and `--dry-run` exist, matching the rest of the CLI.
8. `UiAddCommandInput` declares every accepted option.

## Acceptance

- [ ] `ui:add page <path> --island` emits a page, loader and island that fetch and render real
      contract-derived data in a scaffolded project.
- [ ] The emitted island contains no `useSignal` counter and the emitted `(_shared)` file contains
      no empty `queryLoaders` object.
- [ ] `ui:add island <Name> --query` emits an island that issues a query with a factory-derived key.
- [ ] The emitted page registers its route through `router.ts`/`appRoutes`.
- [ ] Island placement follows one documented convention across both commands.
- [ ] `--force` and `--dry-run` are supported and documented.
- [ ] `UiAddCommandInput` declares `route`, `island`, `query` (and `app`, per T2-03).
- [ ] Running the command in an app with no bindable contract exits non-zero with the prerequisite
      verb named, and writes no files.
- [ ] Negative test: a golden test fails if the emitted island imports `@preact/signals`' `useSignal`
      as its only behavior, or if the emitted loader module exports an empty object.
- [ ] Negative test: the command's own `--help` text is asserted against the emitted file set, so
      the description and the emission cannot diverge again.
- [ ] gate: `deno task e2e:cli run scaffold.runtime --cleanup` scaffolds a page via this command and
      type-checks the app containing it.

## Boundaries

- **T2-01** owns the full slice generator (`--form`/`--partial`/`--stream`, route-local
  `(_components)`, ownership comments). If the owner consolidates, this issue is that generator's
  minimal mode — state the decision, do not ship two generators.
- **T2-03** owns where the files land; do not re-fix app resolution here.
- **T2-02** owns the query factory this island binds; do not emit ad-hoc client wiring.
- **#1333** owns the default app's own routes; this issue changes the *generator*, not the shipped
  example routes.
- **#1090** owns the observational measurement of whether agents adopt the command — do not add an
  agent-run box to this issue's acceptance.
- **#1102/#1197** own MCP/agent discovery; this is not a discovery fix.

## Docs/consumer proof

The proof is a generated screen, not a paragraph: `scaffold.runtime` runs the command and
type-checks the result, the app `AGENTS.md` example matches the real emission, and the Web Layer
how-to that names the triad shows the actual generated files. #1090 separately observes whether an
unfamiliar agent reaches for the command — that measurement stays on #1090.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Drafted from
`research/repo-audit/web-layer.md` §8 and `research/repo-audit/mcp-cli.md` §3.5; every line
re-verified against worktree `fac9e339042c`. No GitHub mutation performed.
