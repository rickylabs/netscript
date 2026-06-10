# Research — Wave 4: Runtimes & their plugins (9 units)

Run ID: `feat-package-quality-wave4-runtimes--umbrella`
Umbrella branch: `feat/package-quality-wave4-runtimes` (off track `feat/package-quality` @ `f2a7ff2`)
Author: SUPERVISOR pre-research pass (architectural + high-level), 2026-06-08.
Status: **complete enough to seed Plan & Design**; per-sub-wave dynamic MEASURE-FIRST
(doc-lint sweep) remains the generator's first step. **PLAN-LOCK is BLOCKED on Wave 3.**

> This is the architectural research the Plan & Design phase builds on: each unit's
> role, shape, purpose, quality, market-standard framing, and reconciliation against
> the canonical evaluate/plan docs. It deliberately goes beyond "JSR readiness" — the
> JSR slow-type axis is already clean (see §3).

## 0. Prework provenance (why this is fine-tuning, not a rebuild)

The current `*-core` + `plugins/*` layout is the output of the **platform rewrite**
`rickylabs/netscript-start#96` ("feat: plugin platform implementation", merged
2026-05-26: 1,253 files, +84,946/−42,129, aggregating #86–#95). That wave already
restructured these units toward JSR/hexagonal standards. **My dry-run sweep confirms
it landed:** all 9 units publish-dry-run **PASS with 0 slow types** (canonical "before"
counts — workers 50, plugin-triggers 16, watchers FAIL/1 — are fully stale).

**So Wave 4 = verification + doc-lint/docs/test/structure parity + a deliberate
challenge pass on the two large cores — NOT a slow-type rebuild.**

Caveat inherited from #96 (recorded in its supervisor drift): at merge time
`check:services` and `check:workers` were **failing** on missing generated-DB
artifacts + service-router / worker-job **typing drift**, and `fmt`/`lint` timed out.
The A5 plugins' **service/runtime layer** and **workers typing** are therefore the
known-soft areas, and the most likely root of the carried `e2e:cli` triggers-health
failure (see §6).

## 1. Unit inventory & current shape (measured at `f2a7ff2`)

| Unit | Tier | exports | src LOC | files | tests | README | docs/ | largest file (LOC) | tasks gap |
|------|------|--------:|--------:|------:|------:|-------:|:-----:|--------------------|-----------|
| `plugin-streams-core` | core | 3 | 816 | 16 | 2 | 170 | ✓ | create-durable-stream 262 | — |
| `plugin-workers-core` | core | **17** | **7060** | 87 | 5 | 315 | ✓ | workers.contract 501 | — |
| `plugin-sagas-core` | core | **19** | **6768** | 80 | 5 | 166 | ✓ | redis-transport 481 | **no `test` task** |
| `plugin-triggers-core` | core | 11 | 4023 | 53 | 3 | 431 | **✗** | trigger-processor 322 | **no `test` task** |
| `watchers` | A3 standalone | 1 | ~1621¹ | 13¹ | 3 | **0** | **✗** | file-watcher 310 | **no tasks at all** |
| `plugin-streams` | A5 plugin | 5 | 579 | 13 | **0** | 128 | ✓ | services/main 154 | — |
| `plugin-workers` | A5 plugin | 9 | 2426 | 20 | **0** | 260 | ✓ | worker/scheduler 469 | **no `publish:dry-run`** |
| `plugin-sagas` | A5 plugin | 12 | 2396 | 30 | **0** | 99 | ✓ | services/routers/v1 **716** | **no `publish:dry-run`** |
| `plugin-triggers` | A5 plugin | 10 | 2897 | 25 | **0** | 285 | **✗** | test-webhooks-e2e 424 | — |

¹ `watchers` code is flat at the package root (no `src/`); LOC/file count from canonical
`evaluate_watchers.md` (13 files / 1621 LOC) — my src-only walk reports 0 because there
is no `src/` dir. This is the structural finding, not a measurement error.

## 2. Systemic findings (cut across units — these are the real Wave 4 work)

1. **The entire A5 plugin tier has ZERO tests** (`plugin-{streams,workers,sagas,triggers}`
   = 0/0/0/0). This is the single largest quality gap of the wave. F-10 (test-shape) is
   `required` for A5, and A5 also requires **Runtime/Aspire validation** — so these need a
   real test layer, not a doctest sprinkle.
2. **`watchers` is the rough unit** (the "database of Wave 4"): no README, no `docs/`, no
   `deno.json` tasks, flat root layout, no description. Needs the full structural lift to
   `src/public/` + README ≥150 + docs scaffold. It already publishes 0 slow types, so this
   is structure/docs work, not type work.
3. **Two long-pole cores with very large public surfaces:** `workers-core` (17 exports /
   7,060 LOC) and `sagas-core` (19 exports / 6,768 LOC). The challenge pass (§5) targets
   these: is a 17/19-entrypoint surface justified, coherent, and minimal for alpha?
4. **Task-hygiene (F-6) gaps:** `sagas-core` + `triggers-core` lack a `test` task;
   `plugin-workers` + `plugin-sagas` lack `publish:dry-run`; `watchers` has no tasks at all;
   none enumerate all entrypoints in `check` (the Wave 3 F-6 pattern).
5. **docs/ missing** on `triggers-core` and `plugin-triggers`.
6. **File-size (F-1, cap ≤350 LOC src):** over-cap files — `plugin-sagas` services/routers/v1
   **716**, `workers-core` workers.contract **501**, `sagas-core` redis-transport **481**,
   `plugin-workers` worker/scheduler **469**, `plugin-triggers` test-webhooks-e2e **424**.
   (`.contract.ts` and generated/service files may warrant per-layer treatment like A6.)
7. **`unanalyzable-dynamic-import` warnings** (non-blocking, like Wave 3's manifest-resolver):
   `workers-core` ×1, `plugin-{workers,sagas,triggers}` ×2 each. Decide accept-and-document
   vs make-resolvable per unit.

## 3. JSR slow-type axis — DONE (current dry-run reality)

All 9 units: `deno publish --dry-run --allow-dirty` → **PASS, 0 slow types** at `f2a7ff2`.
The decisive signal that this wave is fine-tuning. **Doc-lint is NOT yet measured** — per
Wave 3 (`@netscript/plugin`: root mod.ts showed 11, full 8-entrypoint sweep showed **120**),
the full-export `deno doc --lint` sweep is the real doc-debt number and **undercounts
massively at root**. Each sub-wave's generator MUST run the full-export sweep per unit as
MEASURE-FIRST (esp. the 17/19-entrypoint cores).

## 4. Archetype reconciliation — the central planning question

The supervisor registry and the canonical docs **disagree** on the core archetype, and the
gate set hinges on it (`gates/archetype-gate-matrix.md`):

| Unit | Registry says | Canonical doc says | Gate-set consequence |
|------|---------------|--------------------|----------------------|
| `*-streams-core` | A1/A4 | `plan_streams.md`: **A1** (was "Wave 1") | A1 ⇒ F-2/3/4/9/13 **n/a**, runtime val **n/a**, consumer-import **optional** |
| `*-workers-core` | A1/A4 | `plan_workers.md`: **A3** (Runtime/Behavior) | A3 ⇒ **F-13 required + Runtime/Aspire validation required** |
| `*-sagas-core` | A1/A4 | (expect A3 — saga runtime) | A3 ⇒ F-13 required (saga invariants are the canonical F-13 case) |
| `*-triggers-core` | A1/A4 | (expect A3) | A3 ⇒ F-13 + runtime validation |
| `watchers` | A3 | `evaluate_watchers.md`: **A3** ✓ | agree |
| `plugins/*` | A5 | `plan_plugin-*`: **A5** ✓ | agree |

**Implication:** if the cores are A3 (canonical's view, and their runtime nature supports it),
Wave 4 owes **F-13 (saga/runtime invariants) + live Runtime/Aspire validation** — gates that
were `optional`/`n/a` in Waves 2–3. The Plan & Design phase must **fix the archetype per unit**
(declared in each `docs/architecture.md`) before selecting gates. Recommendation: treat the
cores as **A3** unless a unit is a pure type/contract surface, and record the decision + the
gate delta in `drift.md`. This is the wave's biggest "beyond type/lint" lever.

## 5. The challenge pass (per the user — these are large; don't just fine-tune)

Beyond parity, the Plan & Design phase should *challenge* the two long poles:

- **`workers-core` (17 exports) & `sagas-core` (19 exports):** Is each entrypoint a real,
  documented consumer contract, or surface sprawl? Apply F-5 (public-surface audit) + F-16
  (folder cardinality) hard. Candidate questions: are `./streams`, `./presets`, `./schemas`,
  `./state`, `./executor`, `./workflow`, `./shutdown`, `./runtime`, `./config` all *intended*
  public API at alpha, or internal layers leaking as entrypoints? Verify consumers
  (`packages/cli`, the A5 plugins) before trimming — alpha allows no-shim removal, but prove
  zero external use first (the Wave 3 `./loader`/`./abstracts`/`./testing` zero-consumer lesson).
- **sagas `redis-transport` (481) + `./transports`/`./stores`/`./middleware` ports:** confirm
  the ports/adapters split is clean (F-3 layering) and transports are swappable behind a port.
- **`plugin-sagas` `services/routers/v1.ts` (716):** the largest file on the board — almost
  certainly needs a concept-split; it's also the A5 service layer flagged by #96 typing drift.
- **A5 service/runtime layer broadly:** #96 left `check:services`/`check:workers` failing on
  generated-DB artifacts + router/job typing drift. Determine what is genuine package debt vs
  environment (generated artifacts) before scoping; tie to §6.

## 6. Triggers-health caveat (Wave 2→3→4 handoff) — confronted HERE

The `e2e:cli` `behavior.triggers-health` failure (`localhost:8093/health`, os error 10054)
has been carried since Wave 2. **Wave 4 is the terminal owner:** `plugin-triggers` is A5
(Runtime/Aspire validation **required**), so the runtime health path can no longer be
deferred. Sequencing: the **triggers sub-wave runs LAST** so Wave 3's OQ-D verdict (host
defect vs downstream) and the final `@netscript/plugin` surface are known before triggers
planning locks. If Wave 3 attributes it downstream → it is in-scope for the triggers sub-wave.

## 7. Canonical doc map (name reconciliation — read the RIGHT file)

The canonical run uses **old package names**; map before reading:

| Wave 4 unit | canonical evaluate/plan |
|-------------|-------------------------|
| `plugin-streams-core` | `evaluate_streams.md` / `plan_streams.md` |
| `plugin-workers-core` | `evaluate_workers.md` / `plan_workers.md` |
| `plugin-sagas-core` | `evaluate_sagas.md` / `plan_sagas.md` |
| `plugin-triggers-core` | `evaluate_triggers.md` / `plan_triggers.md` |
| `watchers` | `evaluate_watchers.md` / `plan_watchers.md` |
| `plugin-streams` | `evaluate_plugin-streams.md` / `plan_plugin-streams.md` |
| `plugin-workers` | `evaluate_plugin-workers.md` / `plan_plugin-workers.md` |
| `plugin-sagas` | `evaluate_plugin-sagas.md` / `plan_plugin-sagas.md` |
| `plugin-triggers` | `evaluate_plugin-triggers.md` / `plan_plugin-triggers.md` |

All canonical numbers are **2026-05 pre-rewrite and stale** (e.g. wave/archetype labels,
slow-type counts). Use them for **structural intent + Concept-of-Done** (the 9-criterion
alpha bar + target `src/public` tree + `inspect<Noun>(): InspectionReport`), not metrics.

## 8. Inputs that wait for Wave 3 (the only blocked items)

1. Final `@netscript/plugin` public surface (import paths / type names) — the A5 plugins
   consume it; the triggers sub-wave is most exposed.
2. OQ-D triggers-health verdict (host vs downstream).

Everything in §§1–7 is invariant to those. They fold in at the **post-Wave-3 reconciliation
round** (re-run the consumer scan against Wave 3's merged surface; resolve OQ-D ownership)
**before** opening the first sub-branch.
