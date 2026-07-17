<!-- seed:plan-unified-runtime slot:DD-RESEARCH -->

# DD-RESEARCH — New-platform Deno Deploy Nitro probe (successor to withdrawn `deno_deploy` cell)

- **Slot:** DD-RESEARCH (successor / deferred — NOT a UR slot, NOT a v1 capability cell)
- **Owning pack:** D2 capability-matrix (Stage-F F1 disposition)
- **Labels:** `type:chore`, `area:deploy`, `epic:unified-runtime`, `epic:deployment`, `priority:p3`, `wave:defer`, `status:research`
- **Milestone:** `0.0.1-stable`
- **Depends on:** UR-6 (three-cell v1 suite as the conformance harness)
- **Blocks:** re-entry of `deno_deploy` into the matrix (F-2 branch B)

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:DD-RESEARCH -->
>
> **Research card, not a capability cell.** The seed corpus validated Deno Deploy **Classic** and its
> `deployctl` flow — both sunset **2026-07-20**. The surviving Deno Deploy uses `deno deploy` with a
> different build/runtime model and does **not** support Deno queues. `deno_deploy` was therefore
> **withdrawn** from the v1 cell set (UR-6). This card holds the work required before it can re-enter:
>
> - Execute a real Nitro v3 **build + deploy + conformance probe** on the **new** Deno Deploy
>   (`deno deploy`, not `deployctl`).
> - Select and prove any **external queue/database bindings** the new platform requires (Deno queues
>   are unavailable; a durable provider-backed queue/DB must be chosen and validated).
> - Re-write the `deno_deploy` capability column (sagas, KV atomics, queue consume, database
>   lifecycle, writer-lock, cron/durable-workflow) against the **proven** new-platform behavior, with
>   dated, reproducible evidence.
>
> Only after this card passes may `deno_deploy` re-enter UR-6 as a fourth conformance cell (**F-2**
> branch B). Until then it makes **no** v1 capability claim.
>
> Evidence: Stage-F finding F1 (Deno Deploy Classic/`deployctl` sunset; new platform lacks queues).

## Acceptance / gates

- [ ] gate: a Nitro v3 output builds and deploys on the new Deno Deploy (`deno deploy`) with dated reproducible evidence
- [ ] gate: an external durable queue + database binding is selected and proven (no reliance on unavailable Deno queues)
- [ ] gate: the `deno_deploy` capability column is rewritten against proven new-platform behavior
- [ ] gate: re-entry into UR-6 gated on this card (no v1 claim before it passes)

## Fork deltas

Governed by **F-2** (3-cell v1 vs re-proven `deno_deploy`). Default keeps this card deferred at
`0.0.1-stable`.
