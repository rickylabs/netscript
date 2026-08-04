# S2 adversarial review (Opus) — four main pages

Reviewed: `docs/main-pages-revamp` @ `a7a09c54c` in worktree `/home/codex/repos/ns-mainpages`
(commits `bc0b32415`, `1dbdd44a8`, `9de02346c`, `a7a09c54c`).
Binding spec: `slices/mainpages-s1/synthesis.md`. Claims under test: `slices/mainpages-s2/draft-report.md`.

**Verdict: FIX_FIRST** — 3 blocking, 3 major, 6 minor.

Line references are to the `.vto` sources in `/home/codex/repos/ns-mainpages/docs/site/`;
package references are to the same worktree.

---

## Gate re-verification (independent, not taken from the draft report)

| Gate | Draft claim | My result |
| --- | --- | --- |
| `cd docs/site && deno task build` | PASS, 595 files | **PASS — exit 0, 595 files in 18.62s** (re-run by me) |
| Hard-ban scan (`/capabilities/`, `:18888`, `enterprise-grade`, unearned adjectives, issue refs) | PASS | **PASS** — grep over the four pages returns nothing |
| Internal links resolve | PASS | **PASS** — all 13 distinct internal targets exist in `_site/` |
| `{{ releaseSpecifier }}` renders | implied | **PASS** — `why.vto:85` renders `<code>@0.0.4</code>`; `quickstart.vto:21` renders `jsr:@netscript/cli@0.0.4` |
| Locked heroes verbatim | claimed | **PASS** — `index.vto:7`, `why.vto:8` match S1 §"Arbitrated decisions" word for word |
| One-screen homepage budget (hero + 3 proof + 1 code + exit) | claimed | **PASS structurally** — `index.vto` is 54 lines, exactly those five blocks, no grids |

The gates are honest. The failures below are all in dimension 2 (technical truth) and dimension 3
(reader experience), which the gates cannot see.

---

## BLOCKING

### B1 — The homepage saga has no `.correlate(...)`, so the failure path never reaches the state the caption implies

`index.vto:37` (snippet), caption at `index.vto:42-46`.

`resolveCorrelationKey` resolves in order: a `correlations` rule for the message type, a `'*'` rule,
`message.correlationKey`, then the fallback `` `${definition.id}:${message.type}` `` —
`packages/plugin-sagas-core/src/runtime/saga-engine.ts:456-464`. The instance id is
`` `${sagaId}:${correlationKey}` `` (`saga-engine.ts:439-444`).

With no `.correlate(...)` and no `correlationKey` on the published messages, `payment.captured` and
`inventory.failed` derive **different correlation keys → different instance ids → different state**.
The `status: 'paid'` written by the first handler is invisible to the failure handler; the two halves
of the story the page tells are not the same saga instance.

This is exactly the failure S1 §7 item 3 legislated against: *"the snippet must genuinely exercise the
behavior its caption claims."* It is also contradicted by the page's own downstream doc, which teaches
`.correlate()` as a required link in the chain:
`docs/site/tutorials/storefront/04-checkout-saga.md:199` (`.correlate((message) => …payload.orderId)`)
and `:409` ("built with `defineSaga().state().correlate().on().build()`"), plus
`docs/site/durable-workflows/sagas.md:204`.

**Fix:** add `.correlate((message) => message.payload.orderId)` to the snippet. It costs one line and
is the line that makes the example true.

### B2 — "The runtime routes that cascade to the matching compensation handler" is not true of the runtime the snippet imports

`index.vto:43-44`.

- `SagaEngine.handle` returns cascaded effects but never acts on them
  (`packages/plugin-sagas-core/src/runtime/saga-engine.ts:280-317`).
- `SagaEngine.dispatchCascaded` **throws `SAGA_NOT_IMPLEMENTED` for any kind other than `send`** —
  `saga-engine.ts:119-132`. A `compensate` cascade dies there.
- Compensation dispatch exists only in the bus bridge:
  `src/adapters/saga-bus-bridge.ts:160-177` → `#compensate` at `:190-227` →
  `compensator.compensateCascaded(...)` at `:211-216`.
- The bridge **throws unless a `compensator` is supplied** (`saga-bus-bridge.ts:194-198`), and
  `createSagaRuntime` passes one through only if the caller provides it — it is *not* defaulted
  (`src/runtime/create-saga-runtime.ts:99`).

The caption already carries one honest hedge (the store), so the omission reads as selective: the
sentence names the store as configuration-dependent while asserting the compensation routing as
automatic, when routing is the *more* configuration-dependent of the two.

Verified correct in the snippet, for the record: `sagaCompensate(message, reason)` arg order
(`src/public/messages.ts:98-107`), and the compensate handler does receive the message passed to
`sagaCompensate` as `event` (`src/runtime/saga-compensator.ts:57, 83, 103-115`). The draft report's
type-check claim also holds — the snippet checks clean under a strict config.

**Fix:** one clause — e.g. "wired through the saga bus with a compensator, the runtime routes that
cascade…" — or link the caption's "durability model" phrase to the runtime-wiring page.

### B3 — A reader following the quickstart verbatim on a TTY lands in a different workspace than the one steps 3 and 4 describe

`quickstart.vto:27` (`netscript init my-app --db postgres --service`), `:31`
("Accept the remaining defaults if the CLI prompts for them"), `:43`, `:55`.

On a TTY without `--yes`/`--ci`, `resolveInteractiveInitInput` **always** prompts, because the
relevant options are undefined:

- frontend application name — `packages/cli/src/public/features/init/init-interactive.ts:43-45`
  (default `dashboard`)
- shared cache + cache backend — `init-interactive.ts:46-55` (defaults `true` / `redis`)

So the two later claims are conditional on prompt answers the page treats as given:
`apps/dashboard/routes/(_components)/home-view.tsx` (`:55`) holds only if the app-name prompt is
accepted unchanged, and "shared cache report healthy" (`:43`) only if the cache prompt is accepted.
"Accept the remaining defaults **if** the CLI prompts" is too weak — the prompts are guaranteed, and
one wrong keystroke breaks step 4's path with no diagnostic.

The page's stated contract is "a path, not a tour" (S1). A path must be deterministic.

**Fix:** `netscript init my-app --db postgres --service --yes` (or `--app-name dashboard`), and drop
the conditional "if".

---

## MAJOR

### M1 — `aspire stop` in the bare form contradicts this repo's own doctrine

`quickstart.vto:63-67`.

`.agents/skills/aspire/SKILL.md:18,43` prescribes `aspire stop --apphost <exact-AppHost-path>` and
records that the host-wide mode reported `No running AppHost found`, **exited 0, and left processes
alive**. The quickstart's last instruction is therefore the one most likely to silently fail, on the
page whose whole job is "it works." Same guidance in
`.agents/generated/consumer-skills/.claude/skills/help.md:41,52`.

**Fix:** `aspire stop --apphost ./apphost.mts`.

### M2 — The dashboard login token is omitted

`quickstart.vto:43` ("Use the dashboard URL printed by `aspire start`").

`docs/site/quickstart/aspire.md:53-54` says the reader must **paste a one-time login token** that
`aspire start` prints. A first-time reader following the new page hits an unexplained auth screen at
the exact moment of first success. This is a one-clause omission with disproportionate cost.

### M3 — The .NET dependency is never disclosed on any of the four pages, and the opt-out is not actionable

`why.vto:86-87`, `quickstart.vto:12-16`.

The locked decision keeps an "honest trade-offs" section. The single largest adoption objection —
Aspire is an **external .NET tool** — appears nowhere: the quickstart prerequisites say "Aspire CLI"
(`:14`), and the why trade-off says only "Aspire is the default orchestration path." The prior page
stated it plainly, and the deep page still does (`docs/site/quickstart/aspire.md:36` ".NET Aspire
CLI"). Softening it on the page whose job is *choose it* reads as the one place the rewrite flinched.

Compounding it: `why.vto:87` says "You can opt out" without naming `--no-aspire`
(`docs/site/explanation/aspire.md:456-473`), so the escape hatch is an assertion the reader cannot
act on from the page that makes it.

**Fix:** say ".NET Aspire CLI" in both places, and name `--no-aspire` once in the why trade-off.

---

## MINOR

- **Step-4 target is a wrapped three-line sentence.** `quickstart.vto:55-58` says "find the
  introductory sentence that starts with `A generated NetScript workspace`". In the template it spans
  three source lines inside `<p class='ns-lede'>` —
  `packages/cli/src/kernel/assets/app/routes/(_components)/home-view.tsx.template:29-32`. A reader
  searching for a one-line sentence will miss it. Quote the three lines, or say "the wrapped sentence".
- **Funnel backtracking.** S1 §7 item 1 says "no backtracking". `concepts.vto:12` sends the reader
  from *understand it* back to `/why/` (*choose it*), and `index.vto:53` repeats `/why/` in the exit
  strip when the hero already CTAs it at `:11`. The exit strip then has only two genuinely new doors.
- **Cross-page duplication of a core fact.** `index.vto:28` ("Aspire starts the generated resource
  graph and injects service discovery and OTLP settings") vs `concepts.vto:64-67` (same fact, same
  order, near-identical clause). Likewise `index.vto:23` (contract → service → OpenAPI → SDK) vs
  `concepts.vto:20-23`. Defensible as promise-then-mechanism, but the OTLP sentence in particular is
  close to verbatim and should be re-angled on one of the two pages.
- **The homepage's single code moment ends on a disclaimer.** `index.vto:45-46` spends the caption's
  final clause on what the snippet does *not* do. Honesty is right; placing it last, at the page's
  only persuasive peak, is not. Move the hedge mid-caption and end on the refund.
- **Unstyled raw HTML on the homepage.** `index.vto:41-54` — the caption `<p>` and exit `<nav>` carry
  no `ns-*` class, unlike every component-rendered block above them. Renders fine; inconsistent with
  the site's component vocabulary.
- **Cross-doc inconsistency (not this PR's defect, worth filing).**
  `docs/site/tutorials/storefront/04-checkout-saga.md:91` describes `.compensate(type)` as
  "Registers a handler for a FAILED event type", while the compensator keys the lookup on the
  **compensated** message's type (`src/runtime/saga-compensator.ts:57`). The homepage snippet matches
  the source; the tutorial prose is the one that drifts.

---

## Dimension summary

- **Spec compliance:** strong. Heroes verbatim, one-screen budget honored literally, CRUD gone,
  ban list clean, kill list executed. Two soft breaches: funnel backtracking and one near-verbatim
  duplicated fact (both MINOR).
- **Technical truth:** the weak dimension. The homepage's flagship snippet does not do what its
  caption says on two independent axes (B1 correlation, B2 compensation wiring), and the quickstart's
  determinism depends on unmentioned interactive prompts (B3). Every `why.vto` comparison cell,
  by contrast, is repo-supportable — verified `packages/service` on Hono
  (`packages/service/deno.json:19`), `packages/fresh` on Fresh 2 (`packages/fresh/deno.json:37`),
  `packages/aspire` as the adapter, and sagas' `ports/`, `transports/`, `adapters/`, and
  `stores/` directories backing the Temporal row.
- **Reader experience:** each page does its one job, and the prose is materially better than what it
  replaced — `why.vto` in particular ("unrelated tools pretending to be one system", "We didn't invent
  new primitives") reads authored, not generated. `concepts.vto` successfully absorbs the homepage's
  architecture exposition and adds the missing web layer. The generic-flavored residue is thin: the
  three homepage proof bodies are dense-but-earned. Nothing load-bearing was dropped except the .NET
  disclosure (M3) and the non-interactive flags (B3).

## Blocking list for FIX_FIRST

1. **B1** — add `.correlate(...)` to the homepage saga snippet (`index.vto:37`).
2. **B2** — qualify the compensation-routing claim in the caption (`index.vto:43-44`).
3. **B3** — make step 2 non-interactive (`--yes`) or bind the app name (`quickstart.vto:27,31`).

M1–M3 should land in the same fix pass; they are one clause each.
