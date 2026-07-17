<!-- seed:plan-unified-runtime slot:slot-map -->

# Canonical slot map — draft → slot with merge transforms

> Stage-E rework artifact (Stage-F F8/F10/F17). One canonical body per UR slot lives in
> `design/canonical/UR-<n>.md`; this file is the authoritative **draft → slot** mapping with the exact
> merge transform for every slot, so the Stage-H filer never composes prose on the fly. Namespace is
> normalized **once** to **UR-0…UR-12** (UR-H renamed to UR-12), plus the non-slot successor
> **DD-RESEARCH**.

## Namespace (13 UR slots + 1 successor card)

| Slot | Canonical file | Title | Owning pack | New at Stage-E? |
| --- | --- | --- | --- | --- |
| UR-0 | `UR-0.md` | Hostable-service lifecycle contract | D1 | **NEW** (F5) |
| UR-1 | `UR-1.md` | Single logical composition root / no-loopback | D1 (D1-1) | — |
| UR-2 | `UR-2.md` | Nitro owns listener/lifecycle; single-shot close | D1 (D1-2) | — |
| UR-3 | `UR-3.md` | Fresh mount via `app.handler()` + route/static | D1 (D1-3) | — |
| UR-4 | `UR-4.md` | In-process oRPC host bridge (host-side only) | D1 (D1-4) | — |
| UR-5 | `UR-5.md` | Capability manifest + rejection compiler + sagas | D2 (D2-S1 + D2-S2) | merged |
| UR-6 | `UR-6.md` | Runtime-cell columns: 3 v1 cells + conformance | D2 (D2-S3+S5+S6) | merged |
| UR-7 | `UR-7.md` | Writer-ownership & exclusive-lock capability | D2 (D2-S4) | — |
| UR-8 | `UR-8.md` | Offline-sync profile contract | D2 (D2-S7) | — |
| UR-9 | `UR-9.md` | KV/queue/cache ownership + durability | D2 (D2-S3, KV/queue portion) | — |
| UR-10 | `UR-10.md` | Single-process realization capability | D1+D2 | — |
| UR-11 | `UR-11.md` | Architecture contracts (+ db-naming normalization) | D3 | **NEW** (F14); absorbs old UR-11 |
| UR-12 | `UR-12.md` | Epic acceptance + reconciliation (was UR-H) | D3 | renamed from UR-H (F17) |
| DD-RESEARCH | `DD-RESEARCH.md` | New-platform Deno Deploy probe (successor) | D2 | **NEW** (F1); NOT a v1 cell |

## Merge transforms (draft → canonical slot)

- **UR-0** ← new. Lifecycle contract from Stage-F F5 + repo citations
  (`service-builder-impl.ts:423-432,501-521`, `service-shutdown.ts:1-135`). No draft predecessor.
- **UR-1** ← D1-1 verbatim scope; added `epic:deployment` label + `status:plan`; milestone → beta.13;
  added dependency on UR-11.
- **UR-2** ← D1-2; **transform:** the "exactly once disposal registry" is rewritten to **delegate to
  the UR-0 lifecycle contract / `ServiceShutdownCoordinator` policy** (F5), not a bespoke registry.
- **UR-3** ← D1-3 verbatim; static-ownership default tagged to **F-5**.
- **UR-4** ← D1-4; **transform:** re-scoped to **host-side bridge only**; the `folds #451` /
  `Closes #451` language is **removed**; #451 KEEP note added; restored **F-7** (SDK↔service
  direction, #451 O-1) as a Fork delta; WebSocket case tagged **F-4**.
- **UR-5** ← **merge of D2-S1 (manifest + compiler) and D2-S2 (per-preset sagas)** into one card
  (both are the "framework + build-time rejection + saga declaration" surface). Requirement schema +
  build seam delegated to UR-11.
- **UR-6** ← **merge of D2-S3 cell listing + D2-S5 (task/schedule) conformance framing + D2-S6
  (four-cell conformance suite)**; **transform:** `deno_deploy` (C2) **withdrawn** from the v1 set →
  three cells (`deno_server`, `node_server`, `cloudflare_module`); C2 claims marked
  withdrawn-pending-research; DD-RESEARCH successor referenced; **F-1** + **F-2** Fork deltas.
- **UR-7** ← D2-S4; **transform:** re-scoped to **capability contract only**; `folds #453` /
  `Closes #453` removed; #453 KEEP note added (desktop realization stays on #830).
- **UR-8** ← D2-S7; **transform:** re-scoped to **profile/prerequisite contract only**; `folds #455` /
  `Closes #455` removed; #455 KEEP note added; milestone → beta.13 (contract), #455 impl deferred via
  **F-10**.
- **UR-9** ← D2-S3 (KV/queue/cache + durability portion, split from the database-naming concern which
  moves to UR-11).
- **UR-10** ← D3 UR-10 slot (D1+D2); **transform:** re-scoped to **capability + realization contract**;
  `re-scopes #454` / `Closes #454` removed; #454 KEEP note added; the #454 body **addendum** (scoping
  physical single-process to in-process-capable presets) is a non-closing reconciliation edit filed
  per **F-16**, not a fold.
- **UR-11** ← **new architecture-contracts card (F14)** that **absorbs the former UR-11**
  board-language normalization (db naming is a package/export-ownership concern). Prerequisite for
  UR-1/UR-4/UR-5.
- **UR-12** ← former **UR-H** epic-acceptance card, renamed (F17); three-cell acceptance; supersession
  reconciliation incl. #327/#349.
- **DD-RESEARCH** ← new successor card (F1); holds the withdrawn `deno_deploy` re-proof; NOT filed as a
  v1 capability cell.

## Milestone train (one train — F9/F-9)

All UR-0…UR-12 land at **`0.0.1-beta.13`** (the single normative train). Deferred **cells/impl** are
split into separately-milestoned successors, never a single issue closing across milestones:

- **DD-RESEARCH** (deno_deploy re-proof) → `0.0.1-stable`.
- **#455** offline-sync **implementation** (KEEP, downstream of UR-8) → `0.0.1-stable` (default F-10-A)
  or `Backlog / Triage` (F-10-B).

## Legacy issue dispositions (all KEEP — zero filing-time closes)

| Legacy | Slot relationship | Disposition | Closes via |
| --- | --- | --- | --- |
| #451 | UR-4 (host bridge is a subset of #451's SDK surface) | **KEEP OPEN** | its own SDK-slice PR `Closes #451` |
| #453 | UR-7 (capability foundation) | **KEEP OPEN** (desktop realization on #830) | its own realization PR `Closes #453` |
| #454 | UR-10 (realization foundation) | **KEEP OPEN** + non-closing body addendum (F-16) | its own realization PR `Closes #454` |
| #455 | UR-8 (profile foundation) | **KEEP OPEN** | its own impl PR `Closes #455` |
| #327 | UR-5 saga rule | **KEEP OPEN** + non-closing addendum superseding D1 saga exclusion (F-17) | — (epic/parent; never closed here) |
| #349 | UR-6 tier-3 successor | already CLOSED; status-label correction only (F-17) | — |
