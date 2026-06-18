# PLAN-EVAL Verdict — NetScript docs content-architecture rebuild (cycle 2)

- **PR / branch / tip:** PR #59 · `docs/content-architecture` · `0e049f7a`
- **Evaluator session:** Minimax-M3, OpenHands (separate from the supervisor / generator)
- **Run:** `openhands/pr-59/run-27796309598-1`
- **Cycle 1 verdict:** `FAIL_PLAN` (B1 watchers, B2 accuracy guardrail, B3 Phase-0 overload) +
  engine caveats (D-E1, D-E2, D-E4) + Nitro adapter nit + R5 Aspire framing nit.
- **Cycle 2 supervisor commit:** `0e049f7a` — "docs(plan): close PLAN-EVAL FAIL_PLAN gaps
  B1/B2/B3 + engine caveats (cycle-1)" — touches only `09`, `05`, and `briefs/00-INDEX.md` (plus
  the prior cycle-1 trace artifacts under `.llm/tmp/run/`). No `packages/`, `plugins/`, `aspire/`,
  `deno.json`, `scaffold-versions.ts`, catalog, or lock file edits. Lane discipline respected.
- **Files re-read (deltas only):** `09 §8 + §8a`, `09 §2b`, `09 §3` adjudication block,
  `briefs/00-INDEX.md` Global Bar + Phase 0 split + Phase 3 hub list + brief template,
  `05` Phase 0 split + acceptance lines + artifact table.
- **Spot-checks performed (`deno doc` ≤ 3):** `@netscript/watchers` (`packages/watchers/{deno.json,
  README.md, mod.ts, src/public/mod.ts}`) to confirm B1 is real and a hub is warranted.

## VERDICT (front-loaded)

**`PLAN-EVAL: PASS`** — all three blocking gaps from cycle 1 are genuinely closed at the plan
level, the engine caveats are now binding, the adapter/accuracy nits are corrected, and the
locked `08` decisions remain respected. The plan is implementation-ready; authoring dispatch
may begin against Phase 0a.

### Per-gap closure table

| Gap | Status | Evidence (one line) |
| --- | ------ | ------------------- |
| **B1 — watchers coverage** | **CLOSED** | `briefs/00-INDEX.md` Phase 3 now lists 10 hubs including "File watching & ingestion → watchers"; "internal/dev-tooling" framing removed; coverage note rewritten to "all 21 packages + 4 plugins with no exclusions"; `09 §2a` marked "Authoritative package/plugin inventory (verified `release/jsr-readiness`) … **binding on authors**" (`09 §2` line 33). Spot-check confirms `packages/watchers/{mod.ts, src/public/mod.ts}` exports `createWatcher`, `FileWatcher`, plus 14 named exports (`createWatcher`, `FileWatcher`, `StabilityFilter`, `GlobFilter`, `DedupFilter`, `AccessFailureTracker`, `safeReadFile`, `safeStat`, plus type exports for `EventKind`, `FileInfo`, `KnownWatchStrategy`, `StabilityOptions`, `WatcherOptions`, `WatchEvent`, `WatchFilter`, `Native/Polling/HybridStrategy[Options]`); `deno.json` is publish-configured (`@netscript/watchers`, JSR-installable, `publish:dry-run` task, `publish.include` covers README + mod + src + docs). Real public surface; hub is warranted. |
| **B2 — accuracy guardrail teeth** | **CLOSED** | `briefs/00-INDEX.md` Global Bar #1 (lines 27–40) is now a **two-tier enforced gate**: **Target** = `.llm/tools/docs/api-cite.ts` extracts `import { … } from "@netscript/…"` from fenced code blocks → runs `deno doc --json` per module → fails PR on unknown symbol → wired into `archetype-gate-matrix.md` as `docs-content-gate`; **Floor** = per-page worklog at `docs/site/_plan/worklog/<page>.md` with exact `deno doc <module> --filter <symbol>` command + output/hash + `09 §2a` sha; "No page merges without its worklog row." Global Bar #2 (lines 42–46) adds the ≥1 annotated runnable JSR-import-realistic `comp.tabbedCode` proof per hub/landing/why page. Brief template (line 74) carries the mandatory WORKLOG line. Gate SCRIPT is a Phase-0b Codex slice per plan (correctly scoped); the floor is mandatory from page 1 so accuracy is enforceable today, not waiting on the script. |
| **B3 — Phase 0 split** | **CLOSED** | `briefs/00-INDEX.md` lines 80–110 split Phase 0 into **0a** (components + nav + breadcrumb/nextPrev — "shippable to Pages as a chrome-only preview" with explicit "**Acceptance 0a:** site builds + deploys to Pages with the new chrome… this is the merge gate for 0a") and **0b** (markdown-it callout shim + D-E2 Shiki + D-E3 toc + D-E4 sitemap + `.llm/tools/docs/api-cite.ts` — "Codex slice; does NOT block prose"). `05-build-migration-plan.md` lines 16–37 mirrors the split with the same merge-gate acceptance + D-E2/D-E4 acceptance lines. Phase-1 prose explicit: "Front-door prose can begin against 0a before 0b completes" (`briefs/00-INDEX.md` line 167–169). Artifact table updated: Phase 0 has 0a and 0b rows; Phase 3 = "10 hubs + 4 concepts". |

### Caveats / nits (cycle-1 engine caveats + accuracy nits + R5)

| Item | Status | Evidence |
| ---- | ------ | -------- |
| **D-E1** `nav.ts` Reference-sub-tree-only (never global) | **APPLIED** | `09 §3` line 96: "`nav.ts` is enabled for the **Reference sub-tree ONLY**, never globally; the curated `navSections` owns the top-level learning-curve ladder. Global `nav.ts` would invert the locked ordering and is prohibited." Reinforced in `05` Phase 0b line 37 ("D-E1 nav.ts — Reference sub-tree ONLY") and `09 §8a` line 222. |
| **D-E2** Shiki Phase-0b compatibility acceptance line | **APPLIED** | `09 §3` line 97: "Shiki adopt is **conditioned on a Phase-0b acceptance line** (verify it composes with pagefind + `base_path` + anti-flash theme tokens) — promoted from prose safeguard to a slice acceptance criterion in `05` + the dispatch. Prism fallback only if it breaks the chrome." `05` Phase 0b mirrors: "Acceptance line: verify Shiki composes with pagefind + `base_path` + anti-flash theme tokens *before locking*." |
| **D-E4** sitemap `base_path` acceptance | **APPLIED** | `09 §3` line 99 + `05` Phase 0b: "Acceptance: emitted URLs honor `base_path` (`rickylabs.github.io/netscript`)." |
| **§2b adapter lists** (Nitro NOT an adapter; queue = Deno KV + Redis + RabbitMQ; KV = deno-kv + redis + memory) | **APPLIED** | `09 §2b` lines 62–67: "Nitro is NOT an adapter for either lane. Queue adapters are Deno KV + Redis + RabbitMQ (`deno doc @netscript/queue`). KV adapters are Deno KV + Redis + memory (`packages/kv/adapters/{deno-kv,redis,memory}.adapter.ts`); kvdex and denokv-bridge are helpers, not adapters." Corrected and marked binding. |
| **R5** Aspire framing precision (TypeScript AppHost inspection, not .NET orchestrator) | **APPLIED** | `briefs/00-INDEX.md` Global Bar #8 (lines 56–60): explicit framing rule with author-time sniff test ("would a platform engineer confuse this with .NET Aspire the orchestrator?") and the correct `--no-aspire` opt-out framing. |
| **Locked `08` decisions** (Q1, Q5, Q7, Q14 + others) still respected | **CONFIRMED** | `09 §1` line 22 ("`08` Q14 plain-English hub labels — locked"), line 27 ("`08` Q5/Q7 alpha maturity + Aspire hero"), line 116–123 (each finding references its locked `08` Qn); `briefs/00-INDEX.md` Phase 0a row ("Plain-English labels (`08` Q14)"). No `08` decision is contradicted. |
| **Lane discipline** (no `packages/`, `plugins/`, `aspire/src/public/`, version pins, scaffold-versions, catalog, lock files edited) | **CONFIRMED** | `git diff --stat 0aa65579..0e049f7a` shows only `09`, `05`, `briefs/00-INDEX.md`, and prior cycle-1 trace artifacts under `.llm/tmp/run/`. Empty grep against `^ packages/`, `^ plugins/`, `^ aspire/`, `deno.json`, `scaffold-versions`, `catalog`, `lock`. |

### Plan-Gate checklist re-walk (cycle-1 PARTIAL items)

| Checklist item | Cycle 1 | Cycle 2 | Note |
| -------------- | ------- | ------- | ---- |
| Research present and current | PASS | PASS | unchanged; `09 §2a` re-baselined to `release/jsr-readiness` |
| Decisions locked | PASS | PASS | `08` respected; no Q reopened |
| **Open-decision sweep** | PARTIAL | **PASS** | watchers open-decision now resolved by B1 (10th hub); engine decisions in `09 §3` now adjudicated with binding caveats (`§3` line 95–99) |
| Commit slices enumerated, ordered, < 30 | N/A (Phase-A form) | N/A | Docs lane; phase list + per-phase acceptance bars suffice |
| Risk register | PARTIAL | PARTIAL (non-blocking) | No new explicit risk register added; cycle-1 marked this "soft recommendation, not blocker." The plan now implicitly mitigates the two material risks: (a) accuracy drift → B2 gate; (b) Phase-0 wedge → B3 split. Recommend documenting in `09 §8a` only if the user asks. |
| **Gate set selected** | PARTIAL | **PASS** | `briefs/00-INDEX.md` line 34–36 + line 108 now specifies wiring `.llm/tools/docs/api-cite.ts` into `archetype-gate-matrix.md` as `docs-content-gate`. The gate SCRIPT is `PENDING_SCRIPT` (Phase-0b Codex slice) per Phase A reporting rules — correctly scoped. |
| Deferred scope explicit | PASS | PASS | `09 §6` continuation gaps + `09 §8a` continuation reference + Phase 5 polish only |
| jsr-audit (package/plugin waves) | N/A | N/A | Docs lane |

**Plan-Gate overall: PASS** — all blocking items now satisfied. Risk register remains the
single PARTIAL but is explicitly non-blocking (cycle-1 soft recommendation).

---

## Per-closure evidence notes

### B1 — watchers is a real public surface

Direct inspection (cap ≤ 3 spot-checks, only `@netscript/watchers` re-verified):

- `packages/watchers/deno.json` — `"name": "@netscript/watchers"`, JSR-installable, `publish.dry-run` task, `publish.include` covers README + mod + src + docs.
- `packages/watchers/mod.ts` — `@module` doc with `createWatcher` example; `export * from './src/public/mod.ts'`.
- `packages/watchers/src/public/mod.ts` — exports `createWatcher`, `FileWatcher`, `StabilityFilter`, `GlobFilter`, `DedupFilter`, `AccessFailureTracker`, `safeReadFile`, `safeStat`, plus type exports (`EventKind`, `FileInfo`, `KnownEventKind`, `KnownWatchStrategy`, `StabilityOptions`, `WatcherOptions`, `WatchEvent`, `WatchFilter`, `WatchStrategy`, `WatchStrategyHandler`, `NativeStrategy[Options]`, `PollingStrategy[Options]`, `HybridStrategy[Options]`, `DedupFilterOptions`). 22 export items; this is unambiguously a published public surface.
- `packages/watchers/README.md` — `deno add jsr:@netscript/watchers` install snippet + a 12-line `createWatcher` quick example.

The hub is therefore not decorative — it has working code to teach. Watchers is also flagged
in `briefs/00-INDEX.md` (line 152) as the canonical worked example for the B2 gate, which
sharply raises the cost of any future regression.

### B2 — the gate has teeth

The cycle-1 finding was that "verify via `deno doc`" was policy-as-wish. The cycle-2 plan
turns it into:

1. **A named script with specified behavior.** `api-cite.ts` is named at the path
   `.llm/tools/docs/api-cite.ts`. Its behavior is specified concretely: extract every
   `import { … } from "@netscript/…"` from authored pages' fenced code blocks, run
   `deno doc --json` against each module, fail the PR on any unknown symbol. Its wiring
   is specified: into `archetype-gate-matrix.md` as `docs-content-gate`.
2. **A floor that is enforceable from page 1.** Per-page worklog at
   `docs/site/_plan/worklog/<page>.md` with exact `deno doc --filter <symbol>` command,
   output/hash, and `09 §2a` sha. "No page merges without its worklog row." This is the
   reviewer-enforceable artifact that closes the cycle-1 gap *immediately*, not waiting on
   the script.
3. **A bar-raiser that exercises the gate.** Global Bar #2 forces ≥1 annotated runnable
   JSR-import-realistic `comp.tabbedCode` proof per hub/landing/why page, which is exactly
   the kind of artifact the gate script can mechanically check.
4. **A template that propagates the discipline.** The brief template now carries a
   mandatory `WORKLOG (mandatory, B2 floor)` line.

The plan does not need to *write* the script — it needs to specify it concretely (done) and
mandate the worklog floor (done). Both are present. The script is correctly scoped to a
Phase-0b Codex slice.

### B3 — Phase 0 is no longer a wedge

The 0a/0b split is in **both** required files (`briefs/00-INDEX.md` and `05`), with:

- **0a merge-gate acceptance** ("site builds + deploys to Pages with the new chrome,
  pagefind/base_path/`--ns-*` intact") — shippable to Pages as a chrome-only preview.
- **0b acceptance lines** for D-E2 (Shiki composes), D-E4 (sitemap `base_path`), and the
  gate script (`api-cite.ts` + wire).
- **Phase-1 prose can ship against 0a** — explicit in the sequencing rationale.

The artifact table is updated (0a + 0b separate rows; Phase 3 → 10 hubs).

---

## Single most important remaining concern (non-blocking)

The `api-cite.ts` gate script is a Phase-0b implementation slice that does not exist yet.
The worklog floor is the safety net until it lands. Recommend the dispatch track explicitly
*which* page (page N) `api-cite.ts` becomes available so the floor can transition to the
target gate without a discontinuity — and that `api-cite.ts` is a top-level Phase-0b slice,
not buried under engine config, so its slippage is visible.

(Secondary soft note: risk register remains PARTIAL but is non-blocking per cycle-1.)
