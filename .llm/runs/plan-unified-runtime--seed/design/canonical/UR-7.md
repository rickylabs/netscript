<!-- seed:plan-unified-runtime slot:UR-7 -->

# UR-7 — Writer-ownership & exclusive-lock database capability (foundation)

- **Slot:** UR-7
- **Owning pack:** D2 capability-matrix (draft D2-S4)
- **Labels:** `type:feat`, `area:database`, `epic:unified-runtime`, `epic:deployment`, `priority:p1`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** UR-5 (capability framework)
- **Blocks:** UR-10
- **Relationship to #453:** #453 stays **OPEN and KEEP** as the desktop-realization issue — see the
  supersession note below. UR-7 does **not** carry `Closes #453`.

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-7 -->
>
> Make writer ownership and exclusive-lock compatibility a **declared database capability**. "Default
> embedded" (single-writer Turso at the root) must not silently override topology constraints.
> Long-lived cells (C1 `deno_server` / C3 `node_server`) may hold an exclusive lock; bounded-window
> cells (C4 `cloudflare_module`) mark it `unsupported in-cell` → externalize or build-reject.
>
> **Scope boundary — this is the capability contract, not the desktop realization.** UR-7 declares the
> writer-ownership capability at the matrix level. It does **not** implement #453's OS-specific
> per-user data-dir relocation, `DATABASE_URL` resolution, real-filesystem Prisma/Turso path, b→c
> cutover guard, sole-lock-ownership proof, or the validation inside a `deno desktop` packaged binary.
> #453 stays open as the desktop-consumer realization issue (the desktop consumer lives on epic #830)
> and is **not** closed by this card.
>
> Evidence: `research/drift-ledger.md` D-08 (+ RFC §3 "locks earn a graph edge"); `proposal.md` §2.5.

## Acceptance / gates

- [ ] gate: exclusive-lock single-writer requirement builds on C1/C3 and build-rejects (or externalizes) on C4
- [ ] gate: embedded-Turso default never activates where a topology constraint forbids it (no silent override)
- [ ] gate: no `Closes #453` — #453's packaged-desktop relocation/lock realization remains a separate open issue on #830

## Fork deltas

None (v1 cell set governed by F-2 in UR-6).
