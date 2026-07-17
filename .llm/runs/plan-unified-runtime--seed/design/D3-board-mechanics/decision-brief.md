# Decision brief — owner-fork sweep (unified-runtime seed, all packs)

> **DRAFT — owner ratifies in-turn at Stage-H.** This is the **fully materialized** consolidated
> sweep of every owner decision across the three Stage-D packs plus the Stage-F rework dispositions.
> No placeholders remain; the fork list is renumbered **once** as **F-1…F-17** and is identical to
> `plan.md`'s fork sweep. Supersession dispositions are **SC-1…SC-6**. No decision is silently taken.
> Approval does not survive compaction — re-surface, never route around.

## A. Owner forks (F-1…F-17) — pick per fork; default stated

| F# | Fork | Default | Source |
| --- | --- | --- | --- |
| **F-1** | Isolate/serverless representative cell: `cloudflare_module` vs `vercel`/`netlify_edge`/`aws_lambda` | keep `cloudflare_module` | D2-Q1 |
| **F-2** | v1 cell set: **3-cell** (`deno_server`,`node_server`,`cloudflare_module`) vs re-prove `deno_deploy` on the NEW platform and include it | 3-cell v1; `deno_deploy` → DD-RESEARCH at `0.0.1-stable` | Stage-F F1 |
| **F-3** | Bounded-window sagas in v1: ship `externalized` macro-service path vs reject-only | reject-only v1, externalized v1.1 | D2-Q4 |
| **F-4** | WebSocket/upgrade scope in v1 vs deferred | defer to post-v1 cell proof | D1-Q2 |
| **F-5** | Static-asset ownership: Fresh-owns-islands vs Nitro-owns-all | Fresh-owns-islands | D1-Q1 |
| **F-6** | oRPC generation: hold `^1.14.6` pin vs authorize v2-beta spike | hold pin | D1-Q3 |
| **F-7** | **SDK↔service dependency direction** for the in-process transport: import `type` from `@netscript/service` vs mirror the structural shape (restored **#451 O-1**) | import `type` (reuse shipped structural port) | #451 O-1 (restored, Stage-F F2) |
| **F-8** | `@netscript/database` normalization vs new `@netscript/data` facade card | normalize, no facade | D1-Q5 / D2-Q5 |
| **F-9** | Milestone train: **one train** — all UR-0…UR-12 at `0.0.1-beta.13`; deferred cells/impl split into separately-milestoned successors | as stated | D1-Q4 / D2-Q3 / OF-1 (Stage-F F11) |
| **F-10** | Offline-sync (#455 KEEP; UR-8 profile at beta.13): #455 **impl** milestone `0.0.1-stable` vs `Backlog / Triage` | `0.0.1-stable` | D2-Q6 / OF-5 |
| **F-11** | Epic slug/label: `epic:unified-runtime` vs `epic:deployment` | `unified-runtime` (keep `epic:deployment` too) | D2-Q2 |
| **F-12** | UR-6 granularity: single matrix card w/ per-cell acceptance vs one card per cell | single matrix card | OF-8 |
| **F-13** | `epic:unified-runtime` label-parity PR as a **gated prerequisite** (merged before filing) | yes | OF-7 |
| **F-14** | Desktop consumer boundary: UR-7/UR-10 are **foundations**; #453/#454/#455 KEEP as desktop-realization issues; consumer stays on #830 | boundary holds; KEEP legacy issues | OF-3 (Stage-F F3/F4) |
| **F-15** | Milestone inventory: create no new milestone beyond verifying `0.0.1-stable`/`beta.14` exist | create none | OF-6 |
| **F-16** | #454 non-closing acceptance **addendum** (scope physical single-process to in-process-capable presets) | yes (append, not close) | OF-9 (Stage-F F3) |
| **F-17** | #327 non-closing addendum superseding the D1 saga exclusion + #349 terminal status-label correction | yes to both | Stage-F F13/F16 |

## B. Supersession dispositions — explicit owner confirmations (SC-1…SC-6)

All are **KEEP with zero filing-time close**; folds land later via each legacy issue's own downstream
`Closes #N` PR. Owner confirms each (drift ID cited):

- **SC-1 — #451 KEEP** (D-07). UR-4 is the host-side bridge (a **subset** of #451's SDK transport
  surface). #451 stays open as its own SDK slice; **no `Closes #451`** on UR-4. Confirm.
- **SC-2 — #453 KEEP** (D-08). UR-7 is the writer-ownership **capability foundation**; #453's
  packaged-desktop relocation/lock realization stays open (desktop consumer on #830). **No
  `Closes #453`.** Confirm.
- **SC-3 — #454 KEEP + addendum** (D-02). UR-10 is the realization **foundation**; #454's generated
  link-mode switch + packaged data-plane E2E stay open. The only Stage-H edit is the **non-closing
  acceptance addendum** (F-16). **No `Closes #454`.** Confirm the addendum is authorized.
- **SC-4 — #455 KEEP** (D-09). UR-8 is the profile/prerequisite contract; #455's Turso Sync engine +
  behavioral acceptance stay open. **No `Closes #455`.** Confirm.
- **SC-5 — #349 CONFIRM superseded** (D-01/D-04). Already closed; no reopen/re-close. Correct the
  terminal status label (F-17); optional cross-link comment → #823/UR-6. Confirm.
- **SC-6 — #327 KEEP + non-closing addendum** (Stage-F F13). Append the saga-supersession addendum
  (drafted in `filing-manifest.md` Step 5) linking UR-5; do **not** close or re-home #327's other
  clauses. Confirm.

## C. Notes

- Every UR-0…UR-12 body, label set, milestone, and dependency list is materialized in
  `design/canonical/UR-<n>.md`; the draft→slot merge transforms are in `design/canonical/slot-map.md`.
- The forks that change an issue **body** (F-3, F-4, F-5, F-7, F-8, F-10) carry an explicit **A/B
  delta** inline in the relevant canonical file under `## Fork deltas`, so a selection is filed from
  the committed artifact without post-ratification improvisation. If a selection changes acceptance or
  dependency structure, re-run adversarial/PLAN-EVAL on the materialized branch before filing.

## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11 merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner in-turn.

**F-12 branch-B delta (materialized):** per-cell split = UR-6a/b/c via the same Body template (cell substituted, markers slot:UR-6a|b|c); slot-map +3 rows; UR-12 deps update. (Recheck P12.)
