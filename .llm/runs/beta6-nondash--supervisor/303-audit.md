# PROG-303 (S2) Scope Audit — plugin-service soundness + slow-types + doc-lint

Tier-B Opus read-only audit, 2026-07-06. Baseline: `main` @ `8767f027` (wave-1 run tip). Non-mutating
(only `deno publish --dry-run` + `deno doc --lint` reads). Findings drive the #303 impl brief.

## Headline

**The beta-gate this audit was written to pipeline — "172a-2-SOUND: phantom-typed base contract
seam" — is ALREADY FIXED on `main` (#332, all 4 slices merged, closed 2026-07-03). The slow-types
half of AC1 is effectively met too (all 4 flagged packages publish CLEAN without the flag).** The
genuinely-open #303 work is **AC2 (full-export doc-lint)** plus **mechanical carve-out + stale-debt
cleanup**. #303 is materially smaller than the plan assumed.

| #303 acceptance | Status on `main` (8767f027) |
| --- | --- |
| AC1a plugin services type-sound | **MET** (matrix below; zero Hole-A/Hole-B grep matches) |
| AC1b publish:dry-run clean, no slow-types | **Effectively MET** — 4 flagged pkgs publish clean WITHOUT the flag; only flag-deletion + debt-close remains |
| AC2 doc-lint full export map, every package | **NOT MET** — real gaps (fresh-ui `./interactive` 123 the tentpole; plugin/contracts/cores) |
| AC3 e2e-cli-prod + scaffold.runtime green | release-time gate, out of audit scope |

Prior partial work: `5baa0250` (#483 full-export doc-lint sweep), `86eca907` (#358 slow-types
sanction).

## 2. The seam — REMEDIATED (#332)

`packages/plugin/src/contract-base/domain/base-contract.ts`, now sound:
- `:47-53` `BasePluginDescribeProcedure` = real `ContractProcedure<any, Schema<unknown,
  PluginCapabilities>, ErrorMap, Meta>` (output invariant), not a phantom `__output` marker.
- `:76-81` `BasePluginContract` index signature constrained to `AnyContractRouter` (was `unknown`) →
  `satisfies` is a genuine guard.
- `:109-122` `describe` built with the real oRPC builder `oc.errors(...).route(...).output(...)`; the
  ONLY escape is one self-documented centralized-contract boundary cast at `:119` (mirrors
  `@netscript/contracts` `baseContract`).

History: `066a8da1` (#334), `56ea68b2`/`defa59ee` (#351/#354 migrate CRUD + drop erasing aliases).

## 3. Per-plugin-service soundness matrix — AC1a MET

Sound path: `bindPluginContract`/`assemblePluginContractRouter`
(`packages/plugin/src/service/presentation/plugin-contract-binder.ts`) + `createPluginService`.

| Service | Sound? | Evidence |
| --- | --- | --- |
| workers (reference) | SOUND | `WorkersHandlers<WorkersV1RouteKey>` typed union |
| sagas | SOUND | `SagasHandlers` mapped type; residual casts = sanctioned open-domain saga `state` + KV boundary |
| triggers | SOUND (converged) | `main.ts:239` `createPluginService(router,{rawRoutes})` for HMAC webhooks; all 11 handlers impl |
| auth | SOUND | sound binder; `authV1` typed |
| streams | SOUND (proxy) | `main.ts:82` `createPluginService({}, {serveRpc:false, rawRoutes:[…]})`; base-meta only |
| ai | N/A | `plugins/ai/services/` empty — no HTTP connector; #238 in-flight, do not touch |

Grep for old Hole-B patterns (`v1: any`, `router: any`, bare `Record<string,unknown>` handler maps)
across `plugins/*/services/src/**/router*.ts` → **zero matches**.

⚠️ **Stale debt to close (non-blocking):** `arch-debt.md:418` (`triggers-connector-sound-deferred`)
and `:445` (`streams-connector-sound-deferred`), dated 2026-06-30, describe these as un-converged —
both converged since; close them.

## 4. Slow-types carve-out inventory — all 4 STALE

`--allow-slow-types` appears in exactly 4 `publish:dry-run` tasks. Re-ran dry-run with the flag
REMOVED (`--allow-dirty --no-check=remote`; slow-type analysis is independent of `--no-check`) →
**all 4 printed "Checking for slow types…" then `Success`:**

| Package | deno.json | Debt entry | State |
| --- | --- | --- | --- |
| `packages/contracts` | :19 | :117 | CLEAN without flag |
| `packages/plugin` | :36 | :660 | CLEAN (only non-blocking dynamic-import warnings) |
| `packages/plugin-triggers-core` | :30 | :390 | CLEAN without flag |
| `packages/service` | :15 | :634 | CLEAN without flag |

Likely resolved by the workers-core structural-shim pattern (debt `:1053`) propagating + toolchain
movement. Remaining: delete 4 flags, close 4 T4 debt entries, reconcile #358 doctrine sanction, run
one workspace `publish:dry-run` to certify.

## 5. Doc-lint full-export inventory — the REAL AC2 gap

`.llm/tools/run-deno-doc-lint.ts` (auto-discovers every export) surfaces errors the narrower
2026-06-18 census missed. All confirmed real published exports:

| Package | Failing exports (errors) |
| --- | --- |
| `@netscript/fresh-ui` | `./interactive` (**123**) — `*Namespace`/`*.types` private-type-ref + missing JSDoc (combobox/popover/dialog/drawer/sheet/tooltip/accordion/tabs) **← AC2 tentpole** |
| `@netscript/contracts` | `./crud` (13), `.` (8) |
| `@netscript/plugin` | `./contract-base` (9), `./service` (4) |
| `@netscript/plugin-workers-core` | testing(5), contracts/v1(4), presets(4), state(2), abstracts(1), executor(1) |
| sagas/triggers/auth-core | ~2 each |
| `@netscript/plugin-ai-core` | `.`(14), `./contracts/v1`(2) — **#238-coordinated, DO NOT touch** |
| streams-core, service, cli | **0 — clean** |

**Caveat (needs-verification):** the tool's `summary.totalErrors` scalar under-counts vs
per-entrypoint (workers-core 4 summary vs 17 per-entrypoint); treat per-entrypoint as authoritative;
do a clean authoritative re-sweep across all 26 publish units before certifying AC2.

## 6/7. Fix ordering + slice sizing (beta.6)

Root fix (172a-2-SOUND) already merged → downstream unblocked. **Split into 3 slices; do NOT combine
soundness with doc-lint (soundness is done):**

- **Slice A — carve-out + debt cleanup** (tiny/mechanical, Codex/low-effort). Delete 4 slow-types
  flags; close 4 T4 + 2 stale connector debt entries; reconcile #358. Gate: `deno task
  publish:dry-run` per pkg + workspace → all `Success` without allowances.
- **Slice B — plugin-layer doc-lint** (moderate). contracts, plugin, workers/sagas/triggers/auth-core.
  One commit per package. Gate: `run-deno-doc-lint.ts --root packages/<u>` → 0 across every
  entrypoint; `deno task check --unstable-kv`.
- **Slice C — fresh-ui `./interactive` doc-lint** (self-contained, larger). Export `*Namespace`/
  `*.types` + JSDoc. Gate: `run-deno-doc-lint.ts --root packages/fresh-ui` → 0.

**beta.6 vs stable:** A+B → beta.6; C achievable for beta.6 but the single largest item (could slip
to stable if capacity-bound — it's what blocks a truly-green AC2). plugin-ai-core doc-lint (16)
defers to #238. AC3 = release gate. **AC1a needs no implementation** — only the existing #351/#354 CI
soundness negative fixture as regression guard.

Framework-source edits (fresh-ui type exports, plugin-core private-type exports) are **WSL Codex
daemon-attached slices**, not Claude-workflow lanes.

## 8. Risks / coupling

- **#238:** exclude `plugin-ai-core`/`plugins/ai` from Slices A–C; folds in as #238 converges.
- **`-core` coupling:** exporting currently-private types widens the public surface — respect
  doctrine (public-types-first, `deno doc --lint` bar); re-run dry-run after any `-core` surface
  change (workers-core structural-shim `:1053` keeps slow-types at 0 while exposing route keys —
  don't reintroduce slow-types).
- **ROUTE-TO-PRISMA:** DB layer out of scope; sagas' `Record<string,unknown>` state + KV idempotency
  debt (`:482`) are DB-layer, not soundness — leave them.
- **Stale registry:** arch-debt lags reality on ≥6 entries (4 slow-types + 2 connector). Trust live
  dry-run/doc-lint over the registry; resyncing the registry is part of the slice work.
