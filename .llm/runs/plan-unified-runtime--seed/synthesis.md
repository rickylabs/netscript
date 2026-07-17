# Stage C — Supervisor synthesis (plan-unified-runtime--seed)

Supervisor: Fable 5 session 86d308d5 (Tier-A). Full Stage-B corpus read 2026-07-18 (six topic
files, `research/`). Citations live in the corpus; this synthesis names conclusions and the
Stage-D fan-out. GitHub wins on conflict.

## Accepted Stage-B verdicts (supervisor-ratified)

1. **Nitro v3 = host/output substrate, not adapter replacement.** Public beta; `deno_server` is
   Node-built + `--unstable`-launched; database/tasks experimental; storage defaults volatile.
   NetScript ports remain the application contracts (corpus: nitro-v3.md, adapter-mapping.md).
2. **"Excludes sagas" (#327 D1) is STALE as a categorical exclusion** — superseded by a
   capability rule: sagas run in-process only through the NetScript saga runtime (store/
   transport/outbox/idempotency ports); each deploy preset declares
   `sagas: supported | externalized | rejected` and proves it; "externalized" = macro-service
   split of the same app model, never a downgrade to Nitro tasks (sagas-constraint.md).
3. **The universal invariant is LOGICAL graph identity** (one composition root); physical
   one-process execution is a per-preset capability. This resolves drift D-01/D-02 and preserves
   RFC §3's earn-the-graph default without promising OS-process identity on provider presets.
4. **Transport = invocation placement over a stable Fetch/RPC contract** (D-07): in-memory
   delegation via `ServiceApp.fetch` + oRPC handler; "no socket loopback" is the requirement, a
   second codec is not. Pin the oRPC generation (shipped ^1.14.6 vs live v2 beta — D-11) and add
   an H3-bridge conformance gate.
5. **Nitro owns the listener/lifecycle; Fresh mounts via `app.handler()`** — never nested
   `listen()` (D-10). Route/static ownership + no-nested-listen acceptance tests are board cards.
6. **Data naming**: the shipped surface is `@netscript/database` — board language normalizes to
   shipped package names; `@netscript/data` would need an explicit facade contract card (D-12).
7. **Desktop update/install mechanics are one target adapter** (D-04) — the shared contract is
   the artifact/topology manifest (consistent with the beta-11 #456 one-lineage decision);
   writer-ownership (D-08) and offline sync (D-09) become declared database capabilities.

## Resolutions of supervisor-delegated decisions

- **Drift dispositions D-01…D-12**: all accepted as tabled in drift-ledger.md; none rejected.
  They become plan constraints, not open questions.
- **Milestone anchor**: unified-runtime epic #823 targets beta.12+ per the RFC train; exact
  milestone split is a Stage-E output (owner fork).
- **Preset cell set (from nitro-v3.md board input 2)**: v1 board plans four runtime cells —
  `deno_server`, `deno_deploy`, one Node server preset, one isolate/serverless preset — each a
  capability-matrix column, not a global promise.

## Stage-D fan-out (one focused pack per topic)

| Pack | Scope | Feeds |
| --- | --- | --- |
| D1 `composition-host` | Composition contract: logical root, Nitro host integration (listener/lifecycle/plugins/close), Fresh handler mount, oRPC in-process bridge + conformance gate, version pins | epic #823 core issues |
| D2 `capability-matrix` | Preset × capability contract (sagas rule, KV/queue/database ownership mapping, writer/lock + offline-sync capabilities, task/schedule mapping), build-time rejection semantics | acceptance gates + per-preset issues |
| D3 `board-mechanics` | Epic decomposition + milestone train + supersession map (#451 fold-in per D-07, #453 per D-08, #454 re-scope per D-02, #455 per D-09, #349 close-as-superseded), issue drafts per netscript-pr | Stage-E plan lock + Stage-H manifest |

Packs are DRAFTS — no GitHub mutation (stage-H boundary; owner ratifies in-turn).
