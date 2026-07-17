# Decision brief — owner-fork sweep (unified-runtime seed, all packs)

> **DRAFT — owner ratifies in-turn at Stage-H.** This is the consolidated numbered sweep of every
> owner decision across the three Stage-D packs (D1 composition-host, D2 capability-matrix, D3
> board-mechanics), plus the supersession dispositions surfaced as explicit confirmations. No
> decision is silently taken. Where a pack's forks are not yet visible to D3 (parallel Stage-D),
> placeholders are left and MUST be reconciled by the Stage-E plan-lock before this brief goes to
> the owner. Approval does not survive compaction — re-surface, never route around.

## A. D3 board-mechanics forks (owner picks)

- **OF-1 — Milestone anchor confirm.** #823 is live at `0.0.1-beta.13`; the marquee UR set
  (UR-1…UR-11 + UR-H) targets beta.13, after PM #510 (beta.12). Confirm beta.13 as the marquee, or
  re-anchor. *Default: beta.13.*
- **OF-2 — Handle namespace.** Adopt `UR-<n>` for #823 children (not the legacy `E-desktop`
  handles on #451/#453/#454/#455). *Default: yes, `UR-<n>`.*
- **OF-3 — Desktop consumer boundary.** UR-10 (single-process realization, re-scoped #454) lives on
  #823; the desktop **consumer** stays on #830 (beta.14, children #831–#839). Confirm D3 does not
  re-file desktop cards. *Default: yes, boundary holds.*
- **OF-4 — Tier-3 serverless cell placement.** UR-6's isolate/serverless cell (Vercel/CF/Netlify —
  the old #349 scope) at `0.0.1-beta.13` alongside the other cells, or deferred to `0.0.1-beta.14`
  / `0.0.1-stable` given the still-`--unstable` Nitro preset (D-01/D-04). *Default: defer the tier-3
  cell to stable; ship deno_server + deno_deploy + Node cell at beta.13.*
- **OF-5 — Offline-sync (#455/UR-8) home.** `0.0.1-stable` vs `Backlog / Triage` (issue is
  `priority:p3`, D-09 makes it a profile not an invariant). *Default: `0.0.1-stable`.*
- **OF-6 — Milestone inventory.** Confirm no new milestone is created — the existing
  beta.11/12/13/14 + `0.0.1-stable` + `Backlog / Triage` cover the train. *Default: create none;
  verify `0.0.1-stable` exists live, else create only that one.*
- **OF-7 — `epic:unified-runtime` label parity.** The label is live but absent from
  `.github/labels.yml`. Approve a one-line parity PR to add it before Stage-H relies on it.
  *Default: yes, file parity PR first.*

## B. Supersession dispositions — explicit owner confirmations

Each is a `KEEP`/`FOLD`/`RE-SCOPE`/`CONFIRM` with **zero filing-time close** (folds land via
downstream `Closes #N` PRs). Owner confirms each disposition (drift ID cited):

- **SC-1 — #451 → FOLD into UR-4** (D-07). Keep open, `Part of #823`, ms beta.13; closes via the
  UR-4 PR. Confirm.
- **SC-2 — #453 → FOLD into UR-7** (D-08). Keep open, writer-ownership becomes a declared
  capability; ms beta.13; closes via the UR-7 PR. Confirm.
- **SC-3 — #454 → RE-SCOPE into UR-10** (D-02). Keep open; acceptance edited so the physical
  single-process / zero-loopback guarantee is scoped to in-process-capable presets; ms beta.13;
  closes via the UR-10 PR. **This is the only Stage-H body edit on a re-homed issue** — confirm the
  edit is authorized.
- **SC-4 — #455 → FOLD into UR-8** (D-09). Keep open, offline-sync is a database profile true only
  for the single-local-writer preset; ms per OF-5; closes via the UR-8 PR. Confirm.
- **SC-5 — #349 → CONFIRM superseded** (D-01/D-04). Already closed; no reopen/re-close; optional
  cross-link comment → #823/UR-6. Confirm no state change.

## C. Cross-pack forks (reconcile at Stage-E)

- **D1 composition-host forks:** `<D1-forks>` — pending D1 pack publication. Expected to include:
  the sdk↔service dependency direction for `ServiceApp` (import `type` vs mirror structural shape —
  live #451 acceptance O-1); the pinned oRPC generation (^1.14.6 vs v2 beta — D-11).
- **D2 capability-matrix forks:** `<D2-forks>` — pending D2 pack publication. Expected to include:
  the exact v1 preset cell set (deno_server / deno_deploy / which Node preset / which
  isolate-serverless preset — synthesis board input 2); the `sagas: supported|externalized|rejected`
  default per cell; KV/queue durability policy defaults (D-03).

> Stage-E owner: replace `<D1-forks>`/`<D2-forks>` with the real numbered forks from those packs'
> `open-questions.md`, renumber the combined sweep contiguously, and confirm none is dropped.

## Stop-lines (HARD)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) —
   owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
