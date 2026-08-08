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

## Fix round 1

Applied every blocking and major finding from `review-opus.md`; all six were confirmed against
workspace source.

### Blocking fixes

- **B1 — correlated saga events.** Added a typed `.correlate<CheckoutEvent>(...)` rule that returns
  the shared `orderId` as a `SagaCorrelationKey`. This makes `payment.captured` and
  `inventory.failed` resolve to the same saga instance instead of the engine's per-message-type
  fallback. Verified against `define-saga.ts`, `saga-correlation.ts`, `saga-engine.ts`, and
  `deno doc --filter SagaBuilder|SagaCorrelationKey`. The corrected snippet passes
  `deno check` against the local package root.
- **B2 — bounded the compensation claim.** Replaced the automatic-runtime claim with the exact
  configuration boundary: the definition returns a compensation request; executing it requires a
  saga bus bridge configured with a compensator, and restart recovery requires a durable store.
  The caption now ends on the configured handler's `payment.refund` effect. Verified against
  `saga-engine.ts`, `saga-bus-bridge.ts`, `create-saga-runtime.ts`, and
  `saga-compensator.ts`.
- **B3 — deterministic scaffold.** Added `--yes` and documented the defaults that the later checks
  rely on: app name `dashboard` and a shared Redis cache. Verified against `init-command.ts`,
  `init-interactive.ts`, and `scaffold-defaults.ts`.

Commit: `a2609018f` — `docs(site): make saga proof runtime-accurate`

Commit: `39242bb75` — `docs(site): make quickstart deterministic`

### Major fixes

- **M1 — exact AppHost shutdown.** Replaced bare `aspire stop` with
  `aspire stop --apphost ./apphost.mts`, valid from the page's retained `my-app/aspire`
  directory. This matches `.agents/skills/aspire/SKILL.md`.
- **M2 — dashboard authentication.** The success check now tells the reader to use both the
  dashboard URL and the one-time login token printed by `aspire start`, matching
  `docs/site/quickstart/aspire.md`.
- **M3 — prerequisite and escape hatch.** Quickstart and Why now identify the external dependency
  as the **.NET Aspire CLI**. Why names the actionable `--no-aspire` scaffold flag and states which
  wiring the application then owns, matching `init-command.ts` and
  `docs/site/explanation/aspire.md`.

Commit: `a119599c5` — `docs(site): clarify adoption tradeoffs and next steps`

### Minor findings

- Clarified that the first-change target is a wrapped introductory sentence.
- Removed the homepage's duplicate Why CTA and changed Concepts' backward Why CTA to the Storefront
  tutorial.
- Re-angled the homepage observability proof around the operator outcome; Concepts remains the sole
  owner of service-discovery and OTLP injection mechanics.
- Added existing `ns-lede` and `ns-cluster` classes to the homepage's raw caption and exit strip.
- The reported Storefront tutorial description of `.compensate(type)` is a real cross-doc drift,
  but that file is outside this slice's locked four-file scope. No page change was made; the
  homepage continues to follow `saga-compensator.ts`, whose handler lookup uses the compensated
  message type.

### Round-1 gates and publication

| Gate | Result |
| --- | --- |
| Homepage saga snippet `deno check` against local source | PASS — exit 0 |
| `cd docs/site && deno task build` | PASS — exit 0; 595 files generated |
| `deno task docs:links` | PASS — 102 docs, 0 broken links, 0 broken anchors, 0 orphans |
| Hard-ban scan on the four pages | PASS — no banned link, port, adjectives, or issue reference |
| `git diff --check` per fix commit | PASS |

Round-1 head: `a119599c5`. Explicit-refspec push succeeded, and the remote branch resolves to
`a119599c58d36f5052c3f51b3fc519e97a18eadc`. The pre-existing unstaged `deno.lock` change
remains uncommitted.

## Prose round 2

Applied the whole-text editorial review from `slices/mainpages-s8/deep-review.md` while retaining
the locked heroes, homepage one-screen structure, technical accuracy fixes, and ban list.

### Applied

- **Homepage (F1–F4):** replaced the generic category subhead; led the durability proof with the
  retry-loop contrast; varied the repeated “One X” title rhythm; removed the fleet pronoun
  ambiguity; and rebuilt the post-code close around correlation → compensation request → configured
  runtime → refund. F2 and F4 were adapted to retain the configured store, saga bus bridge, and
  compensator boundaries established in fix round 1.
- **Why (F5–F8):** split the hero's two claims into scannable sentences; promoted retrofit cost to
  the thesis of section 2; made the Encore row introduce .NET Aspire and its adapter role; replaced
  “budget for upgrades” with a direct pre-1.0 disqualification; and stated the one-process trade-off
  in terms of unused structure.
- **Quickstart (F9–F11):** explained why .NET Aspire and Docker appear in a Deno quickstart; framed
  `--service` by what it creates; and recast the health check so the four-resource set is explicit.
- **Concepts (F12–F16):** rewrote the hero subhead with one specific verb per downstream layer;
  promoted behavioral contracts to section 1's opening; split the service preset enumeration;
  preserved the terse plugin contrasts; and added causal transitions from contracts → services →
  plugins → web layer → observed graph. The restructure retains every prior technical claim,
  including SDK query helpers, OpenAPI generation, RPC, service-info metadata, validated manifests,
  static workspace wiring, separate plugin resources, Fresh/Preact behavior, OTLP injection, and
  trace propagation.
- **Whole set:** Concepts now picks up Why's architecture handoff instead of restarting as a
  reference index. Its sentence lengths and paragraph openings vary, while Quickstart keeps the
  shorter procedural voice. Homepage previews outcomes; Concepts owns the implementation-level
  connective explanation.

### Rejected or adapted

- **F2 exact replacement rejected:** “a crash resumes, not restarts” omits the durable-store
  condition and would turn a configured runtime behavior into an unconditional homepage claim.
- **F4 exact replacement rejected:** “the runtime resolves it” and “the saga store records” omit the
  required configured saga bus bridge, compensator, and durable store, contradicting verified
  `SagaEngine` and bus-bridge behavior.
- **F6 absolute wording rejected:** “decisions you cannot retrofit” overstates the locked
  “expensive to retrofit” argument; the revision keeps the cost claim without declaring
  impossibility.
- **F6 telemetry addition rejected:** the reviewed paragraph established only that logging can be
  added later; adding telemetry there would broaden the claim without source verification.
- **F15 exact compression adapted:** removing “validated data,” static CLI wiring, or separate
  Aspire resources would weaken existing technical claims, so those details remain in a less
  uniform paragraph shape.
- **Homepage exit-nav reorder rejected:** the proposed Why → Quickstart → Concepts sequence conflicts
  with the locked one-screen exit strip and its `Run it / Understand it / Decide whether it fits`
  destinations.

### Commits

- `5ceab35b4ab4c0a231835fdcf7045bb0c3cebed6` —
  `docs(site): sharpen the homepage proof arc`
- `7d2fc1a8ea96d9a965ea8b314d48123c92e8e9f3` —
  `docs(site): tighten the adoption argument`
- `3700253dc2de9e95f231f54318cdd387fb4f24cd` —
  `docs(site): clarify the quickstart path`
- `52a40fa0805986af9c0ab9514a7cd0f9849d80ea` —
  `docs(site): connect the five-layer concepts arc`

### Gates

| Gate | Result |
| --- | --- |
| `cd docs/site && deno task build` | PASS — exit 0; 595 files generated |
| `deno task docs:links` | PASS — 102 docs, 0 broken links, 0 broken anchors, 0 orphans |
| Hard-ban scan on the four pages | PASS |
| `git diff --check` before page commits | PASS |
| `deno.lock` hygiene | PASS — gate-added lock entry removed; worktree clean |

Prose-round head: `52a40fa0805986af9c0ab9514a7cd0f9849d80ea`. Explicit-refspec push
succeeded; the remote `docs/main-pages-revamp` branch resolves to the same commit.
