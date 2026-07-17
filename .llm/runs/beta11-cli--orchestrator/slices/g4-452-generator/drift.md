# Drift Log: G4 #452 desktop Aspire generator

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

No drift recorded at the Plan & Design checkpoint (2026-07-17).

## 2026-07-18 — D3 schema default removed

- Planned: enforce desktop opt-in at both schema parsing and generated AppHost boundaries by
  conditionally defaulting `Enabled` to `false` for desktop entries.
- Actual: `Enabled` remains optional in the public `AppEntry` schema/type, and desktop opt-in is
  enforced only by the generated `config.Apps[name]?.Enabled === true` runtime guard.
- Rationale: Zod 4.4.3 cannot represent `.transform()` in JSON Schema. `AppEntryZod` feeds the
  published appsettings schema, so the conditional transform broke `z.toJSONSchema` and CI's
  `packages/aspire/tests/schema_test.ts`. Preserving JSON Schema generation is load-bearing; the
  generator boundary still proves the requested safe opt-in behavior.
- Scope/debt: accepted implementation drift, not new architecture debt. No non-desktop generator
  behavior changes.
