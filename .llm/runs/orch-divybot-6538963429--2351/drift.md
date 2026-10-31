# Drift

- Bootstrap: RTK absent; use plain commands plus repository structured wrappers. No verdict substitution.
- Supplied assignment names a historical lease merge SHA unavailable in this checkout; current main contains the complete evolved Lua/fenced lease implementation. Plan rederived from current source.
- Corrected planned port path to actual `ports/message-queue.ts` before code changes.
- Owner-specific evaluator selection, reference-only PR linking, no-label policy and CI-only scaffold runtime override generic process defaults. Exact evaluator and link grants retained in supervisor.md.

- PLAN-EVAL placement correction before implementation: add `_redis-listener.ts` and extend existing adapters-cardinality debt entry; write surface includes that single debt entry. Preserve the existing stop-inside-handler recovery fixture; add separate successful-drain and expired-drain proofs.

- S1 full suite exposed producer-only shutdown ordering: restored immediate promotion disconnect when there is no listener. Abort mock now releases its pending claim on lease stop and uses an explicit short budget; real stopped-process recovery fixture is unchanged. No acceptance weakened.

- S2 public carrier refresh: extend owned generated surfaces to `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, `.llm/assets/agent-docs/provenance.json`, and CLI agent-docs/embedded generated carriers, only through native generators. Public source is committed as9d2555a; the only dirty package inputs before generation are owned test fixtures, so the native corpus generator explicit --allow-dirty flag is justified for this test-only read-set difference. Freshness will run without that flag.

- S2 latency evidence makes the initialized-connection assumption explicit: promotion opens its dedicated client lazily, so cold startup/reconnect can miss a pass. Conditional D+P applies after queue/promotion connections are established, with command/event-loop overhead separate; no unconditional end-to-end SLA is claimed. Both options and public-factory environment paths measured from persisted eligibility.
- Add native publish-asset output ownership for `packages/mcp/src/publish-assets.generated.ts` and `packages/cli/src/kernel/assets/publish-assets.generated.ts` if changed by generation; unrelated generator outputs must remain unchanged.

- Native check:assets-barrel ends in git diff against the committed index. Before committing an intentional generated prose update, that final comparison exits1 despite stable generator output and passing registry/token checks. This commit-dependent check remains unproven until S2 is committed, then must pass before READY; no check weakened or bypassed.
