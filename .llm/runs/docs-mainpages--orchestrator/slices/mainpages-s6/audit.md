# S6 — closing opposite-family audit (Claude/Opus lane) — PR #1216 four main pages

Audited: worktree `/home/codex/repos/ns-mainpages`, branch `docs/main-pages-revamp`,
changeset `55aa37f81..a119599c5` (7 commits, 4 files: `docs/site/{index,why,quickstart,concepts}.vto`).

Prior cycle: `slices/mainpages-s2/review-opus.md` (FIX_FIRST — 3 blocking, 3 major, 7 minor);
fixes claimed in `slices/mainpages-s2/draft-report.md` §"Fix round 1".

**Verdict: PASS.**

**Provenance.** Every finding below was re-derived first-hand in this session: the snippet was
extracted from the `.vto` source and type-checked against the local package, the CLI command was
*executed* (dry-run and a real scaffold), and both build gates were re-run. Nothing is inherited
from the generator's fix report or from the S2 review's own citations.

---

## Gate 1 — Fix verification (blocking + major)

| ID | Finding | Verdict |
| --- | --- | --- |
| B1 | Saga snippet has no `.correlate(...)` | **FIXED** |
| B2 | "The runtime routes that cascade" overclaims wiring | **FIXED** |
| B3 | Quickstart non-deterministic on a TTY | **FIXED** |
| M1 | Bare `aspire stop` | **FIXED** |
| M2 | Dashboard login token omitted | **FIXED** |
| M3 | .NET dependency undisclosed; `--no-aspire` unnamed | **FIXED** |

### B1 — FIXED

`index.vto:36` now carries
`.correlate<CheckoutEvent>((event) => event.payload.orderId as SagaCorrelationKey)`.

Runtime semantics verified, not assumed. `SagaBuilderImpl.correlate` registers the rule with
`eventType: '*'` — `packages/plugin-sagas-core/src/builders/define-saga.ts:130-144`. The engine's
`resolveCorrelationKey` matches an exact-type rule first, then falls back to the `'*'` rule before
`message.correlationKey` and before the per-message-type fallback —
`src/runtime/saga-engine.ts:457-464`. So the single `'*'` rule applies to **both**
`payment.captured` and `inventory.failed`, both resolve to `orderId`, and
`resolveInstanceId` (`saga-engine.ts:439-444`) yields the same `checkout:<orderId>` instance for
both. The two halves of the page's story are now genuinely one saga instance.

Type-check evidence (snippet extracted programmatically from the `.vto` string literal, import
repointed at the local package root, checked in the worktree):

```
deno check --unstable-kv saga-snippet-audit.ts
Check saga-snippet-audit.ts
EXIT=0
```

The `as SagaCorrelationKey` cast is required, not sloppiness: the type is branded —
`src/domain/ids.ts:10-11` (`TId & { readonly __brand: 'SagaCorrelationKey' }`). It also matches the
repo's own published idiom at `docs/site/tutorials/storefront/04-checkout-saga.md:199-201`, and the
homepage version is the cleaner of the two (the typed generic removes the tutorial's second
`payload as {...}` cast).

### B2 — FIXED

Caption at `index.vto:40-47` now reads: *"Executing that request requires a saga bus bridge
configured with a compensator, while restart recovery requires a durable store; with that runtime
wiring, the registered compensation handler emits `payment.refund`."*

Each clause verified against source:

- **bus bridge, not engine.** `SagaEngine.dispatchCascaded` throws `notImplemented` for any kind
  other than `send` (`src/runtime/saga-engine.ts:119-124`); compensation dispatch exists only in
  `src/adapters/saga-bus-bridge.ts` (dispatch switch `:98`, `#compensate` → `compensateCascaded`
  `:209-213`).
- **"configured with a compensator"** is exact: `compensator?: SagaCompensator` is optional
  (`saga-bus-bridge.ts:36, 48, 59`) and `:194-196` throws
  `'compensation cascades require the compensator option.'`
- **"restart recovery requires a durable store"** is exact:
  `create-saga-runtime.ts:85-86` makes `store` optional and `warnStorelessNativeRuntime`
  (`:106-115`) logs `sagas.runtime.store_missing` — "Native saga runtime created without a durable
  SagaStorePort." The runtime works storeless; only recovery does not.

The caption now ends on the payoff (`payment.refund`) rather than on the disclaimer, which also
closes the related MINOR about the homepage's one persuasive peak ending on a hedge.

### B3 — FIXED, and verified by execution rather than by reading

`quickstart.vto:27` is now `netscript init my-app --db postgres --service --yes`, with `:30-32`
naming the two defaults the later steps depend on.

`--yes` is a real option (`packages/cli/src/public/features/init/init-command.ts:91`) and
short-circuits every prompt (`init-interactive.ts:23-28`). Undefined values then resolve from
`SCAFFOLD_DEFAULTS` at `validate-init.ts:85, 155-156` → `APP_NAME 'dashboard'`,
`CACHE_ENABLED true`, `CACHE_BACKEND 'redis'` (`scaffold-defaults.ts:8-12`).

I did not stop at source reading. Dry-run parse:

```
deno run -A --unstable-kv packages/cli/mod.ts init my-app --db postgres --service --yes --dry-run --json
{"project":{"name":"my-app","appName":"dashboard","database":"postgres"}, "aspire":{"enabled":true}, ...}
```

(confirms `--service` as a bare optional-boolean flag is not swallowed by the following `--yes`),
then a real scaffold to `/tmp/qs-audit` (`INIT_EXIT=0`), which proves every downstream claim on the
page:

- `apps/dashboard/routes/(_components)/home-view.tsx` **exists** → `quickstart.vto:56` path holds.
- `apps/dashboard/routes/index.tsx:12` emits `projectName: 'my-app'` into `<h1>{projectName}</h1>`
  (`home-view.tsx:27`) → `quickstart.vto:46` "heading should read `my-app`" holds.
- generated `appsettings.json` contains exactly `Apps/dashboard`, `Services/users`,
  `Databases/postgres`, `Cache/redis` → `quickstart.vto:44-46`'s four healthy resources
  ("Fresh app, example service, Postgres, and shared cache") is the precise resource set, not an
  approximation.
- The intro sentence is still wrapped in the *generated* file (lines 29-30, wrapping at a different
  column than the template) → `quickstart.vto:56` "the wrapped introductory sentence" is the right
  instruction, and the earlier MINOR is closed.

Temp scaffold removed after inspection.

### M1 — FIXED

`quickstart.vto:64-68` is now `aspire stop --apphost ./apphost.mts`, issued from `my-app/aspire`.
This matches `.agents/skills/aspire/SKILL.md:18` ("Stop the exact AppHost") and avoids the `--all`
mode the same skill records as silently ineffective (`:43`). The path resolves: the scaffolded
AppHost is at `aspire/apphost.mts` (`SCAFFOLD_DEFAULTS.ASPIRE_TS_APPHOST_PATH`), confirmed present
in the real scaffold, so `./apphost.mts` from the page's retained `cd my-app/aspire` is correct.

### M2 — FIXED

`quickstart.vto:44` now says "Use the dashboard URL **and one-time login token** printed by
`aspire start`", matching `docs/site/quickstart/aspire.md:28, 54`.

### M3 — FIXED

`quickstart.vto:13-15` now names the **.NET Aspire CLI** and links Microsoft's docs.
`why.vto:86-87` names it again and supplies the actionable escape hatch: `--no-aspire`, which is a
real flag (`init-command.ts:86`), plus what the application then owns.

---

## Gate 2 — Funnel / duplication

**PASS.**

- **Hard-ban scan** — `grep -nE "/capabilities/|:18888|enterprise-grade|blazing|seamless|
  cutting-edge|world-class|powerful|robust|#[0-9]{3,4}"` over the four pages: **no matches**
  (exit 1). Volatile-count scan (`[0-9]+\+? (packages|plugins|commands|components)`): **no matches**.
- **Outbound links** — 19 distinct targets, all internal ones inside the docs tree; no
  `/capabilities/`. The two external links are Deno and Microsoft Aspire docs. The one raw
  `href="/data-persistence/..."` (`quickstart.vto:50`) is **not** a defect: Lume's `basePath()`
  plugin (`docs/site/_config.ts:132`, `location` at `:52`) rewrites it — verified in the build
  output as `href="/netscript/data-persistence/how-to/database-migration/"`.
- **Backtracking closed.** `concepts.vto:12` now CTAs the Storefront tutorial instead of sending the
  reader backwards to `/why/`, and `index.vto`'s hero no longer duplicates the `/why/` CTA that the
  exit strip carries (`:52`). The exit strip's three doors are now three genuinely distinct next
  steps.
- **Observability duplication closed.** `index.vto:27` is re-angled to the operator outcome
  ("check resource health and follow logs and traces"); `concepts.vto:64-67` remains the sole owner
  of the service-discovery/OTLP injection mechanics. The near-verbatim clause is gone.

**Residual (advisory, not blocking):** the contract fact is still stated on two pages —
`index.vto:22` ("the same oRPC contract is implemented by the service, drives its OpenAPI document,
and types the SDK call a Fresh page loader makes") and `concepts.vto:21-23`. Unlike the OTLP case
these are pitched differently (one-line promise vs. mechanism with named symbols), which is the
promise-then-mechanism shape the funnel intends. Noted, not charged.

---

## Gate 3 — Build gates (run by me)

| Gate | Command | Result |
| --- | --- | --- |
| Site build | `cd docs/site && deno task build` | **PASS — exit 0**, "595 files generated in 18.23 seconds" |
| Link/anchor/orphan | `deno task docs:links` | **PASS — exit 0**, `docs=102 broken-links=0 broken-anchors=0 orphans=0` |
| Snippet type-check | `deno check --unstable-kv` on the extracted `index.vto` snippet | **PASS — exit 0** |
| CLI command parse | `netscript init … --dry-run --json` | **PASS — exit 0**, appName `dashboard`, db `postgres` |
| CLI real scaffold | `netscript init … --no-git --path /tmp/qs-audit` | **PASS — exit 0**, all four documented resources present |

---

## Gate 4 — Prose

**PASS with four advisory polish items.** None is a correctness or funnel defect; none blocks merge.
The dominant voice is authored, not generated — `why.vto:22` ("a dozen libraries that have never
met"), `why.vto:37` ("We didn't invent new primitives"), `concepts.vto:42` ("The host is empty;
plugins fill it") are the register the rest of the set should be measured against.

1. **`quickstart.vto:36`** — "**This is the step that actually starts your stack.**" `actually` is
   filler emphasis, and bolding the whole sentence shouts. Proposed: "**Nothing runs until this
   step.**"
2. **`index.vto:26-27`** — the title promises "One command starts the traced fleet" but the body
   never names a command, and "starts the generated resource graph **together**" leaves *together*
   dangling. Proposed body: "One command starts the whole generated resource graph; Aspire's
   dashboard then reports resource health and carries logs and traces across it."
3. **`index.vto:41-45`** — the caption is now technically exact but packs three conditions into one
   ~45-word sentence at the page's only code moment. Proposed split, same claims:
   "…its handler returns a compensation request for `payment.captured`. Executing that request needs
   a saga bus bridge with a compensator; surviving a restart needs a durable store. With that wiring,
   the registered handler emits `payment.refund`."
4. **`concepts.vto:9`** — the subhead is four semicolon-joined clauses mirroring the five headings
   below it, which reads as a generated table of contents. Proposed: "Contracts define the
   boundaries. Everything else — services, plugin runtimes, the web layer, the observed resource
   graph — carries them somewhere."

---

## Dimension summary

- **Spec compliance:** clean. Locked heroes intact (`index.vto:7`, `why.vto:8`), one-screen homepage
  budget honored (54 lines: hero, three proof points, one code moment, caption, exit strip), ban
  list clear, funnel now forward-only.
- **Technical truth:** this was the failing dimension in S2 and it is now the strongest. Every
  load-bearing claim on the homepage snippet and the quickstart path was re-derived from source and,
  for the quickstart, from an actual scaffold run. The caption's three hedges are each traceable to
  a specific throw or warn in the runtime.
- **Reader experience:** each page does one job, no page repeats another's core fact except the
  contract promise/mechanism pair, and the persuasive peak now ends on the payoff.

## Verdict

**PASS.** All three blocking and all three major findings from `review-opus.md` are fixed and
independently verified; the six minors the fix round claimed are confirmed closed. Both build gates
are green. The four Gate-4 prose items are optional polish and may be applied in a follow-up commit
or dropped without affecting the merge decision.
