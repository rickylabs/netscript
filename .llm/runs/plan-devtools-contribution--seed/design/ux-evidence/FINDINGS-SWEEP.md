# Stage-D2 findings sweep — all 22, none deferred

Owner directive, 2026-08-11: *"Sweep ALL 11 Qwen + 11 Kimi findings and mark each fixed/declined with
normative anchor — no deferred acceptance remains."*

**Result: 22 findings — 21 `FIXED`, 1 `DECLINED` with reason. Zero deferred.**

Anchors are to `docs/architecture/rfc/rfc-0002-devtools-contribution.md` unless stated. Adjudication
detail and the verification of each anchor lives in `qwen-triage.md` / `kimi-triage.md`; this file is
the closure ledger.

## Qwen 3.8 Max — architecture lane (`DESIGN-FINDINGS: 1 critical, 5 major, 5 minor`)

| # | Sev | Finding | Status | Normative anchor |
| - | --- | ------- | ------ | ---------------- |
| Q-C1 | critical | Trust antecedent contradicted by the RFC's own JSR install + in-process import | **FIXED** | §9 D-1 "the antecedent is narrower than an earlier draft claimed" + the two-surface table; **T-10**, **INV-9**, **G-10** |
| Q-M1 | major | Anchors keyed in a format identity never emits — anchor tier silently dead | **FIXED** | §6 `DevToolsZoneDescriptor.anchors` — identity form `<mountId>/<id>/v<apiMajor>`; unmatched anchor = generate-time **warning** |
| Q-M2 | major | "Ranked problem feed" a half-propagated relabel — no rule, no schema, 2 of 6 sources uncomputable | **FIXED** | §11.3.1 (coverage) + **§11.3.2** (`FeedRow`, severity vocabulary, deterministic total order, per-source computability) |
| Q-M3 | major | `DevToolsUiNode` cannot express the v1 flagship — string-only table cells | **FIXED** | §7 `DevToolsCell`; `rows: readonly (readonly DevToolsCell[])[]` |
| Q-M4 | major | Zone versioning specified but never applied; contexts comment-only `unknown` | **FIXED** | §6/§7 `DevToolsZoneContextMap`, suffixed ids (`'workers.console/v1'`), exact-match rule, quarantine state 6 `zone-contract-mismatch` |
| Q-M5 | major | State matrix omits `not-running`, which the adopted launcher design requires | **FIXED** | §7 `DevToolsPanelState<T>` arm `not-running` (carries `remedy.cliEquivalent`); consumed by §11.7 |
| Q-m1 | minor | `DevToolsPanelId` referenced but never defined; pre-fix wording in four places | **FIXED** | §8 `DevToolsPanelRef`; `DevToolsPanelId` count now **0** |
| Q-m2 | minor | §5 H-2 lists a `traces/` route §11 drops and AC-1 forbids | **FIXED** | §5 H-2 route sketch → `runtime/ flows/ contracts/ plugins/ generated/ automation/` |
| Q-m3 | minor | "8 trigger kinds" — canonical set is six | **FIXED** | §11.5 → "the **six** canonical trigger kinds", cited to `packages/plugin-triggers-core/src/domain/constants.ts:5-29` |
| Q-m4 | minor | Closed zone vocabulary has no home for the RFC's own third-party example | **FIXED** | §7 — `plugin.detail/v1` is the universal third-party mount; new zones by host release against a filed issue |
| Q-m5 | minor | Supersession map keeps `plugin-dashboard-core` alive beside `devtools-core` | **FIXED** | `design/T9-supersession/supersession-map.md` — **#412 `AMEND` → `SUPERSEDE`**, re-filed as DT-3 |

## Kimi K3 — pure UI/UX lane (`UX-FINDINGS: 1 critical, 5 major, 5 minor`)

| # | Sev | Finding | Status | Normative anchor |
| - | --- | ------- | ------ | ---------------- |
| K-C1 | critical | Home cannot distinguish "nothing is broken" from "DevTools is blind" | **FIXED** | **§11.3.1** — `FeedSource`, `FeedSourceStatus`, `all-clear` only when every source `reported`; else `partial` naming the gap |
| K-M1 | major | `DevToolsUiNode` tables string-only (same defect as Q-M3, found independently) | **FIXED** | §7 `DevToolsCell` |
| K-M1b | major | No `code` element, yet AC-2 requires a rendered CLI-equivalent line | **FIXED** | §7 — `{ kind: 'code'; lang? }` added to `DevToolsUiNode` and to `DevToolsCell` |
| K-M2 | major | Journey view has no index route; in-links inconsistent | **FIXED** | §11.3 decision 4 — bounded `/flows/` index, eviction-honest; §11.5 Workers row in-links journeys like Sagas |
| K-M3 | major | Two panel-state vocabularies with no mapping | **FIXED** | §7 canonical `DevToolsPanelState<T>`; §11.7 consumes it as a rendering checklist; `PanelAvailability` deleted |
| K-M4 | major | Staleness unrepresentable in the normative state contract | **FIXED** | §7 `stale` arm carrying `observedAt`; §11.3.1 `FeedSourceStatus.state = 'stale'` |
| K-M5 | major | Contributor walkthrough dead-ends at data | **FIXED** | **§8 D-6.4b** — worked end-to-end path, 7 code steps + 9-row pass-through table; §6's dangling `requires` now defined |
| K-m1 | minor | "Ranked" has no ranking rule, severity vocabulary, or row schema | **FIXED** | §11.3.2 |
| K-m2 | minor | No shell-level state for app-down / stale generated host | **FIXED** | §11.7 — both sessions named; `not-running` arm |
| K-m3 | minor | §5 route listing contradicts §11 (same as Q-m2, found independently) | **FIXED** | §5 H-2 |
| K-m4 | minor | `/automation/` is filler holding a top-level nav seat | **FIXED** | **§11.3.4** — staged card naming #1446 A2b/A3b/A2d + auth v3, boundary sentence, coverage-strip linkage, promotion criterion |
| K-m5 | minor | No density contract — unbounded histories, no sort/filter/pagination | **FIXED** | **§11.3.3** — 50/200 page sizes, cursor pagination, deterministic sort, typed filters, **mandatory truncation chip**, browser gate |

## The one decline

**Kimi K3's lane note — a follow-up vision pass.** Kimi is the vision-capable lane, but this run is
planning-only: nothing is implemented, so there are no screenshots, mockups, or rendered artifacts.
It reviewed the IA **as text** and its vision capability was unused (drift **D-16**).

**DECLINED for this RFC, with reason and a re-entry condition.** A vision pass needs a prototype to
look at, and building one is implementation — outside a planning-only run's mutation boundary. It is
recorded as a **named follow-up** rather than a gap: once the IA is prototyped (roadmap wave W4/W6),
a Kimi pass *with images* is materially different and stronger evidence, and should be run then.

## Independent cross-lane confirmation

Three findings were reported by **both** lanes, which could not see each other's output:

| Defect | Qwen | Kimi |
| --- | --- | --- |
| String-only table cells | Q-M3 | K-M1 |
| §5 `traces/` route contradiction | Q-m2 | K-m3 |
| Under-specified ranked feed | Q-M2 | K-m1 |

Convergence between an architecture reviewer and a UX reviewer on the same three defects is the
strongest single piece of evidence either pass produced — and the clearest justification for the
owner's lane split over one merged reviewer.

## Counts

| | Qwen | Kimi | Total |
| --- | --- | --- | --- |
| Critical | 1 | 1 | **2** |
| Major | 5 | 5 | **10** |
| Minor | 5 | 5 | **10** |
| **Fixed** | 11 | 10 | **21** |
| **Declined (with re-entry condition)** | 0 | 1 | **1** |
| **Deferred** | 0 | 0 | **0** |
