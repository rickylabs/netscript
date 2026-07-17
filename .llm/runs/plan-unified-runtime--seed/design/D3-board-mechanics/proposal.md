# D3 — Board mechanics: epic decomposition, milestone train, supersession map

> **DRAFT — no GitHub mutation.** This pack is Stage-D design text only. Nothing here files,
> edits, labels, milestones, or closes any issue. Board mutation happens once at Stage-H, from the
> committed `filing-manifest.md`, and only after the owner ratifies the decision brief in-turn
> (`seed-run.md` §Stage H). Issue drafts follow `netscript-pr`: colon taxonomy, `Part of #<epic>`
> in bodies, **never** a closing keyword in an issue body or on an epic.

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

| Slot | Title intent | Pack | Folds / re-scopes | Drift | Default milestone |
| --- | --- | --- | --- | --- | --- |
| **UR-1** | Logical composition root + composition-modes contract (one root; logical graph identity is the universal invariant) | D1 | — | D-01 | beta.13 |
| **UR-2** | Nitro v3 host integration — Nitro owns listener/lifecycle/plugins/graceful-close | D1 | — | D-04, D-10 | beta.13 |
| **UR-3** | Fresh mount via `app.handler()` — route/static ownership + **no-nested-`listen()`** acceptance tests | D1 | — | D-10 | beta.13 |
| **UR-4** | oRPC in-process bridge — `RPCLink` over `ServiceApp.fetch`, no second codec; H3-bridge conformance gate; oRPC generation pin | D1 | **folds #451** | D-07, D-11 | beta.13 |
| **UR-5** | Preset × capability contract framework + **build-time rejection** semantics; `sagas: supported\|externalized\|rejected` declared + proven per preset | D2 | — | D-05 | beta.13 |
| **UR-6** | Runtime-cell columns: `deno_server`, `deno_deploy`, one Node server preset, one isolate/serverless preset — each a matrix column, not a global promise | D2 | — | D-01, D-04 | split (see §3) |
| **UR-7** | Database **writer-ownership + lock-compatibility** as a declared capability (default-embedded must not silently override topology) | D2 | **folds #453** | D-08 | beta.13 |
| **UR-8** | Offline-sync as a database-target **capability/profile** (Turso Sync), not a runtime invariant | D2 | **folds #455** | D-09 | stable/backlog |
| **UR-9** | KV/queue/cache ownership + durability policy — remove volatility from the meaning of "in-process"; shipped `@netscript` ports remain the contracts | D2 | — | D-03, D-06 | beta.13 |
| **UR-10** | Single-process **realization** capability + acceptance — physical one-process guarantee scoped to in-process-capable presets | D1+D2 | **re-scopes #454** | D-02 | beta.13 |
| **UR-11** | Board-language normalization to shipped `@netscript/database` (retire `@netscript/data`; facade needs its own contract card if intended) | D3 | — | D-12 | beta.13 |
| **UR-H** | Epic acceptance + reconciliation card (capability-matrix green across the v1 cells; supersession reconciliation closed out) | D3 | — | — | beta.13 |

UR-6 is deliberately one **matrix issue with per-cell acceptance**, not four issues, so the "one
deploy output across cells" story has a single acceptance surface; the deferred cell (tier-3
serverless) is called out per-row rather than as a separate card (owner fork OF-4).

---

## 3. Milestone train

Live anchors (verified from issue milestones, 2026-07-18): the release train runs
`beta.11` (this seed) → `beta.12` (PM #510) → `beta.13` (#823 unified marquee) →
`beta.14` (#830 desktop). `#823` is live at **`0.0.1-beta.13`**; `#830` at `0.0.1-beta.14`.

| Band | Milestone | Contents | Rationale |
| --- | --- | --- | --- |
| Seed | `0.0.1-beta.11` | #824 (this run) — planning only | seed produces the board, ships no code |
| Foundation (consumed, not filed here) | `0.0.1-beta.12` | PM #510; packaging/install/update substrate #456/#457; `.NET Aspire` packaging #825 | #823 body: "implementation marquee **after** PM (#510) ships beta.12"; desktop consumes both |
| **Marquee** | `0.0.1-beta.13` | UR-1…UR-5, UR-7, UR-9, UR-10, UR-11, UR-H; UR-6 tier-1/2 cells (`deno_server`, `deno_deploy`) + Node server cell | delivers the "one deploy output" contender story on stable-enough presets |
| Deferred cell | `0.0.1-beta.14` **or** `0.0.1-stable` | UR-6 isolate/serverless (tier-3: Vercel/CF/Netlify) cell | inherits #349's deferred posture; Nitro preset still `--unstable` (D-01/D-04). **Owner fork OF-4** |
| Deferred capability | `0.0.1-stable` (or `Backlog / Triage`) | UR-8 offline-sync (#455 was `priority:p3`) | D-09 keeps it a profile, not a v1 invariant; matches #455 priority |

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
 SPINE (D1)               ▼
   UR-1 logical root ──┬──► UR-2 Nitro host ──► UR-3 Fresh mount
                       │                          │
                       └──► UR-4 oRPC bridge ◄────┘   (folds #451; #451 "land early")
                                 │
 MATRIX (D2)                     │
   UR-1 ──► UR-5 preset×capability framework
              ├──► UR-6 runtime cells (deno_server, deno_deploy, node, isolate)
              ├──► UR-7 writer/lock capability   (folds #453)
              ├──► UR-9 KV/queue/cache + durability
              └──► UR-8 offline-sync profile ◄── UR-10   (folds #455; #455 depends #454)
   UR-4 + UR-7 ──► UR-10 single-process realization  (re-scopes #454; #454 depends #E1,#E3)
   NORMALIZE
   UR-11 database naming (cross-cuts UR-7/UR-9)
   ACCEPTANCE
   UR-6 + UR-10 + supersession reconciliation ──► UR-H epic acceptance
```

The legacy dependency chain in the live bodies (`#451→#454`, `#453→#454`, `#454→#455`) maps cleanly
onto `UR-4→UR-10`, `UR-7→UR-10`, `UR-10→UR-8` — the fold preserves the real ordering, it does not
invent one.

Cross-run edges:
- **vs D1**: UR-1…UR-4, UR-10 (shared) — D1 owns the contract text; D3 owns their slot + milestone.
- **vs D2**: UR-5…UR-10 — D2 owns the capability text; D3 owns their slot + milestone + the fold
  wiring for #453/#455.

---

## 5. Supersession map

Default disposition is **zero filing-time closes**: re-homed issues stay open and are folded when a
downstream implementation PR carries a closing keyword (`Closes #N`) — never at filing, never on an
epic (`netscript-pr` close-gate). Each disposition cites its drift ID.

| Issue | Live state (2026-07-18) | Disposition | Drift | Stage-H action (no close at filing) |
| --- | --- | --- | --- | --- |
| **#451** in-process link-mode adapter | open; `epic:unified-runtime`+`epic:deployment`; `status:research`; ms `Backlog/Triage` | **FOLD → UR-4** | **D-07** | KEEP OPEN. Add `Part of #823`; set ms `0.0.1-beta.13`; leave `epic:deployment` (child of #327 too). Body already matches D-07 (RPCLink over `ServiceApp.fetch`, no bespoke codec). Closes when the **UR-4 PR** carries `Closes #451`. |
| **#453** tursodb single-writer relocation | open; same labels; ms `Backlog/Triage` | **FOLD → UR-7** | **D-08** | KEEP OPEN. Add `Part of #823`; set ms `0.0.1-beta.13`. Re-scope note: writer ownership becomes a **declared capability**, not a composition-root assumption. Closes when the **UR-7 PR** carries `Closes #453`. |
| **#454** true single-process mode | open; same labels; ms `Backlog/Triage` | **RE-SCOPE (KEEP) → UR-10** | **D-02** | KEEP OPEN. Edit acceptance: physical single-process / zero-loopback guarantee **scoped to presets that advertise an in-process capability**; cloud/serverless presets guarantee logical composition + no app-created loopback, not one OS process. Add `Part of #823`; ms `0.0.1-beta.13`. This body edit is the only Stage-H content mutation on a re-homed issue — it is not a close. Closes when the **UR-10 PR** carries `Closes #454`. |
| **#455** offline-first via Turso Sync | open; `priority:p3`; ms `Backlog/Triage` | **FOLD → UR-8** | **D-09** | KEEP OPEN. Add `Part of #823`; keep `priority:p3`; set ms `0.0.1-stable` (or leave `Backlog/Triage` — **OF-5**). Re-scope note: offline-sync is a **database-target capability/profile**, true only for the single-local-writer preset — do not market it for (a)/(b). Closes when the **UR-8 PR** carries `Closes #455`. |
| **#349** RFC-14 WATCH (tier-3 serverless) | **already CLOSED**; `wave:defer`,`type:chore`,`status:triage`; ms `Backlog/Triage` | **CLOSE-as-superseded → CONFIRM (already closed)** | **D-01, D-04** | NO reopen, NO re-close (already closed). #823 body already states "Supersedes the #349 WATCH posture." Optional single reconciliation **cross-link comment** on #349 pointing to #823 + UR-6 tier-3 cell as the successor. Zero filing-time state change. |

Re-labeling note: #451/#453/#454/#455 already carry `epic:unified-runtime` (re-homed pre-seed), so
Stage-H does **not** add the epic label — it adds `Part of #823` body text, corrects the milestone,
and (for #454 only) edits acceptance. Do not strip `epic:deployment` — they remain children of the
#327 deployment umbrella as well.

---

## 6. What D3 explicitly does NOT decide (handed to owner forks / other packs)

- The exact contract text of UR-1…UR-10 (D1/D2 own it).
- Whether UR-6's tier-3 cell lands beta.14 vs stable (OF-4).
- Whether #455/UR-8 sits at `0.0.1-stable` vs `Backlog / Triage` (OF-5).
- Whether a new `0.0.1-stable`-adjacent milestone is needed, or the existing three betas +
  `0.0.1-stable` + `Backlog / Triage` suffice (see `filing-manifest.md` §milestones; OF-6).

See `open-questions.md` for the numbered D3 forks and `decision-brief.md` for the consolidated
owner sweep across all three packs.
