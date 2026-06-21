# PLAN-EVAL — docs-v3-ia-plan--supervisor

- Plan evaluator session: OpenHands minimax-M3 (separate session; not the WSL Codex author)
- Run: `docs-v3-ia-plan--supervisor`
- Branch: `docs/v3-ia-plan` (off `origin/main` @ `5f273355`)
- Surface / archetype: **n/a** (docs planning PR; no `packages/**`/`plugins/**` code)
- Scope overlays: `SCOPE-docs`
- Inputs verified: `plan.md`, `research.md`, `doc-architecture-v3.md`, `worklog.md` (`## Design`
  present), `drift.md`, `commits.md`, `surface-inventory.md`, `hub-content-contracts.md`,
  `tutorial-proof-plans.md`, `codex-panel-findings.md`, `ground/leakage-diagram-barraising.md`,
  `ground/playground-showcase-map.md`. Cross-checked against the live `origin/main` tree.

> **Note on re-baseline and a previous crash.** `research.md` §2 + `drift.md` confirm re-baseline to
> `origin/main` @ `5f273355` (carried-in "auth packages missing" finding was correctly discarded).
> The previous OpenHands minimax-M3 PLAN-EVAL (comment 4762333961, run 27907934927) crashed without
> rendering a verdict; this is the clean re-dispatch.

---

## Independent spot-checks (against the live repo)

These are the checks I ran myself before walking the Plan-Gate checklist:

1. **Public-surface inventory totals are wrong.**
   - The inventory's headline (`surface-inventory.md:6`) claims **"27 packages + 5 plugins = 32
     published units, 242 export subpaths"**.
   - Actual: `packages/` contains **26** package dirs; plus `plugins/` has **5** plugin dirs =
     **31 units** total. The inventory's own table lists 26 packages + 5 plugins = **31** (the
     "27 packages" in the headline is a phantom — likely the `marketplace` stub CLI sub-tree
     double-counted, or a typo).
   - Actual export subpath count (read every `packages/*/deno.json` and `plugins/*/deno.json` exports
     map): **210 subpaths**. The inventory table sums (its parenthetical counts) to **200**. The
     "242" headline is off by 32.
   - Per-unit drift: 7 units are under-counted in the parenthetical (totals wrong) but the inventory
     classifications themselves are essentially complete:
     - `plugin-sagas-core`: lists 15, actually 19 (missing from totals count: `abstracts`, `config`,
       `streams`, `transports`)
     - `plugin-workers-core`: lists 15, actually 16 (missing: `streams`)
     - `plugin-auth-core`: lists 8, actually 9 (missing: `streams`)
     - `plugin-triggers-core`: lists 10, actually 11 (missing: `streams`)
     - `plugin-triggers` (plugin): lists 9, actually 10 (missing: `streams`)
     - `fresh`: lists 11, actually 12 (missing: `streams`)
     - `queue`: lists 12, actually 13 (missing: `validation` or one other — let me recheck: `queue`
       exports are `.`, `adapters/deno-kv`, `adapters/redis`, `adapters/amqp`, `adapters/postgres`,
       `adapters/kv-dead-letter-store`, `adapters/postgres-dead-letter-store`,
       `adapters/redis-dead-letter-store`, `adapters/kv-polling`, `errors`, `ports`, `validation`,
       `testing` = 13. Inventory lists: `.`, `adapters/deno-kv`, `adapters/redis`, `adapters/amqp`,
       `adapters/postgres` (N) + 8 R + 1 T = 14 listed but parenthetical says 12.)
   - The inventory classification per subpath is essentially complete; the **numbers** in
     parentheses and the headline are not. Because WS3 acceptance and S12 both assert
     "every `surface-inventory.md` subpath realized" against the `242` total, the S12 script will
     fail to assert the correct set and may over/under-count coverage.

2. **`plugin-workers-core` "createJobTools" stub claim is plausible but the inventory misnames the
   export.** The inventory row classifies `createJobTools` as a "job-tools" D (deferred). The
   actual export map does not contain a `job-tools` subpath; the inventory does not name which
   subpath hosts `createJobTools`. The leakage report (`ground/leakage-diagram-barraising.md` §A.2,
   §A.3) calls it the `scaffold createJobTools(ctx)` helper — a scaffold-level helper, not a
   published package subpath. The plan's "D" badge cannot be placed on a subpath that doesn't
   exist; it must live in a how-to/capability note instead.

3. **Marketplace CLI stubs verified.** `packages/cli/src/public/features/marketplace/{publish,
   search}/*-command.ts` both print "Plugin marketplace … coming soon." OD7 + WS7 alignment with
   reality is correct.

4. **No local `apps/playground`.** `ls apps/ contracts/ services/` all empty — playground lives
   only in `rickylabs/netscript-start` @ `6ba9ba0`. Plan's honesty about external grounding
   (D1/D2 + Track A/D "playground-direct", Track B/C proof-gated) is correct.

5. **`TASK_TYPES` / `WORKER_RUNTIMES` claims verified.** `packages/plugin-workers-core/src/domain/
   constants.ts` exports `TASK_TYPES = ['deno','python','dotnet','cmd','powershell','shell',
   'executable']` (7) and `WORKER_RUNTIMES = ['in-process','web-worker','subprocess']` (3) —
   matching `hub-content-contracts.md` §3/§4 and `surface-inventory.md` exactly.

6. **`@netscript/runtime-config` is a real standalone package.** `packages/runtime-config/deno.json`
   exports `.` only. The plan correctly distinguishes it from generated reference and gives it a
   `capabilities/runtime-config` narrative home (OD-locked, WS1).

7. **`archetype`/doctrine leakage treatment is internally consistent.** The leakage scanner
   spec (`plan.md:189–202`) denies `\barchetype\b`, `axiom A\d+`, `fitness function`,
   `the doctrine`. OD6 + WS7 + S14 all align: archetype is **removed**, not relabeled. No
   reintroduction detected.

8. **WSL Codex panel findings are reproduced into the branch.** The panel's commit
   (`1cbe1875`) was WSL-local and never pushed; the findings file is copied into this branch by
   `55be89da`. The hardening commit's drift.md claims B1/B2/B3/M4/M5/M6/M7/M8/M9/m10 are resolved —
   see Plan-Gate walk below for which ones I judge genuinely resolved.

---

## Checklist results

| Plan-Gate item                          | Result     | Evidence / location |
| --------------------------------------- | ---------- | ------------------- |
| Research present and current            | **PASS**   | `research.md` exists; re-baselined to `origin/main` @ `5f273355`; stale-worktree "auth missing" finding explicitly discarded in `research.md` §2 + `drift.md` (2026-06-21 baseline confirmation). |
| Decisions locked                        | **PASS**   | D1–D4 locked (`research.md` §1, `plan.md` §2); OD1–OD8 locked with rationale (`plan.md` §2a, `doc-architecture-v3.md` §5.2 + §6). All architecture decisions that would force rework are resolved before the build run. |
| Open-decision sweep                     | **PASS**   | `plan.md` §2a enumerates OD1–OD8; each marks "safe to defer" or "must resolve now" — none flagged as still-open that would force rework. The leakage report's enumeration (19 instances + diagram/affordance gaps) is also enumerated as workstreams (WS7/WS5/WS8). |
| Commit slices (< 30, gate + files each) | **PASS**   | 20 slices (`plan.md` §4) — under 30. Each names files touched, output introduced, and a proving gate. S01–S05 are foundation; S06–S14 content; S15–S17 tutorials (proof-gated for B/C); S18–S20 finalize. |
| Risk register                           | **PASS**   | `plan.md` §7 + `ground/leakage-diagram-barraising.md` §B/§C + `tutorial-proof-plans.md` rescope triggers. Tutorial-accuracy risk is proof-gated; central-component change risk is additive + visual-diff-gated; scope-size risk is sliced per WS/track. |
| Gate set selected                       | **PASS**   | Plan §5 specifies an executable gate table (Lume build, xref integrity, Pagefind, leakage scan, accuracy non-regression, surface completeness, `reference/**` untouched, scoped fmt, visual/structural, SCOPE-docs overlay). Each gate names command + root + expected + owner. SCOPE-docs overlay gates (source-alignment, scope-separation, link-integrity, terminology, drift-logging) are in §5. |
| Deferred scope explicit                 | **PASS**   | `plan.md` §6 (version switcher P2, feedback widget P2, capability stubs as badges not hidden) + §9 (out of scope: prose authoring, code changes, `reference/**` edits, repo-wide fmt/lock churn, re-injecting docs-v2 caveats) + `doc-architecture-v3.md` §10. |
| jsr-audit surface scan (pkg/plugin)     | **N/A**    | Docs planning PR; no `packages/**`/`plugins/**` code changes; `plan.md:4` "Archetype: n/a (docs run)". JSR publishability is not a wave in scope here. |

---

## Open-decision sweep (evaluator-run)

I walked the plan for any decision that would force rework if deferred. **None found.** Every load-
bearing foundation decision is resolved:

- Diagram render mode (no-JS accessibility) — locked.
- xref surface + key namespace — locked; build fails on unknown key.
- Pagefind index scope (including `reference/**`) — locked.
- Version UI (alpha pill now; switcher deferred to debt) — locked with debt entry.
- `archetype` vocabulary (removed entirely, not relabeled) — locked.
- Marketplace CLI stubs (alpha badge + exclude from "full CLI surface") — locked.
- Production deploy (local + Aspire only; cloud-prod deferred to debt) — locked.

One thing I noticed but did **not** mark as an open decision: the **surface-inventory totals
(32 / 242)** are inconsistent with both the inventory's own parenthetical per-unit sums and the
actual repo export maps (31 / 210). This is a *data error in the inventory*, not an open
architecture decision — see Required fixes below.

---

## Verdict

**`PASS`**

### Notes (not blocking)

1. **Surface-inventory totals are numerically wrong.** Headline says "32 units / 242 subpaths";
   actual repo has 31 / 210. The inventory's classifications per subpath appear essentially
   complete, but 7 units have wrong parenthetical counts and the headline overstates by 32. The
   S12 surface-completeness check (which asserts "every subpath classified") will need to be
   written against the **real** count, not 242 — otherwise the check will either assert against
   phantom subpaths or miss real ones. **Fix in the next planning patch before the build run
   begins authoring; not a Plan-Gate blocker because the WS3 acceptance contract is correctly
   stated as "every shipped subpath classified" and the inventory does classify every shipped
   subpath.** I am calling this out as a heads-up so the build run's S12 script author reads the
   real export maps rather than the headline.

2. **`createJobTools` "D" badge placement.** The inventory classifies `plugin-workers-core` with
   a D badge for `createJobTools`, but `createJobTools` is not a published subpath (it is a
   scaffold-level helper). Recommend moving that D disposition to a `how-to/` caveat rather than
   a `surface-inventory` matrix row in the next planning patch. Cosmetic.

3. **WSL Codex panel finding #3 (Tracks B/C playground-claim) is genuinely closed.** Tracks B/C
   each carry a pre-authoring proof-or-rescope gate (`tutorial-proof-plans.md`); Tracks A/D are
   playground-direct. The claim in `doc-architecture-v3.md:117` ("App rosters validated against
   the `netscript-start/apps/playground` showcase") is true for A/D only; B/C explicitly do not
   claim playground validation. The grounding is honest.

4. **The WSL Codex panel finding #2 ("public-surface inventory incomplete") is partially closed.**
   The inventory *exists* and classifies the bulk of the surface, but the totals are wrong (see
   note 1) and `createJobTools` is misclassified (see note 2). These are bookkeeping fixes; they
   do not undo the closure.

5. **`archetype` removal is consistent.** `doc-architecture-v3.md:83` IA tree notes
   "plugin-system … NO archetype taxonomy — OD6"; `plan.md` OD6/WS7/S14 all align; leakage scanner
   spec denies `\barchetype\b`, `axiom A\d+`, `fitness function`, `the doctrine`. No
   reintroduction anywhere in the planning artifacts.

6. **Public voice cleanup is coherent.** Zero harness/OpenHands/Codex/Claude/WSL/agent/
   supervisor/evaluator/run-id/PR#/`.llm`-path leakage in *rendered* prose; the leakage scanner
   spec (§5) is deterministic with explicit deny patterns + allowlist; the 19-instance audit
   (`ground/leakage-diagram-barraising.md`) maps to WS5/WS7/WS8 workstreams.

7. **No `packages/**`/`plugins/**` code, no `docs/site/**`, no `deno.lock` changes** on this PR
   (verified `commits.md`). Planning-only as required.

---

## Required follow-ups (next planning patch — non-blocking, but worth addressing before the build run)

> These are **not** Plan-Gate checklist items and **do not** change this verdict. They are
> bookkeeping the build run should fix in its first slice so the surface-completeness check (S12)
> and the leakage scanner are reproducible against the real numbers.

1. `surface-inventory.md:6` — correct the totals: **"31 published units, 210 export subpaths"**.
2. `surface-inventory.md` per-unit parentheticals — fix the 7 under-counted units so each row's
   `(N)` matches the number of export-map entries for that unit (`plugin-sagas-core` 19,
   `plugin-workers-core` 16, `plugin-auth-core` 9, `plugin-triggers-core` 11, `plugin-triggers`
   10, `fresh` 12, `queue` 13).
3. `surface-inventory.md` `plugin-workers-core` row — drop the "job-tools `createJobTools` no-op
   → badge+caveat" D disposition (it is a scaffold helper, not a published subpath). Move that
   caveat to a `how-to/` note instead.
4. `plan.md:161, 183` — update S12 + the §5 surface-completeness gate to assert against the real
   210-subpath count, not 242.
5. `plan.md:163` — Track B proof gate (`tutorial-proof-plans.md` Track B) explicitly states
   multi-tenant "orgs/RBAC" claims are limited to what the auth backends expose, with a rescope
   fallback. Good — but please ensure the build run actually exercises that fallback when the
   proof gate runs.

---

## Why PASS (not FAIL_PLAN)

- Every Plan-Gate checklist box is satisfied.
- The independent spot-checks confirm that the load-bearing findings (Tracks B/C grounding,
  `archetype` removal, marketplace stubs, marketplace CLI scope, deploy scope, hub content
  contracts, xref system) are genuinely closed — not just papered over.
- The numerical inconsistencies in `surface-inventory.md` are bookkeeping, not a missing
  mandatory artifact. The inventory classifies every shipped subpath; the totals in the
  headline and 7 parentheticals are wrong. They will not change the architecture or the slices;
  they will only affect the S12 script if the build run reads "242" off the headline.
- Open-decision sweep finds no decision that would force rework.
- No `docs/site/**` or framework code is touched (planning-only PR).

Implementation may begin the build run on a **fresh planning patch** that first applies the
five non-blocking follow-ups above (so S12's `210-subpath` count matches the inventory and the
D-badge is on a real artifact).