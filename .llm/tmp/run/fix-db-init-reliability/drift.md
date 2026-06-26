# Drift — db-init reliability

## Recorded Drift

- `deno task arch:check` was run during planning and failed on pre-existing dependency-centralization drift unrelated to this slice: divergent `@netscript/aspire` and `@netscript/plugin` ranges across `packages/cli` and plugin package manifests. This db-init slice does not edit those dependency declarations.
- Early reproduction/proof logs showed concurrent/leftover Aspire AppHosts with fixed dashboard/OTLP ports, including generated projects failing to bind `https://127.0.0.1:18891`. After cleaning up those orphan AppHosts, the final proof produced five consecutive full `scaffold.runtime` passes with `database.init` green in every run. This is recorded as local environment drift encountered during reproduction, not residual db-init product drift.
