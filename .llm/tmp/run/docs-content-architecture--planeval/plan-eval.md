# PLAN-EVAL Verdict — NetScript docs content-architecture rebuild

- **PR / branch / tip:** PR #59 · `docs/content-architecture` · `0aa65579`
- **Evaluator session:** Minimax-M3, OpenHands (separate from the supervisor / generator)
- **Run:** `openhands/pr-59/run-27795772956-1`
- **Files evaluated (primary):** `docs/site/_plan/09-research-integration.md`, `briefs/00-INDEX.md`, `briefs/phase-1-front-door.md`, `08-decisions-locked.md`, `00–07`
- **Spot-checks performed (`deno doc` ≤ 5):** `@netscript/sdk`, `@netscript/service`, `@netscript/contracts`, `@netscript/kv`, `@netscript/queue`, `@netscript/fresh-ui`, `@netscript/aspire`, `@netscript/cli` (init flags), `@netscript/watchers` (mod.ts + README + `deno.json`)

## VERDICT (front-loaded)

**`PLAN-EVAL: FAIL_PLAN`** — three blocking gaps must close before any authoring slice is dispatched. One is an accuracy gap that the dispatch itself inherits, one is an enforcement gap (accuracy guardrail is policy-only, not a gate), and one is a coverage gap that violates the user north-star ("EVERY public capability gets a reachable, intent-named home").

### Blocking gaps (must close before `PASS`)

| # | Gap | Where | Required fix |
| - | --- | ----- | ------------ |
| B1 | **Watchers is misclassified as internal/dev-tooling** in the dispatch map. `@netscript/watchers` is a fully publish-configured, README-instrumented, JSR-installable package with a real public surface (`createWatcher`, `FileWatcher`, stability/polling/stop semantics). The 21-package inventory in `09 §2a` correctly lists it, but `briefs/00-INDEX.md §Phase 3` ("Coverage check vs `09 §2a`") explicitly excludes watchers from every hub cluster and says "fold a one-line mention into the relevant concept or omit from the public hubs; flag for PLAN-EVAL whether `watchers` warrants public surface." This contradicts the north-star and contradicts `09 §2a`. | `briefs/00-INDEX.md` Phase-3 hub list | Add a 10th capability hub **"File watching & ingestion"** (units: `@netscript/watchers`) or merge it explicitly into an existing hub with a labelled cluster card; remove the "internal/dev-tooling" framing. The supervisor's surface check (`09 §2a`) is binding. |
| B2 | **Accuracy guardrail is unenforceable per-brief.** `09 §2c` states "every NetScript API symbol, adapter name, provider list, and signature in authored docs MUST be verified against `deno doc`" and the INDEX echoes it as Global Acceptance Bar #1. But there is no gate, no scripted check, no pre-merge `deno doc` invocation, and no per-page worklog discipline. As policy, it's a wish. | `09 §2c`, `briefs/00-INDEX.md` "Global acceptance bar", missing | Either (a) name a gate script (e.g. `.llm/tools/docs/api-cite.ts` that cross-checks every `import { … } from '@netscript/…'` against `deno doc --json` and fails the PR if a symbol is unknown), or (b) at minimum, add a per-page worklog row in `docs/site/_plan/worklog/` with the exact `deno doc` command + commit sha run, before each page merge. "Verify via `deno doc`" without an artifact is not a guardrail. |
| B3 | **Phase sequencing carries too much in Phase 0** (component layer + nav + Shiki + toc + sitemap + callout shim + `comp.breadcrumb` + `comp.nextPrev`). That is at least 4 distinct deliverables and 1 engine-config slice interleaved, with Phase-1 `.vto` pages blocked on the whole bundle. Risk of a long Phase-0 wedge that delays the highest-ROI front-door pages. | `briefs/00-INDEX.md` Phase 0 row + `05` build-migration | Split into Phase 0a (components + nav + breadcrumb/nextPrev only — shippable to Pages as a chrome-only preview) and Phase 0b (engine: Shiki, toc, sitemap, callout shim). Phase 1 prose can ship against Phase 0a without waiting on engine work. The brief already notes "prose Markdown pages can begin in parallel with the Phase-0 component build" — formalize 0a/0b. |

### Non-blocking recommendations (should address before/during authoring; not gate-blocking)

- R1. **D-E2 Shiki hand-wavy.** Recommend adopting with one explicit compatibility-check step (Shiki × pagefind × base_path × theme tokens) before locking. If it breaks the chrome, Prism fallback is fine — but "verify it composes" must be a Phase-0b acceptance line, not prose.
- R2. **D-E3 toc / D-E4 sitemap** — agree, adopt. D-E5 (auto-cards from `search.ts`) — agree, defer; the manual `comp.featureGrid` already covers Phase 1–3.
- R3. **D-E1 hybrid (curated navSections + `nav.ts` for Reference)** — agree. Explicit caveat: `nav.ts` must NOT be enabled globally, only Reference sub-tree, or it will fight the locked capability-hub ladder ordering.
- R4. **`watchers` is the canonical example for the accuracy-guardrail gap (B2).** Once B1/B2 close, `@netscript/watchers` becomes a worked example of "verify every adapter via `deno doc`."
- R5. **`Aspire` ("SDK-neutral Aspire diagnostics … TypeScript AppHost generation")** is mis-framed in some prose snippets as "Aspire orchestration." It's *not* the .NET Aspire runtime — it's a TypeScript package that inspects AppHosts and emits diagnostics. The "Aspire as USP + `--no-aspire`" framing in the brief is correct (the CLI flag is real and verified), but the hero copy must use the precise framing (`inspectAspire`, AppHost generation) to avoid misleading engineers who arrive expecting a polyglot orchestrator. Author-time check: every "Aspire" mention on the landing and Aspire concept page must pass a "would a platform engineer confuse this with .NET Aspire the orchestrator?" sniff test.

---

## Per-challenge findings (1–7)

### 1. Five engine decisions (`09 §3`)

| ID | Plan call | Verdict | Rationale |
| -- | --------- | ------- | --------- |
| D-E1 | Hybrid: keep curated `navSections` for top-level ladder; `nav.ts` only for Reference sub-tree | **AGREE**, with caveat | `nav.ts` derives from folder structure and cannot infer intent-ordering ("Start here → Learn → Capabilities"). Letting it anywhere except the Reference lane (which is itself out of scope and already auto-rendered) would invert the locked learning curve. Caveat must be explicit in the implementation brief. |
| D-E2 | Adopt Shiki | **AGREE-WITH-CONDITION** — not hand-wavy, but the condition must be a Phase-0b acceptance line | The "verify it composes with pagefind + base_path + anti-flash theme" sentence is fine as a guardrail *if* it ships as a documented acceptance line. Right now it's prose-as-safeguard; promote to a slice acceptance criterion (`05` build-migration) before authorizing the config change. |
| D-E3 | Adopt TOC plugin | **AGREE** | Pure additive win. Low risk. No caveat. |
| D-E4 | Adopt sitemap | **AGREE** | Cheap, free SEO. Caveat: confirm `base_path` correctness in emitted URLs (repo hosts at `rickylabs.github.io/netscript`). |
| D-E5 | Defer auto-cards to wave 2 | **AGREE** | `comp.featureGrid`/`comp.card` already cover Phase 1–3 manually; auto-cards only make sense after taxonomy/front-matter tags stabilize. |

**Adjudication summary:** 4-of-5 adopt; D-E2 needs a Phase-0b acceptance line. D-E5 defer is correct. None of these is a `FAIL_PLAN` blocker in isolation, but together with B3 (Phase 0 sequencing) they justify the split.

### 2. Full feature-landscape coverage (user north-star)

The dispatch map (`briefs/00-INDEX.md` §Phase 3) claims coverage of "all 21 packages + 4 plugins" but its own footnote admits watchers is excluded. Verified via `deno doc` + README + `deno.json`:

- `@netscript/sdk` (`defineServices`, `createServiceClient`, TanStack query, OpenAPI) — covered in "Services & contracts" hub. ✅
- `@netscript/service` (`defineService`, `createService`, Hono + oRPC) — covered. ✅
- `@netscript/contracts` (`baseContract`, schemas) — covered. ✅
- `@netscript/aspire` (`inspectAspire`, TS AppHost helpers) — folded into "Concepts" row but no dedicated hub. ⚠️ Acceptable as a concept page, but the Phase-1 front-door brief is loud on Aspire as USP — it deserves a first-class concept page (already in the 4-concepts list). ✅
- `@netscript/queue` (`createQueue`, `createTypedQueue`; adapters: Deno KV, Redis, RabbitMQ — verified, NOT Nitro as the prose speculated) — covered in "KV, queues & cron" hub. ⚠️ The supervisor's research prose ("KV provider matrix may include Nitro") is **wrong** for queue — Nitro is not a queue adapter. The provider list is Deno KV + Redis + RabbitMQ. This is a `09 §2b` accuracy nit that should be tightened at authoring time (B2 below).
- `@netscript/kv` (adapters: Deno KV + Redis + memory — verified, NOT Nitro) — covered. ⚠️ Same Nitro nit. Adapters are `deno-kv`, `redis`, `memory` (kvdex/denokv-bridge are helpers, not adapters). B2 guardrail will catch this at authoring.
- `@netscript/watchers` (`createWatcher`, `FileWatcher`, polling/stability/stop) — **NOT covered**. ❌ **This is B1, the headline blocker.** A package with a README quick-example, `createWatcher`/`FileWatcher` public API, JSR install path, and a publish-configured `deno.json` is not "internal/dev-tooling." It's a published surface waiting for a hub.
- `@netscript/cli` (`--no-aspire`, `--dry-run`, scaffold pipeline) — addressed across tutorials + Phase 4 how-to. ✅
- `@netscript/cron`, `@netscript/database`, `@netscript/prisma-adapter-mysql`, `@netscript/logger`, `@netscript/telemetry`, `@netscript/fresh-ui`, `@netscript/fresh`, `@netscript/config`, `@netscript/runtime-config`, plugins (`sagas/streams/triggers/workers` + their `-core` siblings), `@netscript/plugin` — all reachable via hubs/concepts. ✅

**Net:** the watchers omission is the one true coverage hole. Everything else is reachable.

### 3. Adoption bar vs Laravel/Medusa/TanStack/Astro/Lume

`09 §5` assigns an exemplar to each lane. Walking the assignments:

- **Landing (Astro, Encore)** — Astro exemplar is solid (warm progressive front door). Encore's "scaffold→infra visualization" is a *static file-tree + flow* per the brief (no GIF in wave 1). **Match**, not beat. To beat: include an actual *rendered* scaffold-tree component (not a static image) that reflects a real `netscript init` output, with link-out to each generated file's doc page.
- **Why NetScript (TanStack motivation)** — TanStack's "the problem is hard, here's the working code" is the right north star. **Match**, not beat. To beat: the three code proofs (contract→client type flow, saga state machine, traced handler) must be **annotated**, not just shown — i.e. a one-line "this line replaced `X` boilerplate" beside each proof.
- **Quickstart (Astro tutorial track, Laravel Sail)** — Laravel Sail's guaranteed-success ladder is genuinely the right model for the audience. **Match**, not beat. To beat: explicit failure-mode handling — every step names what can go wrong and the recovery command (this is wave-2 if the brief doesn't allocate time).
- **Capability hubs (Medusa Modules, Astro features)** — Medusa's "one-screen concept + headline API + Diátaxis router card" is the right ambition. **Match**, not beat, for the first hub; subsequent hubs can iterate to beat. Specific ask: every hub page must have a *single working API call* in a `comp.tabbedCode` (deno run vs global install), not just prose.
- **Reference (TanStack API tables)** — kept, not re-authored. Correct. ✅
- **Concept pages (Temporal, NestJS)** — Temporal's durability framing for sagas is correct. **Match**. NestJS module/lifecycle — match. To beat: cross-link the contract-first concept to the actual `defineServices()` L3 preset (already in `09 §2a` inventory, easy to miss).
- **Code samples (Hono recipes, tRPC panels)** — Hono recipe format is the right exemplar. tRPC zero-codegen autocomplete panel is the proof artifact for finding #10. **Match**, not beat. To beat: every sample must show the *type* the contract produces (cursor in editor → real autocompletion proof) at least once on the contracts concept page.
- **Components/engine (Lume's own docs, Vento docs)** — match (extend-don't-replace decision is right). No real "beat" target here; this is meta-architecture.

**Most important bar-raising change demanded:** every hub page must include at least one **annotated, runnable, JSR-import-realistic** code proof — not a prose bullet ("Use `createWatcher` to watch files") but a real 8–12 line snippet lifted verbatim from a verified README with `deno doc` confirmation, lifted into `comp.tabbedCode`. This is the single change that pushes the docs from "matches" to "beats" the named exemplars, and it directly serves the user's north-star (every public capability gets a reachable, intent-named home — and proves it works).

### 4. The "why" page + honest comparison (`08` Q4)

The `08` lock of Q4 ("one honest sibling table, not a comparison matrix war") is the right *call*. But "one honest table" is the floor, not the ceiling. To win a skeptical engineer:

- The "when NOT to use" callout (`comp.callout{type:"tip"}`) needs to be **specific**: not "if you need a hosted platform, look elsewhere" but "if your team needs a multi-language polyglot service mesh today, NetScript is too narrow — name the gap." Vague honesty reads as performative.
- The single honest sibling table should **show the same task** in each row (e.g. "background job with retry," "type-safe RPC," "durable workflow") and pick the *honest* winner per row, not NetScript-everywhere. This is harder to write than a generic matrix and is what separates a TanStack-grade why page from a vendor pitch.
- The "self-assembly" framing from `08` Q4 is right (it acknowledges NetScript is an integration story, not a magic platform), but the page should also say *what you're trading away*: a unified platform is faster to start but slower to evolve than a curated stack.

### 5. Phase sequencing under engine work

Already addressed as **B3** above. Short version: Phase 0 is overloaded; split 0a (chrome-only, shippable) / 0b (engine config), and let Phase 1 prose ship against 0a.

The brief already says "prose Markdown pages can begin in parallel with the Phase-0 component build, since they don't call `comp.*` directly (Markdown + callout shim)." That sentence is doing real load — promote it to an explicit 0a/0b split in `05` and the dispatch.

### 6. Accuracy-guardrail teeth

This is **B2**. The policy is correct; the enforcement is not. Two viable hardenings:

- **Option A — gate script:** `.llm/tools/docs/api-cite.ts` reads each authored Markdown page's fenced code blocks, extracts `import { … } from '@netscript/…'` lines, runs `deno doc --json` against each module, and verifies every imported symbol exists. Fails the PR otherwise. Add to `archetype-gate-matrix.md` under docs (or new `docs-content-gate`).
- **Option B — per-page worklog:** every dispatched page in `docs/site/_plan/worklog/<page>.md` records the exact `deno doc <module> --filter <symbol>` command, its output (or a stable hash), and the commit sha of the inventory (`09 §2a` source). A reviewer can spot-check; an automation can confirm a worklog exists per page.

Option A is the gold standard; Option B is a defensible floor. PLAN-EVAL recommends **A** with B as the failure-mode fallback if A can't be written in time.

### 7. Plan-Gate checklist pass/fail (`gates/plan-gate.md`)

| Checklist item | Status | Evidence |
| -------------- | ------ | -------- |
| Research present and current | **PASS** | `research/` directory with 15 Gemini-3.5-Flash artifacts (`d6f4c2ae`) + `00-research-summary.md`; `09` synthesizes; supervisor re-baselined `09 §2a` against `release/jsr-readiness` |
| Decisions locked | **PASS** | `08-decisions-locked.md` (2026-06-19), 11 user-locked decisions with rationale; respected by `09` and the briefs |
| Open-decision sweep | **PARTIAL** | `09 §3` enumerates 5 engine decision points; `09 §7` enumerates continuation gaps; **but** `briefs/00-INDEX.md` footnote leaves the watchers decision open — a rework-forcing decision the plan did not flag. → B1 |
| Commit slices enumerated, ordered, < 30 | **N/A in Phase-A report form** | This is a docs plan, not a code wave; `05` build-migration enumerates phases (0–5) and per-phase shippability. Slice < 30 is a code-wave concern. Phase-A form: `PENDING_SCRIPT` — manual evidence (phase list + per-phase acceptance bar in briefs). |
| Risk register | **PARTIAL** | `08` lists user-level risks (maturity, churn); `09` adds accuracy-guardrail risk; but no explicit risk register with mitigations for the *content* (e.g. "Aspire framing confusion," "Nitro adapter drift"). Add a `## Risks` section to `09` or to the dispatch brief. → Soft recommendation, not blocker |
| Gate set selected | **PARTIAL** | `briefs/00-INDEX.md` references `gates/plan-gate.md` and `archetype-gate-matrix.md`, but no explicit "this surface uses static-gate + docs-content-gate" mapping. → Soft recommendation |
| Deferred scope explicit | **PASS** | `09 §6` continuation gaps; Reference lane scope-out in `00`; `06` teardown scope |
| jsr-audit (package/plugin waves) | **N/A** | Docs lane; `09 §2a` inventory cited as binding but no formal jsr-audit. Phase-A form: `N/A — docs lane (non-package wave)`. |

**Plan-Gate overall: FAIL_PLAN** — driven by B1 (watchers coverage), B2 (accuracy guardrail without teeth), and B3 (Phase-0 overload). Each is a concrete, localized fix that the supervisor can land in one revision pass.

---

## Refinements made under `docs/site/_plan/**`

1. **`docs/site/_plan/09-research-integration.md`** — appended a §8 "Adversarial PLAN-EVAL hooks (M3 review)" block recording the B1/B2/B3 blocking gaps, the B1 watcher's evidence (createWatcher + README + publish config), the queue-adapter accuracy nit (Nitro is not a queue adapter; KV adapters are deno-kv + redis + memory), and the recommended gate-script hardening (`.llm/tools/docs/api-cite.ts`). Justification: B1 is an accuracy gap in the supervisor's own synthesis; logging it back into `09` makes it visible to the next plan iteration and prevents re-litigation. B2 hardening is *proposed* (not enacted) because authoring the gate script is an implementation slice, not a plan refinement. B3 is a structural recommendation that requires the supervisor to redraw Phase 0 in `05` and the dispatch.

(Only `09` was edited. `briefs/00-INDEX.md` watchers footnote and `05` Phase 0 overload are *recommendations* to the supervisor — not edits — because they cross-link into the locked `08` decisions' execution model and are larger than an in-run plan refinement should be.)

---

## Operational close

- **Outcome:** `FAIL_PLAN` — three blocking gaps (B1, B2, B3) must close before `PASS`. Two `FAIL_PLAN` cycles permitted before user escalation per `plan-protocol.md`.
- **Single most important bar-raising change I demand:** every authored hub page must contain **at least one annotated, runnable, JSR-import-realistic code proof** (verified against `deno doc`) inside `comp.tabbedCode`. This is the change that lifts the docs from "matches the named exemplars" to "beats them," and it directly serves the user north-star of "EVERY public capability gets a reachable, intent-named home — and a working code path that proves it." It's also the change that turns the B2 accuracy guardrail from policy into practice, since every proof is a citation the gate script can check.
