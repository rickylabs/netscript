<!-- seed:plan-unified-runtime slot:UR-5 -->

# UR-5 — Preset capability manifest + build-time rejection compiler; per-preset sagas declaration

- **Slot:** UR-5
- **Owning pack:** D2 capability-matrix (drafts D2-S1 + D2-S2)
- **Labels:** `type:feat`, `area:cli`, `area:config`, `area:plugins`, `epic:unified-runtime`, `epic:deployment`, `priority:p1`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** UR-1 (composition root — source of logical-graph requirements), UR-11 (architecture contracts — requirement schema + build seam)
- **Blocks:** UR-6, UR-7, UR-9, UR-10

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-5 -->
>
> Define the machine-readable **capability manifest** each v1 runtime cell ships, and the
> **composition compiler** that cross-checks the app's logical-graph requirements against the selected
> preset's manifest, failing the **build** (never runtime, never a silent downgrade) on an unsupported
> combination. The requirement schema and the static build/CLI seam by which the compiler observes a
> dynamically composed graph are defined in **UR-11 architecture contracts** — UR-5 consumes them.
>
> - Manifest encodes per-capability `lossless | partial | unsupported` + saga declaration + writer /
>   offline flags (see `design/D2-capability-matrix/proposal.md` §3–§4).
> - Compiler reads requirements from the logical composition root (sagas mounted? long-running queue
>   listener? CAS-dependent trigger/idempotency store? exclusive-lock single-writer DB?).
> - `unsupported` → hard build failure with a diagnostic naming capability + cell + externalize path.
>   `partial` → build warning with the named degraded axis, requiring explicit adapter selection.
> - **Sagas rule (supersedes the categorical "#327 D1 excludes sagas"):** implement
>   `sagas: supported | externalized | rejected` per cell and prove each against duration, lifecycle,
>   connector, and `SagaDurabilityTier` gates. In-process is allowed **only through the NetScript saga
>   runtime** (store/transport/outbox/idempotency ports authoritative); "externalized" = macro-service
>   split of the **same app model**; **never** a downgrade to Nitro tasks. Supported cells drain the
>   saga runtime on Nitro `close` via the UR-0 lifecycle contract.
>
> Evidence: `research/drift-ledger.md` D-05/D-06; `research/sagas-constraint.md` Board consequence
> 1–3; `research/adapter-mapping.md` KV-atomics + One-off-task + Saga rows; `proposal.md` §2.1, §4.

## Acceptance / gates

- [ ] gate: each v1 cell (per UR-6) ships a capability manifest matching proposal.md §3
- [ ] gate: an app mounting a saga runtime under a bounded-window cell **fails the build** with a diagnostic naming the externalize path (no runtime fallthrough)
- [ ] gate: a `partial` mapping (e.g. polling KV watch) emits a build warning naming the degraded axis, not a hard fail
- [ ] gate: no Nitro primitive (unstorage / db0 / Nitro-task / H3 / Hono) is reachable from application code in any cell
- [ ] gate: no code path substitutes a Nitro task for a `SagaDefinition` (correlation / transitions / compensation / retry / idempotency / outbox preserved)

## Fork deltas

**F-3 (bounded-window sagas — externalized vs reject-only).**
- **A (default) — reject-only v1:** bounded-window cells hard-reject an in-process saga at build; the
  externalized macro-service path ships v1.1. Second gate box reads "fails the build … naming the
  externalize path as a v1.1 target."
- **B — ship externalization v1:** bounded-window cells auto-externalize to a configured macro-service
  target; second gate box adds "or externalizes to the configured macro-service target." Requires a
  configured externalization target in the manifest schema (UR-11).
