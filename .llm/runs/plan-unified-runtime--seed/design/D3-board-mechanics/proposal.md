# D3 — Board mechanics: epic decomposition, milestone train, supersession map

> **DRAFT — no GitHub mutation.** This pack is Stage-D design text only. Nothing here files,
> edits, labels, milestones, or closes any issue. Board mutation happens once at Stage-H, from the
> committed `filing-manifest.md`, and only after the owner ratifies the decision brief in-turn
> (`seed-run.md` §Stage H). Issue drafts follow `netscript-pr`: colon taxonomy, `Part of #<epic>`
> in bodies, **never** a closing keyword in an issue body or on an epic.

> **STAGE-F REWORK BANNER (authoritative pointers).** After the Stage-F adversarial pass, the
> canonical, machine-fileable artifacts are `design/canonical/UR-<n>.md` (one body per slot),
> `design/canonical/slot-map.md` (draft→slot merge transforms), and `filing-manifest.md` (resumable
> transaction). Where this proposal's prose disagrees with those, **they win.** Key rework deltas
> reflected below: (a) handle namespace normalized to **UR-0…UR-12** (UR-H → UR-12; new UR-0 lifecycle
> + UR-11 architecture-contracts prerequisites); (b) **all** legacy dispositions are **KEEP with zero
> filing-time closes** — #451/#453/#454/#455 stay open, folds land via each issue's own downstream
> `Closes #N`; (c) v1 is a **3-cell** matrix (`deno_server`,`node_server`,`cloudflare_module`) —
> `deno_deploy` withdrawn to DD-RESEARCH; (d) **one milestone train** — all UR at `0.0.1-beta.13`,
> deferred cells/impl split into separately-milestoned successors; (e) **#327** added to the
> reconciliation map with a non-closing saga-supersession addendum; (f) **#349** terminal status-label
> corrected.

Supervisor: Fable 5 beta-11 orchestrator, seed run `plan-unified-runtime--seed` (#824). This pack
consumes `synthesis.md` (accepted Stage-B verdicts + drift dispositions D-01…D-12) and the live
issue bodies of #451/#453/#454/#455/#349/#823/#830 (fetched read-only 2026-07-18). GitHub wins on
conflict after Stage-H.

---

## 1. Scope boundary between the three packs

D3 owns the **board skeleton**, not the contract text:

- **D1 `composition-host`** authors the issue drafts for the composition spine (logical root, Nitro
  host integration, Fresh mount, oRPC in-process bridge). D3 assigns those drafts to slots
  **UR-1…UR-4** and places them in the milestone train + DAG.
- **D2 `capability-matrix`** authors the issue drafts for the preset × capability contract
  (sagas rule, KV/queue/cache/database ownership, writer/lock, offline-sync, task/schedule
  mapping, build-time rejection). D3 assigns those to slots **UR-5…UR-10** and places them.
- **D3 `board-mechanics`** (this pack) owns: the epic sub-issue **slot table + handle namespace**,
  the **milestone train**, the **cross-pack dependency DAG**, and the **supersession map** for the
  five re-homed/superseded issues. Where D1/D2 have not yet published their drafts, D3 defines the
  slot and its acceptance intent; the pack fills the body.

Handle namespace for epic #823 children: **`UR-<n>`** (unified-runtime). This deliberately does not
reuse the old `E-desktop` handles (`#E1`/`#E3`/`#E4`/`#E5`) carried in the live #451/#453/#454/#455
bodies — those handles belong to the superseded desktop pack and are remapped in §5.

---

## 2. Epic decomposition — sub-issue slot table

Epic **#823** (`type:umbrella`, `epic:unified-runtime`, `wave:v1`, `priority:p1`, milestone
`0.0.1-beta.13`). Children are real sub-issues carrying `epic:unified-runtime` + `Part of #823`.

Namespace normalized to **UR-0…UR-12** (Stage-F F17). Canonical bodies: `design/canonical/UR-<n>.md`.

| Slot | Title intent | Pack | Legacy (all KEEP) | Drift | Milestone |
| --- | --- | --- | --- | --- | --- |
| **UR-0** | **Hostable-service lifecycle contract** — exported build/start/stop preserving startup/shutdown, reusing `ServiceShutdownCoordinator` (NEW, F5) | D1 | — | — | beta.13 |
| **UR-1** | Logical composition root + composition-modes contract (one root; logical graph identity is the universal invariant) | D1 | — | D-01 | beta.13 |
| **UR-2** | Nitro v3 host integration — Nitro owns listener/lifecycle/plugins/graceful-close (drains via UR-0) | D1 | — | D-04, D-10 | beta.13 |
| **UR-3** | Fresh mount via `app.handler()` — route/static ownership + **no-nested-`listen()`** acceptance tests | D1 | — | D-10 | beta.13 |
| **UR-4** | oRPC in-process **host bridge** over `ServiceApp.fetch`, no second codec; H3-bridge conformance gate; oRPC generation pin | D1 | **#451 KEEP** (subset; no close) | D-07, D-11 | beta.13 |
| **UR-5** | Preset × capability contract framework + **build-time rejection**; `sagas: supported\|externalized\|rejected` declared + proven per preset | D2 | — | D-05 | beta.13 |
| **UR-6** | Runtime-cell columns: **3 v1 cells** (`deno_server`, `node_server`, `cloudflare_module`) — each a matrix column, not a global promise; `deno_deploy` withdrawn → DD-RESEARCH | D2 | — | D-01, D-04 | beta.13 |
| **UR-7** | Database **writer-ownership + lock-compatibility** as a declared capability (default-embedded must not silently override topology) | D2 | **#453 KEEP** (no close) | D-08 | beta.13 |
| **UR-8** | Offline-sync as a database-target **capability/profile** (Turso Sync), not a runtime invariant | D2 | **#455 KEEP** (no close) | D-09 | beta.13 |
| **UR-9** | KV/queue/cache ownership + durability policy — remove volatility from the meaning of "in-process"; shipped `@netscript` ports remain the contracts | D2 | — | D-03, D-06 | beta.13 |
| **UR-10** | Single-process **realization** capability + acceptance — physical one-process guarantee scoped to in-process-capable presets | D1+D2 | **#454 KEEP + addendum** (no close) | D-02 | beta.13 |
| **UR-11** | **Architecture contracts** — package/export ownership, archetype, compiler requirement schema + build seam; absorbs `@netscript/database` naming normalization (NEW, F14) | D3 | — | D-12 | beta.13 |
| **UR-12** | Epic acceptance + reconciliation card (was **UR-H**; 3-cell matrix green; supersession reconciliation incl. #327/#349 closed out) | D3 | — | — | beta.13 |
| *DD-RESEARCH* | *(successor, NOT a UR slot)* new-platform Deno Deploy probe; re-proves withdrawn `deno_deploy` | D2 | — | D-01 | stable |

UR-6 is deliberately one **matrix issue with per-cell acceptance**, not one-per-cell, so the "one
deploy output across cells" story has a single acceptance surface (OF-8/F-12). The **3-cell** v1 set
reflects Stage-F F1 (`deno_deploy` withdrawn); the re-proof lives in the DD-RESEARCH successor (F-2).

---

## 3. Milestone train

Live anchors (verified from issue milestones, 2026-07-18): the release train runs
`beta.11` (this seed) → `beta.12` (PM #510) → `beta.13` (#823 unified marquee) →
`beta.14` (#830 desktop). `#823` is live at **`0.0.1-beta.13`**; `#830` at `0.0.1-beta.14`.

**One train (Stage-F F11/F-9):** all UR-0…UR-12 land at `0.0.1-beta.13`. A GitHub issue has one
milestone and one completion state, so deferred **cells/impl** are split into separately-milestoned
**successor** cards — never a single card partly closing across milestones.

| Band | Milestone | Contents | Rationale |
| --- | --- | --- | --- |
| Seed | `0.0.1-beta.11` | #824 (this run) — planning only | seed produces the board, ships no code |
| Foundation (consumed, not filed here) | `0.0.1-beta.12` | PM #510; packaging/install/update substrate #456/#457; `.NET Aspire` packaging #825 | #823 body: "implementation marquee **after** PM (#510) ships beta.12"; desktop consumes both |
| **Marquee (whole UR set)** | `0.0.1-beta.13` | **UR-0…UR-12** — incl. UR-6's **three** v1 cells (`deno_server`, `node_server`, `cloudflare_module`) | one consistent train; delivers the "one deploy output" story on the proven presets |
| Deferred cell (successor card) | `0.0.1-stable` | **DD-RESEARCH** — re-prove `deno_deploy` on the new platform (Deno Deploy Classic/`deployctl` sunset) | not a UR slot; gates `deno_deploy` re-entry (F-2). Replaces the old tier-3 defer row |
| Deferred capability (successor issue) | `0.0.1-stable` (or `Backlog / Triage`) | **#455** offline-sync **implementation** (KEEP, downstream of UR-8) | UR-8 profile contract ships beta.13; the Turso Sync engine stays #455 (F-10) |

The desktop in-process **consumer** of UR-10 lives on epic **#830** (beta.14), not on #823 — #830
already carries its own SD-1…SD-H children (#831–#839). D3 does not re-file desktop cards; it only
ensures UR-10's re-scope (#454) is worded so #830 can consume it (OF-3).

---

## 4. Cross-pack dependency DAG

```
 FOUNDATION (beta.12, external — consumed, not filed here)
   PM #510 ──┐
   #456/#457 packaging ──┐
   #825 Aspire packaging ─┤
                          │
 PREREQS
   UR-11 architecture contracts ──► (UR-1, UR-4, UR-5)
   UR-0 hostable-service lifecycle ──► UR-2
 SPINE (D1)               ▼
   UR-1 logical root ──┬──► UR-2 Nitro host ──► UR-3 Fresh mount
                       │                          │
                       └──► UR-4 oRPC host bridge ◄─┘   (#451 KEEP: UR-4 is a subset, no close)
                                 │
 MATRIX (D2)                     │
   UR-1 ──► UR-5 preset×capability framework
              ├──► UR-6 runtime cells (deno_server, node_server, cloudflare_module; deno_deploy→DD-RESEARCH)
              ├──► UR-7 writer/lock capability   (#453 KEEP, no close)
              ├──► UR-9 KV/queue/cache + durability
              └──► UR-8 offline-sync profile ◄── UR-10   (#455 KEEP, no close)
   UR-4 + UR-7 ──► UR-10 single-process realization  (#454 KEEP + addendum, no close)
   ACCEPTANCE
   UR-6 + UR-10 + supersession reconciliation ──► UR-12 epic acceptance (was UR-H)
```

The legacy dependency chain in the live bodies (`#451→#454`, `#453→#454`, `#454→#455`) maps onto the
UR **dependency** edges `UR-4→UR-10`, `UR-7→UR-10`, `UR-10→UR-8`. These are prerequisite edges, not
folds: each legacy issue stays open and closes via its own downstream `Closes #N`. (Board-language
normalization to `@netscript/database` is absorbed into UR-11 architecture contracts.)

Cross-run edges:
- **vs D1**: UR-1…UR-4, UR-10 (shared) — D1 owns the contract text; D3 owns their slot + milestone.
- **vs D2**: UR-5…UR-10 — D2 owns the capability text; D3 owns their slot + milestone + the fold
  wiring for #453/#455.

---

## 5. Supersession map

Disposition is **KEEP with zero filing-time closes** (Stage-F rework F2–F4/F13): every re-homed issue
stays open, carries `Part of #823`, and is closed only when its **own** downstream implementation PR
carries a closing keyword (`Closes #N`) — never at filing, never on an epic (`netscript-pr`
close-gate). A UR foundation card is NOT the close-home for the legacy issue; it is a prerequisite the
legacy issue depends on. Each disposition cites its drift ID. **Authoritative bodies + the exact
mutation list live in `filing-manifest.md` Step 5 and `design/canonical/slot-map.md`.**

| Issue | Live state (2026-07-18) | Disposition | Drift | Stage-H action (no close at filing) |
| --- | --- | --- | --- | --- |
| **#451** in-process link-mode / SDK transport | open; `epic:unified-runtime`+`epic:deployment`; ms `Backlog/Triage` | **KEEP** (UR-4 is a host-side **subset**) | **D-07** | KEEP OPEN. Add `Part of #823`; ms `0.0.1-beta.13`. UR-4 realizes only the host bridge; #451's full SDK transport surface (transport registry, `createInProcessClientLink`, HTTP parity, W3C propagation, JSR gates, **O-1**/F-7) remains its own open SDK slice. **No `Closes #451` on UR-4.** |
| **#453** tursodb single-writer relocation | open; same labels; ms `Backlog/Triage` | **KEEP** (UR-7 = capability foundation) | **D-08** | KEEP OPEN. Add `Part of #823` + capability re-scope note; ms `0.0.1-beta.13`. Packaged-desktop relocation/lock realization stays open (desktop consumer on #830). **No `Closes #453`.** |
| **#454** true single-process mode | open; same labels; ms `Backlog/Triage` | **KEEP + non-closing addendum** (UR-10 = realization foundation) | **D-02** | KEEP OPEN. Append `Part of #823` + the **non-closing acceptance addendum** scoping physical single-process/zero-loopback to in-process-capable presets (F-16). ms `0.0.1-beta.13`. The generated link-mode switch + packaged data-plane E2E stay open. **No `Closes #454`.** |
| **#455** offline-first via Turso Sync | open; `priority:p3`; ms `Backlog/Triage` | **KEEP** (UR-8 = profile contract) | **D-09** | KEEP OPEN. Add `Part of #823` + profile note; keep `priority:p3`; ms `0.0.1-stable` (F-10 default) or `Backlog/Triage`. The Turso Sync engine + behavioral acceptance stay open. **No `Closes #455`.** |
| **#327** deployment umbrella (D1 saga exclusion) | **open**; parent umbrella | **KEEP + non-closing addendum** (F-17) | **D-05** | KEEP OPEN. Append the non-closing saga-supersession addendum (`filing-manifest.md` Step 5) superseding the D1 "excludes sagas / not-v1 / 3–5 months" language with the per-preset capability rule + UR-5 link. No other clause touched; no close. |
| **#349** RFC-14 WATCH (tier-3 serverless) | **already CLOSED**; `status:triage`; ms `Backlog/Triage` | **CONFIRM superseded + status-label fix** (F-17) | **D-01, D-04** | NO reopen/re-close. **Correct the terminal status label**: completed→`status:shipped` or not-planned→no status (classify at ratification); `status:triage` on a closed issue is invalid per `.github/labels.yml`. Optional cross-link comment → #823 + UR-6 successor (DD-RESEARCH). |

Re-labeling note: #451/#453/#454/#455 already carry `epic:unified-runtime` (re-homed pre-seed), so
Stage-H does **not** add the epic label — it adds `Part of #823` body text, corrects the milestone,
and (for #454 only) appends the non-closing addendum. Do not strip `epic:deployment` — they remain
children of the #327 deployment umbrella as well.

---

## 6. What D3 explicitly does NOT decide (handed to owner forks / other packs)

- The exact contract text of UR-0…UR-10 (D1/D2 own it; canonical bodies in `design/canonical/`).
- Whether v1 stays 3-cell or re-proves `deno_deploy` via DD-RESEARCH (F-2).
- Whether #455 offline-sync **impl** sits at `0.0.1-stable` vs `Backlog / Triage` (F-10).
- Whether a new `0.0.1-stable`-adjacent milestone is needed, or the existing three betas +
  `0.0.1-stable` + `Backlog / Triage` suffice (see `filing-manifest.md` §milestones; OF-6).

See `open-questions.md` for the numbered D3 forks and `decision-brief.md` for the consolidated
owner sweep across all three packs.
