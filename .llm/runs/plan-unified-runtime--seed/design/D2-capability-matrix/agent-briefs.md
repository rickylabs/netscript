# D2 — Implementation-lane agent briefs (DRAFT skeletons)

DRAFT skeletons for the implementation lanes that will execute the D2 issues **after** Stage-H
filing. One brief per draft issue (`D2-S1`…`D2-S7`). Each brief is launched from **GitHub + this
design pack**, not this run's chat history (seed-run Stage-I). Every brief carries `use harness`, a
`## SKILL` chapter, and the **verbatim stop-lines** — a sub-brief without the stop-lines section is
invalid.

Routing: select provider/model/effort per `.llm/harness/workflow/lane-policy.md`; do not restate
routes here. Implementation slices touching `packages/`/`plugins/` framework source run on the **WSL
Codex** daemon-attached lane (CLAUDE.md workflow policy). Evaluation runs in a **separate
opposite-family session**.

---

## Shared stop-lines (HARD — included verbatim in every brief below)

```
## Stop-lines (HARD — read twice)
1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable) —
   owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
```

---

## Brief D2-S1 — Preset capability manifest + build-time rejection compiler

- **use harness.** Issue: `[unified-runtime S?] Preset capability manifest + build-time rejection compiler` (live # from FILING-LOG).
- **## SKILL:** read `netscript-doctrine` (composition root / single-composition-root rule,
  `docs/architecture/doctrine/07-composition-and-extension.md`), `netscript-cli`
  (scaffold/build surface), `netscript-tools` (scoped check/lint/fmt, gate evidence). Read
  `design/D2-capability-matrix/proposal.md` §3–§4 as the contract.
- **Scope:** manifest schema per cell + composition compiler that reads logical-graph requirements
  and fails the build on `unsupported`, warns on `partial`. Contract-first: schema → compiler →
  tests.
- **Out of scope:** the port adapters themselves (S3), saga proofs (S2), listener/lifecycle bridge
  (owned by D1 composition-host).
- **Validation:** scoped `deno check`/`lint`; unit tests for reject/warn/pass paths; do not run the
  full `e2e:cli scaffold.runtime` per loop (reserve for eval/merge-readiness).
- **Stop-lines:** (paste the Shared stop-lines block verbatim.)

## Brief D2-S2 — Per-preset sagas declaration & durability-tier proof

- **use harness.** Issue: `[unified-runtime S?] Per-preset sagas capability declaration & durability-tier proof`.
- **## SKILL:** `netscript-doctrine` (runtime-state/failure doctrine
  `docs/architecture/doctrine/08-runtime-state-failure.md`), `netscript-harness`. Read
  `sagas-constraint.md` (full) + `proposal.md` §2.1.
- **Scope:** implement `sagas: supported | externalized | rejected` per cell; wire in-process saga
  runtime shutdown to the composition root's `close` ordering (from D1); build-reject in-process
  sagas on bounded-window cells absent an externalization target. Never substitute a Nitro task.
- **Out of scope:** manifest/compiler mechanics (S1, consume it); macro-service topology authoring.
- **Validation:** scoped check/lint; saga drain-on-close test; build-reject test on C2/C4.
- **Stop-lines:** (paste the Shared stop-lines block verbatim.)

## Brief D2-S3 — KV / queue / database host-binding adapters

- **use harness.** Issue: `[unified-runtime S?] KV/queue/database Nitro host-bindings behind NetScript ports`.
- **## SKILL:** `netscript-doctrine` (ports/adapters, wrap-don't-reinvent),
  `netscript-deno-toolchain` (`deno doc` the shipped `KvStore`/`MessageQueue`/`DatabaseAdapter`
  surfaces before touching them). Read `adapter-mapping.md` (full) + `proposal.md` §2.2–§2.4.
- **Scope:** Nitro mounts/db0/tasks as host bindings **behind** `@netscript/kv|queue|database`;
  enforce no-leak of unstorage/db0/H3/Hono to app code; keep `ocache` separate from durable KV; use
  shipped `@netscript/database` naming.
- **Out of scope:** writer-lock capability (S4), task/schedule clock (S5).
- **Validation:** scoped check/lint; per-cell mapping tests (L/P/U); import-leak guard test.
- **Stop-lines:** (paste the Shared stop-lines block verbatim.)

## Brief D2-S4 — Writer-ownership & exclusive-lock capability

- **use harness.** Issue: `[unified-runtime S?] Writer-ownership & exclusive-lock database capability`.
- **## SKILL:** `netscript-doctrine`, `netscript-deno-toolchain` (`deno doc` `DatabaseAdapter`).
  Read `drift-ledger.md` D-08 + `proposal.md` §2.5.
- **Scope:** declared exclusive-lock/writer-ownership capability; supported on C1/C3, reject/
  externalize on C2/C4; embedded-Turso default never silently overrides a topology constraint.
- **Out of scope:** offline sync (S7), general DB adapter wiring (S3).
- **Validation:** scoped check/lint; lock-capability build test per cell.
- **Stop-lines:** (paste the Shared stop-lines block verbatim.)

## Brief D2-S5 — Task / schedule activation-adapter mapping

- **use harness.** Issue: `[unified-runtime S?] Task/schedule activation-adapter mapping`.
- **## SKILL:** `netscript-doctrine`, `netscript-cli`. Read `adapter-mapping.md` Cron/One-off/
  Durable-workflow rows + `proposal.md` §2.7.
- **Scope:** Nitro croner/provider-schedule as activation clock into worker+trigger cores; guard
  same-name coalescing vs declared concurrency; externalize durable workflow on bounded-window
  cells.
- **Out of scope:** saga scheduling internals (S2), queue delivery (S3).
- **Validation:** scoped check/lint; cron-dispatch test per cell; coalescing-diagnostic test.
- **Stop-lines:** (paste the Shared stop-lines block verbatim.)

## Brief D2-S6 — Four-cell capability conformance gate suite

- **use harness.** Issue: `[unified-runtime S?] Four-cell capability conformance gate suite`.
- **## SKILL:** `netscript-tools` (gate evidence, E2E verdict source), `netscript-cli`
  (`e2e:cli`), `codex-wsl-remote` (run Deno/Aspire E2E on native WSL, avoid `/mnt/c` DrvFS).
  Read `nitro-v3.md` Board inputs + `proposal.md` §1, §4.
- **Scope:** conformance suite asserting each cell's manifest; Nitro version + compatibility-date
  pin + upgrade drift check; `deno_server` vs `deno_deploy` exercised as distinct cells.
- **Out of scope:** the manifests themselves (S1); this suite consumes them.
- **Validation:** this IS the gate lane — run `deno task e2e:cli` variants at merge-readiness; native
  WSL; report raw exit codes. Do not run the expensive full smoke every implementation loop.
- **Stop-lines:** (paste the Shared stop-lines block verbatim.)

## Brief D2-S7 (defer) — Offline-sync database-target capability profile

- **use harness.** Issue: `[unified-runtime S?] Offline-sync database-target capability profile`.
- **## SKILL:** `netscript-doctrine`. Read `drift-ledger.md` D-09 + `proposal.md` §2.6. Track-only
  in v1 unless the desktop wave pulls it forward.
- **Scope:** offline sync as a database-target profile flag; cross-reference the D-04 desktop target
  adapter; server/edge cells expose `profile`/`n/a` only.
- **Out of scope:** desktop distribution/rollout mechanics (D-04 adapter owns those).
- **Validation:** scoped check/lint; profile-declaration test.
- **Stop-lines:** (paste the Shared stop-lines block verbatim.)
