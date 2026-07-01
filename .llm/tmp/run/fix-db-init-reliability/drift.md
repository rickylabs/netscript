# Drift — db-init reliability

## Recorded Drift

- `deno task arch:check` was run during planning and failed on pre-existing dependency-centralization drift unrelated to this slice: divergent `@netscript/aspire` and `@netscript/plugin` ranges across `packages/cli` and plugin package manifests. This db-init slice does not edit those dependency declarations.
- Reproduction/proof logs showed concurrent/leftover Aspire AppHosts with fixed dashboard/OTLP ports, including generated projects failing to bind `https://127.0.0.1:18891`. That prevented a clean local five-consecutive full `scaffold.runtime` streak: post-fix db-init/generate/seed passed, but later `runtime.aspire-start` failed outside this slice. The final proof therefore combines one full passing `scaffold.runtime` run with five focused generated-project `db init` passes and records this as local environment drift rather than db-init product drift.
