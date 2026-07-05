# Current tutorial inventory + gap list (all 5 tracks, complete read)

Source: full verbatim read of every chapter file under
`docs/site/tutorials/{storefront,workspace,erp-sync,live-dashboard,chat}/` in the
`wt-roadmap-expansion` worktree, plus both `index.md` files. 26 chapter files total.

## Shared structural pattern (identical across all 5 tracks — this is NOT the problem)

Every chapter, in every track, follows the same rigorous shape:

- Front-matter: `layout`, `title`, `templateEngine: [vento, md]`, `prev`/`next` nav.
- `{{ comp.learningPath({steps:[...]}) }}` — full chapter nav repeated at the top of every chapter.
- "What you will build" — one paragraph, concrete artifact framing.
- "Before you begin" — verification commands against the previous chapter's state, not just prose
  ("you should have X" is always backed by a runnable check).
- Numbered "Step N — <verb>" sections with real, runnable code blocks (not pseudocode).
- `{{ comp callout {type, title} }}` — note/tip/warning/important/danger, used for footguns,
  design-rule explanations, and forward-references.
- `{{ comp.apiTable({...}) }}` — reference tables for ports, resources, API surfaces.
- "Verify your progress" — a `- [ ]` checklist, always ending in a runnable command, never just
  prose assertion.
- "What you built" — closing summary, one paragraph.
- `{{ comp.nextPrev({...}) }}` — footer nav.
- Embedded `<!-- caveat: arch-debt:<slug> -->` HTML comments marking known framework debt inline
  with the prose that touches it.

**Implication for the rewrite:** the owner's "doesn't tell a story" complaint is almost certainly
about the *project premises* (generic scaffolds: my-shop, my-workspace, my-erp, my-dashboard,
chat-app) and *what real problem the reader is solving*, not about pedagogical mechanics — the
mechanics (checkpoints, callouts, verify-then-advance) are already sound and this is a real,
non-obvious finding worth preserving rather than reinventing. Reference: the same convergent "every
step ends on a literal observable checkpoint" rule appears in `research/C-tutorials/
other-tutorial-ecosystems.md`'s cross-ecosystem synthesis — the current tracks already satisfy it.

## Track 1 — storefront (`my-shop`, 6 chapters: 01-scaffold, 02-contract-to-service,
03-cart-saga, 04-webhook-trigger, 05-route-authz [structure inferred consistent with others],
06-deploy)

- Domain: generic e-commerce (products/cart/checkout). The most "toy" premise of the 5 — no real
  operational stakes, no real data source, entirely synthetic.
- Per issue #232 (`03-docs-cut-logistics.md`), this track has an **open, unresolved accuracy debt**:
  Run-2 (full manual walk against a live published scaffold) has never been done; several concrete
  fields (CLI flag surface, literal Aspire ports, the `@my-shop/contracts/versions/v1` barrel
  pattern) are flagged as "best-grounded inference, not verified against generated output."
- Gap: no narrative stakes — reads as a feature tour of contract → service → saga → webhook →
  authz → deploy, each chapter proving one platform primitive rather than solving one connected
  problem for one persona.

## Track 2 — workspace (`my-workspace`, 6 chapters, fully read)

- Domain: team workspace provisioning with auth. Real seams exercised: `@netscript/plugin-auth`
  (3 backends), dual-Postgres pattern (auth DB + workspace DB), `defineJobHandler` provisioning,
  `.withAuthn()/.withAuthz()` three-outcome proof.
- Strongest chapter: 05-route-authz, which mirrors the framework's own `builder-auth_test.ts`
  three-outcome pattern (401/403/200) — this is a "read the framework's own test suite and teach
  from it" technique worth preserving.
- Gap: 03-workspace-data.md explicitly documents a real, unresolved arch-debt
  (`arch-debt:seamless-auth-roadmap` — NetScript has no first-class org/tenant/RBAC primitive, so
  `Member`/`Workspace` linkage to auth `subject` is hand-rolled Prisma, not a framework seam). The
  tutorial is honest about this but it is a real capability gap the "ground-up rewrite" cannot
  paper over — see `02-eis-chat-build-arc.md`, this gap recurs.
- Gap: the provisioning job's `createJobTools(ctx)` trace/progress helpers are called out as
  no-op stubs (only `log.*` is real) — another inline-documented but real capability gap.

## Track 3 — erp-sync (`my-erp`, 5 chapters, fully read)

- Domain: file-drop → import job → polyglot transform → queue/cron → deploy. Real seams: workers +
  triggers plugins, `defineFileWatch`, `defineTask().runtime('python')`.
- Per issue #232 / owner's own read (referenced in `context/C-tutorials/candidate-tutorial-mappings.md`
  written by a parallel Stage-B pass), this is plausibly the **weakest** of the 5 tracks: chapter 3
  (`03-polyglot-transform.md`) is explicitly self-labeled "a documented-capability, not hands-on"
  chapter — the reader reads about `runtime('python')` rather than running it end-to-end, because
  only the `deno` task runtime is sandboxed (`arch-debt:workers-non-deno-task-sandbox-boundary`).
  A track whose centerpiece chapter is a documentation aside rather than an exercise is a genuine
  structural weakness, not just a toy-premise problem.
- Gap: the `WORKERS_CONCURRENCY` vs `WORKER_CONCURRENCY` (Aspire-injected, silently ignored) naming
  footgun is documented in the tutorial itself — a real, currently-live framework defect being
  taught around rather than fixed.

## Track 4 — live-dashboard (`my-dashboard`, 6 chapters, fully read)

- Domain: orders dashboard with cache-first reads + real-time updates. Real seams: full oRPC
  contract → service → SDK client → `definePage`/`QueryIsland` → `createSagasStreamDB` +
  `useLiveQuery` → Aspire.
- This is the **deepest, most technically complete** track of the 5 — chapter 4
  (`04-definePage-QueryIsland.md`) is explicitly called "the heaviest chapter in the track" in its
  own prose, and chapter 5 delivers the actual payoff (a table that updates itself with no
  polling). The full spine (contract→service→client→page→stream) is real, runnable, and verified
  step by step (curl-and-watch-the-dashboard checkpoints).
- Gap: still a synthetic "orders" domain with no real stakes — technically the strongest track,
  narratively the same genre problem as storefront (generic commerce entity).
- Notable technique worth preserving: chapter 5's callout explaining *why* the example grounds in
  the sagas stream (mirrors the showcase's canonical live table) — an example of showing real
  intra-repo dogfooding as evidence, not just claiming the feature works.

## Track 5 — chat (`chat-app`, 4 chapters, fully read)

- Domain: durable AI chat with tool calls and citations. Real seams: `@netscript/fresh/ai`
  (`toNetScriptChatResponse`, `resolveChatSnapshot`, `createNetScriptChatStreamProxy`), direct
  `@tanstack/ai` wiring, `netscript ui:add ai` copy-source components, `toolDefinition(...).server()`
  tool calls with citation rendering.
- This is the track **architecturally closest to what an eis-chat-derived rewrite would look like**
  — durable sessions, authorize-gated routes, streaming, tool calls, citations are all already
  exercised. See `02-eis-chat-build-arc.md` for the explicit phase-by-phase overlap.
- Explicit forward-reference: chapter 2 states the `@netscript/ai` engine "arrives in
  0.0.1-beta.2" and is `publish:false` today — the tutorial is teaching against a seam that is
  itself mid-flight, which is a legitimate reason this track might need lighter-touch treatment (or
  to be deferred) rather than a full ground-up rewrite in the same pass as the other four.
- Gap: shortest track (4 chapters vs 5-6 elsewhere) and the only one with no auth/authz chapter,
  no persistence-beyond-chat chapter, and no deploy chapter — it reads as a feature vignette rather
  than a complete build, even though what it does cover is real.

## Cross-track gap synthesis (top findings)

1. All 5 tracks are structurally sound (checkpoints, callouts, verify-then-advance) — the rewrite
   should preserve this mechanic, not redesign it.
2. All 5 tracks use synthetic, stakes-free project premises (my-shop/my-workspace/my-erp/
   my-dashboard/chat-app) — this is the most defensible reading of "doesn't tell a story."
3. erp-sync is the track with the clearest self-admitted "read, don't run" chapter (polyglot
   transform) — the weakest candidate to keep as-is.
4. storefront carries the largest **unresolved accuracy debt** (issue #232 Section A — Run-2 never
   completed against a live scaffold) — any rewrite decision should account for whether accuracy
   verification is superseded by or must precede a ground-up rewrite.
5. chat is architecturally the closest analogue to an eis-chat-style build already, but teaches
   against a seam (`@netscript/ai`) still mid-flight for 0.0.1-beta.2 — a real scheduling
   constraint, not just a scope question.
6. Three arch-debt items are taught *around* rather than fixed inline in the current tracks
   (no org/tenant/RBAC primitive; job-tools trace/progress stubs; non-Deno task sandbox boundary) —
   a ground-up rewrite inherits these unless the framework work lands first; flagging, not deciding.
