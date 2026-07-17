<!-- seed:plan-unified-runtime slot:UR-8 -->

# UR-8 — Offline-sync as a database-target capability/profile contract (foundation)

- **Slot:** UR-8
- **Owning pack:** D2 capability-matrix (draft D2-S7)
- **Labels:** `type:feat`, `area:database`, `epic:unified-runtime`, `epic:deployment`, `priority:p3`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** UR-7 (writer-ownership capability), UR-10 (single-process realization)
- **Relationship to #455:** #455 stays **OPEN and KEEP** as the offline-sync **implementation** issue
  — see the supersession note below. UR-8 does **not** carry `Closes #455`.

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-8 -->
>
> Model offline sync (e.g. Turso Sync) as a **database-target capability/profile**, not a
> unified-runtime invariant and not an assumption on every Nitro preset. Server/edge cells expose it as
> `profile` / `n/a`; the single-local-writer preset declares it `supported`. Consumed by the desktop
> target adapter on epic #830.
>
> **Scope boundary — this is the profile/prerequisite contract, not the sync engine.** UR-8 declares
> the capability flag and its cross-reference. It does **not** implement #455's Turso Sync
> `pull()`/`push()`, fully-disconnected operation, reconnect reconciliation, or the documented
> last-push-wins / custom-transform conflict policy. #455 stays open as the downstream implementation
> issue (`priority:p3`) and is **not** closed by this card. A track-only profile-declaration PR must
> never carry a closing keyword for #455.
>
> Evidence: `research/drift-ledger.md` D-09; `research/nitro-v3.md` SQL-database maturity;
> `proposal.md` §2.6.

## Acceptance / gates

- [ ] gate: offline sync is declared on the database target, not inherited by every preset
- [ ] gate: cross-reference to the #830 desktop adapter recorded (no v1 ownership of desktop distribution)
- [ ] gate: no `Closes #455` — the Turso Sync engine + behavioral acceptance remain a separate open issue

## Fork deltas

**F-10 (offline-sync #455 home).** UR-8 (the profile contract) lands at `0.0.1-beta.13`. The
**#455 implementation** issue is deferred:
- **A (default):** #455 milestone `0.0.1-stable` (`priority:p3`, D-09 profile-not-invariant).
- **B:** #455 milestone `Backlog / Triage` (track-only until the desktop wave pulls it forward).
Selection changes only #455's milestone, not UR-8's.
