# Fork report: how-to (25 pages) + reference (30 pages) + MedusaJS quality bar

## Part A — MedusaJS rubric (from 3 fetched pages: `/learn/customization/custom-features/api-route`,
`/learn/fundamentals/api-routes`, plus search-confirmed structure of `/learn/customization/custom-features`)

- **Good tutorial balance ≈ 30-40% code / 60-70% prose**, where every code block carries its real
  file path as a comment (`src/api/admin/brands/route.ts`) and complete imports — never an
  unlabeled fragment. NetScript's how-to pages already do this consistently (file-path comments on
  nearly every fenced block sampled).
- **"Why before what," every section**: Medusa states the purpose of a construct (a middleware, a
  workflow step) in one sentence *before* the code that implements it, not after. This is the single
  clearest signal of "good" vs "thin" — a code block with no preceding rationale sentence is thin
  regardless of code completeness.
- **Reference pages are terse by design and cross-link outward** rather than re-explaining: Medusa's
  `/learn/fundamentals/api-routes` reference page is only ~25-30% code (mostly signatures + one
  minimal complete example), and defers depth to linked "Learn more" chapters. Applying this: a
  NetScript reference page should NOT be penalized for low code density, but SHOULD be flagged if it
  omits the one-sentence differentiator framing in its own lede — a reference page can still earn a
  showcase sentence without becoming a tutorial.
- **Rubric tiers**: *Good* = why-before-code + complete/runnable examples with real paths +
  outbound cross-links to deeper reference. *Thin* = code present but missing rationale sentences,
  OR fragments without file-path/import context, OR no outbound cross-link where one is warranted.
  *Missing* = no code where the topic clearly needs a runnable example, or a reference page with
  zero mention of the capability's differentiating angle.

## Part B — how-to pages (25 files, 6252 lines total)

No anti-pattern hits except one repeated across the site: `build-a-durable-chat.md:122` —
`` target: (req) => ({ sessionId: new URL(req.url).pathname.split('/').pop()! }), `` — the same
manual session-id extraction pattern found in `docs/site/ai/durable-chat.md:80` and
`tutorials/chat/02-durable-chat-route.md:121`. **Third occurrence of the identical anti-pattern
across the site** — strong signal this is one canonical snippet copy-pasted into three places, so
fixing it once and propagating is the efficient remediation, not three separate fixes.

Structural note: 10 of 26 content pages (add-a-task-runtime-adapter, build-a-server-validated-form,
build-a-validated-ingestion-queue, expose-openapi-scalar, graceful-shutdown,
publish-a-durable-stream, restrict-worker-task-permissions, roll-out-runtime-overrides,
run-a-polyglot-task, tune-worker-runtime) skip the bold **Goal:**/**Scope:** framing sentence that
the other 16 use consistently — most still open with a functional "Use X when Y" sentence (fine per
the rubric), so this is a minor consistency gap, not a why-before-what violation.

| Page | coverage | anti-pattern | code:prose (rubric tier) | showcase |
|---|---|---|---|---|
| index.md | good | good | n/a (hub) | thin |
| add-a-plugin.md | good | good | good | good — plugin capability framing is clear |
| add-a-service.md | good | good | good (22 fences, dense) | good |
| add-a-task-runtime-adapter.md | thin | good | thin — no Goal framing, 4 fences for 143 ln | thin |
| add-authentication.md | good | good | good | good — 14-provider preset list is differentiator-worthy and shown |
| add-opentelemetry.md | good | good | thin (4 fences / 282 ln, code-sparse for the topic) | thin — "zero-dep, opt-in" framing not repeated here despite being the telemetry pillar's headline claim |
| author-a-plugin.md | good | good | good | good |
| **build-a-durable-chat.md** | good | **anti-pattern (L122)** | good | good — durability framing strong, undercut by the one bad snippet |
| build-a-server-validated-form.md | good | good | thin — no Goal framing | thin |
| build-a-validated-ingestion-queue.md | good | good | good — "Use X when Y" opener is fine | thin |
| choose-a-queue-provider.md | good | good | good | good — decision-recipe framing (5 backends, when to pick each) is a strong differentiator page |
| customize-fresh-ui.md | good | good | thin (4 fences / 384 ln — very code-sparse for a "how to customize" recipe) | good — ties back to fresh-ui.md's copy-source pitch |
| database-migration.md | good | good | thin (4 fences / 258 ln) | thin |
| deno-lsp-code-intelligence.md | good | good | good (16 fences, dense) | good — LSP/agent-editability angle is differentiator-relevant and present |
| deploy-deno-deploy.md | good | good | thin (2 fences / 227 ln) | thin |
| deploy-local-aspire.md | good | good | good | good — cross-links explanation/aspire.md correctly (why) from a how-to (how) |
| deploy.md | good | good | good (14 fences, dense) | good |
| discover-services.md | good | good | good | good |
| expose-openapi-scalar.md | good | good | thin — no Goal framing, 4 fences/197 ln | thin |
| graceful-shutdown.md | good | good | thin — no Goal framing | thin |
| publish-a-durable-stream.md | good | good | good — "Use X when Y" opener | thin |
| queue-kv-cron.md | good | good | good (18 fences, dense) | good |
| restrict-worker-task-permissions.md | thin | good | thin — no Goal framing, 2 fences/90 ln (very sparse for a security-relevant recipe) | thin |
| roll-out-runtime-overrides.md | good | good | thin — no Goal framing | thin |
| run-a-polyglot-task.md | good | good | thin — no Goal framing, 4 fences/188 ln | good — polyglot-task differentiator is inherently showcased by the topic |
| tune-worker-runtime.md | good | good | thin — no Goal framing | thin |
| use-a-second-database.md | good | good | thin (2 fences / 268 ln) | thin |

## Part C — reference pages (30 files, 6321 lines total)

**Zero anti-pattern hits.** Reference pages are `deno doc`-generated tables (confirmed by their
consistent "This page is generated from the package's public surface with `deno doc`" lede) —
correctly terse per reference-doc norms. Scored only on axis 4 (differentiator lede) per the Part A
rubric; axes 1-3 are structurally "good" by construction for all 30.

| Page | showcase (lede states differentiator angle?) |
|---|---|
| ai/index.md | good |
| aspire/index.md | good |
| auth-better-auth/index.md | thin — mechanical description, no "why better-auth here" framing |
| auth-kv-oauth/index.md | thin |
| auth-workos/index.md | thin |
| auth/index.md | good |
| cli/index.md | good |
| config/index.md | good |
| **contracts/index.md** | thin — see web-layer fork report; doesn't state "typed contracts obviate manual req.json()/JSON.parse validation" even in one sentence |
| cron/index.md | thin |
| database/index.md | good |
| fresh-ui/index.md | good |
| fresh/index.md | good |
| index.md (reference hub) | good |
| kv/index.md | thin |
| logger/index.md | thin |
| plugin-ai-core/index.md | thin |
| plugin-ai/index.md | thin |
| plugin-auth-core/index.md | thin |
| plugin-auth/index.md | thin |
| plugin/index.md | good |
| prisma-adapter-mysql/index.md | thin |
| queue/index.md | thin |
| runtime-config/index.md | thin |
| sagas/index.md | good — cross-linked from durable-workflows/sagas.md's strong showcase, inherits the framing |
| **sdk/index.md** | thin — see web-layer fork report; `defineServices()` composition preset described mechanically, not as "one call wires your whole typed client+query stack" |
| service/index.md | good |
| streams/index.md | thin |
| telemetry/index.md + convention.md | thin |
| triggers/index.md | good |
| watchers/index.md | thin |
| workers/index.md | good |

Rationale for not penalizing "thin" reference pages harder: per the Part A rubric, low code density
and mechanical tone are *expected and correct* for `deno doc`-generated reference pages. The "thin"
mark here is specifically about the missing one-sentence differentiator lede, which is a genuinely
free addition (doesn't require becoming a tutorial) — most "good"-marked pages above already prove
it's possible to add without breaking the generated-reference format.

## Part D — 5 biggest gaps across how-to + reference

1. **The `new URL(req.url).pathname.split('/').pop()!` sessionId-extraction snippet appears
   identically in 3 places** (ai/durable-chat.md, tutorials/chat/02, how-to/build-a-durable-chat.md)
   — single highest-leverage fix in the entire audit: replace once, the fix propagates conceptually
   to all three call sites.
2. **10 of 26 how-to pages skip the "Goal:"/"Scope:" framing sentence** other how-to pages use —
   cheap structural consistency fix, not a content rewrite.
3. **contracts/index.md and sdk/index.md are the two most differentiator-critical reference pages
   in the entire site and both currently read as mechanical `deno doc` dumps** — these are the pages
   a reader lands on right after seeing "typed contracts" mentioned elsewhere; a one-sentence lede
   fix on each has outsized leverage.
4. **auth-better-auth / auth-kv-oauth / auth-workos reference pages don't explain why three auth
   backends exist or how to choose** (that reasoning lives correctly in
   `how-to/choose-a-queue-provider.md`'s queue equivalent, but there is no parallel
   `how-to/choose-an-auth-backend.md` — identity-access/auth.md covers backend selection at pillar
   level, but the reference pages themselves don't point back to it clearly).
5. **add-opentelemetry.md and telemetry/index.md are both code-sparse/mechanical for what should be
   a strong differentiator (zero-dep opt-in telemetry)** — the actual strong framing lives in
   `docs/site/explanation/observability.md` (per the pillars fork report) but isn't echoed at the
   how-to/reference layer where a reader doing the recipe would see it.

Report ends. Feeds parent's docs-audit-662 report; not a standalone deliverable.
