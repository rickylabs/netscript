# S2 draft report — four main pages

## Outcome

Rewrote the four public entry pages on `docs/main-pages-revamp` to the locked funnel:

`/` want it → `/why/` choose it → `/quickstart/` run it → `/concepts/` understand it.

Only these worktree files changed and were committed:

- `docs/site/index.vto`
- `docs/site/why.vto`
- `docs/site/quickstart.vto`
- `docs/site/concepts.vto`

No front-matter or navigation file outside those pages was needed. The pre-existing uncommitted
`deno.lock` change was left untouched and unstaged.

## Per-page summary

### `docs/site/index.vto`

- Replaced the hero and metadata with the locked two-promise position: “Your checkout survives the
  crash. Your types survive the refactor.”
- Reduced the page to one sentence of category context, three proof points, one saga code moment,
  its behavior-accurate caption, and a literal three-link exit strip.
- Made durability the first proof, followed by the shared contract boundary and Aspire/telemetry.
- Replaced the CRUD sample with a compiled checkout saga. Its `inventory.failed` handler emits
  `sagaCompensate(...)` for `payment.captured`; the matching `.compensate(...)` handler emits
  `payment.refund`, so the displayed failure path reaches the behavior named in the caption.
- Removed the architecture essay, plugin/catalog grids, deploy matrix, agent pitch and volatile
  counts, audience grid, capability directory, learning path, and repeated maturity callouts.

Commit: `bc0b3241568ba42eaf71cfeda5b516baaaa1e928` —
`docs(site): lead with durable typed proof`

### `docs/site/why.vto`

- Installed the locked hero: “For teams whose TypeScript app has become a system.”
- Named the non-consumer early: a static site, prototype, or one-process request/response app.
- Reduced the integration-tax argument to three seams: client/service drift, fake durable state,
  and independently assembled resources/telemetry.
- Made shared boundaries and explicit durable state the two expensive-to-retrofit decisions.
- Replaced the feature/differentiator repetition with one buyer-centered comparison table covering
  Fresh/Hono, Next.js, Encore-style stacks, Temporal, and DIY assembly.
- Kept competitor cells calibrated to NetScript's repo-supported surface; no external absolute
  product claims were introduced.
- Promoted framework maturity, Aspire, Fresh/Preact, workspace breadth, and non-hosted operation to
  a visible trade-offs section.

Commit: `1dbdd44a87e9d9632e4513f0bd80ae9ea777fc56` —
`docs(site): frame the integration tax`

### `docs/site/quickstart.vto`

- Replaced the workspace tour with the single path: install → scaffold → start → verify → edit →
  stop.
- Added the complete default-path prerequisites: Deno 2.x, Aspire CLI, and running Docker.
- Uses `netscript init my-app --db postgres --service`; `--service` is explicit because source
  inspection confirmed it defaults off.
- Success now checks exactly what that command creates: Fresh app, example service, Postgres, and
  shared cache, using Aspire's printed dashboard and resource URLs.
- Designed and source-verified the first edit: change the visible introductory sentence in the
  always-generated `apps/dashboard/routes/(_components)/home-view.tsx`, then refresh the Fresh app.
- Removed hard-coded URLs/ports, database setup branches, simulated output/counts, framework code
  tour, workspace inventory, agent guidance, troubleshooting, duplicate recap, and capability link.

Commit: `9de02346c33b2f310ecedd7d7975e51342f2a897` —
`docs(site): make quickstart a verified path`

### `docs/site/concepts.vto`

- Replaced the three-idea framing with the locked five-layer spine: contracts → services → plugins
  → web layer → observability.
- Kept `architecture-overview.svg` here as the single architecture diagram across the four pages.
- Absorbed the homepage's architecture explanation: contract-derived SDK/OpenAPI flow, request-time
  service boundary, manifest-to-runtime plugin model, Fresh page/island boundary, and Aspire/OTLP
  resource graph.
- Added the previously missing web layer as a first-class stage.
- Removed contract and manifest code tabs, auxiliary diagrams, port tables, engine enumeration,
  commands, and repeated maturity/navigation blocks; each section now links to its deep page for
  mechanics.

Commit: `a7a09c54c118aaac1435fcd52acf389a577654cb` —
`docs(site): define the five-layer spine`

## Source verification

- Saga code: `deno doc --filter defineSaga`, `sagaCompensate`, and `send` against
  `packages/plugin-sagas-core/mod.ts`; direct reads of the package README,
  `src/builders/define-saga.ts`, `src/public/messages.ts`, `src/runtime/saga-compensator.ts`, and
  runtime tests. The exact homepage snippet compiled via `deno eval --unstable-kv`.
- CLI path: direct reads of public and maintainer `init-command.ts` confirmed `--service` is opt-in;
  scaffold writers and app templates confirmed the success resources and the always-generated
  `home-view.tsx` edit target.
- Contracts/services/web: `deno doc` for `defineServices`, `defineService`, and `definePage`, plus
  the SDK, service, and Fresh package READMEs.
- Plugins/Aspire/telemetry: direct reads of plugin and Aspire READMEs, AppHost generators, service
  discovery source, and OTLP configuration constants/tests.
- Every local link used by the four pages was resolved against the site tree and then checked by
  the repository link gate.

## Gate evidence

| Gate | Result |
| --- | --- |
| `cd docs/site && deno task build` | PASS — exit 0; 595 files generated |
| `deno task docs:links` | PASS — 102 docs, 0 broken links, 0 broken anchors |
| Hard-ban scan on the four pages | PASS — no `/capabilities/`, `:18888`, banned adjectives, volatile counts, or issue references |
| Changed-line internal-wording scan | PASS |
| NetScript JSR pin scan | PASS — the only `jsr:@netscript/*` command uses `{{ releaseSpecifier }}` |
| `git diff --check` on the four pages | PASS |

## Publication

- Branch: `docs/main-pages-revamp`
- Head: `a7a09c54c118aaac1435fcd52acf389a577654cb`
- Push: `git push origin HEAD:refs/heads/docs/main-pages-revamp` — succeeded
- PR: not opened; orchestration handoff retained as requested
