# Deploy op-contract reconciliation (epic #327 supervisor decision)

Surfaced by the **#342 PLAN-EVAL FAIL_PLAN** (finding B1): main ships a 3-op deploy
port while #338's ratified doctrine specifies a 7-op contract. This note is the
authoritative reconciliation. It is an **internal architecture decision** by the
epic #327 supervisor (the #338 owner) — not a user product decision. Both the #338
doctrine finalization and the #342 replan consume this note.

## Facts (verified firsthand against main / worktree source)

- **Shipped seed (main):** `packages/cli/src/kernel/domain/deploy/deploy-target-port.ts`
  defines `DeployTargetPort` with a **3-op** surface — `build | install | uninstall`
  (all optional) — plus `DeployTargetRequest`/`DeployTargetResult`. The reference
  adapter `windows-service-deploy-target.ts` (`WindowsServiceDeployTarget`,
  key `windows-service`) is a **stub**: each op resolves a canned message and
  delegates no real work. Landed by commit **`3137e455`** (2026-06-17), an unrelated
  command-registry slice — **not** #338, and **not** part of the deployment epic design.
- **Ratified doctrine (#338):** Archetype 7 defines a **7-op** uniform contract —
  `plan`/`emit` · `up` · `down` · `status` · `logs` · `rollback` · `secrets` — behind
  an `OsServicePort` (bare-metal) + cloud-adapter seam, adapters implementing the subset
  they support, gates seeded `reviewed`.
- **#342 error:** its research misattributed the shipped 3-op port to #338 and then
  demoted the ratified 7-op doctrine to "stale corpus," conforming the flagship Deno
  Deploy adapter to 3-op. That inverts the authority (code stub over designed doctrine)
  and is not #342's call to make in a marquee slice.

## Decision

1. **The 7-op lifecycle is the canonical epic contract.** `plan`/`emit` · `up` · `down`
   · `status` · `logs` · `rollback` · `secrets` stands as the designed north star.
   Adapters implement the subset they support; `F-DEPLOY-*` stay seeded `reviewed`.
   #342 does **not** get to demote it.
2. **The shipped 3-op `DeployTargetPort` is the current *seed* skeleton**, implementing
   the `build/install/uninstall` ≈ `plan-emit / up / down` subset. It is real but a
   placeholder (stub adapter, no behavior). Doctrine must **acknowledge it**, not pretend
   no port exists and not call it stale.
3. **Verb-vocabulary lock is deferred to the first real adapter (#339/#340).** The epic
   expands the seed `DeployTargetPort` → the full 7-op `OsServicePort`/cloud-adapter
   contract; the final canonical verb names (keep `build/install/uninstall`, adopt
   `up/down`, or a hybrid) lock at that impl. Until then doctrine records the mapping:
   `build → plan/emit`, `install → up`, `uninstall → down`; `status`/`logs`/`rollback`/
   `secrets` are net-new lifecycle ops the seed does not yet have.
4. **Reconciliation is recorded as arch-debt** (the deployment core-centralization entry,
   #338 Slice 3): "seed `DeployTargetPort` (3-op stub, `3137e455`) → expand to 7-op
   `OsServicePort`/cloud-adapter contract across #339–#343; migrate/retire the
   `windows-service` stub." Closing gate = `F-DEPLOY-1` promoted `gated`.

## Actions

- **#338 (in-flight impl, PR #357):** additive follow-up — (a) one prose line in
  Archetype 7 acknowledging the existing shipped `DeployTargetPort`/`WindowsServiceDeployTarget`
  seed + the verb map; (b) fold the 3-op→7-op expansion into the Slice 3 arch-debt entry.
  No renumber, no contract change — the 7-op doctrine stays canonical.
- **#342 (replan):** correct the misattribution (port is main's `3137e455`, not #338's);
  conform the Deno Deploy adapter to the **7-op** doctrine (implement its supported subset —
  Deno Deploy has no `install/uninstall`-on-host; it maps `up`→`deno deploy`, `status`/`logs`
  →platform API, `rollback`→platform mechanism); where it touches the registry, extend the
  seed port toward the contract, never entrench 3-op. Apply S-1 (name/commit Archetype 7 once
  #338 lands), S-2 (re-baseline S1 schema vs merged main), S-3 (drop the "#337 not merged"
  premise — it is merged). The two NEEDS-USER items (CLI-push-vs-GitHub-push default; CI
  non-interactive `deno deploy` auth) remain user-surfaced and non-blocking to design.
