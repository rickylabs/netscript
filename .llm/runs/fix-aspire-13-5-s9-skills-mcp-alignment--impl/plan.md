# Plan — S9 Phase A

## Profile and authority

- Archetype: 6 — CLI / Tooling. The slice adds an E2E command/gate flow and changes scaffold agent
  initialization.
- Overlay: docs, limited to shipped skill/help prose and harness artifacts; no public site docs.
- Doctrine verdict: `packages/cli` remains an acknowledged major-refactor surface; this slice must
  not deepen its debt.
- Plan-Gate: inherited from the supervisor's two separate-session PLAN-EVAL cycles and owner
  dispatch. This implementation session does not self-evaluate.

## Locked decisions

1. Preserve D-6: S8 alone emits `excludeFromMcp()`; S9 only observes it.
2. Preserve D-7/OF-1a: NetScript owns the `aspire` skill and installs exactly four named upstream
   workflow skills beside it.
3. Preserve D-12: the structured gate/receipt is the proof; Phase-A static capture is explicitly not
   the live smoke receipt.
4. Preserve D-13/D-16: archival rows and historical fixtures are untouched.
5. JSON-RPC behavior is isolated behind an injectable transport; unit tests use recorded fixtures.
6. IO stays at the gate/runtime adapter edge. Receipt evaluation and redaction remain pure.

## Open-decision sweep

- Phase-B host/lease: safe to defer and explicitly outside this dispatch.
- `docs_audit` execution: safe to defer; this session writes only the request text.
- Dogfood freshness gate: resolve in Phase A by adding a check task if the existing generator has a
  deterministic check mode; otherwise record concrete generator limitations without hand edits.

## Risks

| Risk | Mitigation |
| --- | --- |
| MCP subprocess hangs or leaks | Locked per-operation and whole-gate deadlines plus close → SIGTERM → SIGKILL lifecycle |
| Transcript leaks secrets | Redact before persistence and assert literal-secret absence in raw captured messages |
| Runtime-disabled tier silently omits proof | Register the gate on both tiers and return an explicit recorded skip reason |
| Generated artifacts diverge | Run only canonical generators and their check tasks |
| Package doctrine regressions | Per-slice `quality:scan`, `arch:check`, scoped wrappers, and no casts/lint ignores |

## Deferred scope

- Live AppHost smoke, dashboard-only live mode, and observed S8 exclusion: Phase B.
- Public documentation: S11.
- Any `excludeFromMcp()` generator change: S8.

## D-194 repair slice

- Plan-Gate: `N/A`. The owner supplied one mechanical failure, the exact forbidden workarounds,
  acceptance criteria, and verification commands; no architecture or scope decision remains open.
- Locked repair: pass the AppHost-local `aspire.config.json` path into both Aspire lifecycle script
  paths while keeping the generated-project root as the receipt/state root.
- Regression contract: the start gate and restart-fallback gate must bind
  `<dirname(appHost)>/aspire.config.json`; they must not infer the config from `projectRoot`.
- Deferred: no suite redesign, config generation change, missing-file fallback, sqlite skip, runtime
  execution, PR lifecycle change, or evaluator dispatch.
- Risk: the restart script shares `Deno.args` with the start script. Mitigation: lock the complete
  argument order in the deterministic lifecycle-gate test and retain the typed database argument
  assertion.

## Authenticated telemetry adapter slice

- Plan-Gate: `N/A`. The owner supplied the exact failing transport boundary, required MCP tools,
  preserved `TelemetryQueryPort` contract, private-reader convergence rule, forbidden runtime and
  product changes, and static gate set.
- Locked repair: replace Dashboard HTTP reads with short-lived `aspire agent mcp` stdio sessions;
  normalize `list_traces`, `list_structured_logs`, and `list_trace_structured_logs` projections at
  the existing query adapter; close every transport after its tool call.
- Regression contract: a realistic Aspire 13.5.3 `# TRACES DATA` projection must fail before the
  adapter exists, then produce the expected normalized `job.execute` span and Flow-B correlation
  identity after the repair.
- Cleanup: remove the private Flow-B HTTP trace reader, the obsolete token-preservation test, and
  the unused compatibility script that still embedded a raw Dashboard telemetry fetch.
- Deferred: hosted sqlite/docker runtime tiers, Aspire/AppHost/Docker execution, workflow edits,
  evaluator dispatch, PR base/lifecycle changes, and any anonymous-mode reversal.
