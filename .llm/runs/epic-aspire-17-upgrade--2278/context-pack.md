# Context Pack — `epic-aspire-17-upgrade--2278`

- **Branch:** `epic/aspire-17-upgrade` (base `origin/main` `36a464c23`)
- **Current Phase:** `plan-eval` (S0 spike complete; run artifacts bootstrapped; zero product code edited yet)
- **Active Slice:** None (blocked on PLAN-EVAL `PASS`)
- **Pinned Target Versions:**
  - `Aspire.Cli`, `Aspire.Hosting.AppHost`, `Aspire.Hosting.JavaScript`, `Aspire.Hosting.PostgreSQL`, `Aspire.Hosting.MySql`, `Aspire.Hosting.SqlServer`: `17.0.0`
  - `Aspire.Hosting.Browsers`: `17.0.0-preview.1.26567.5`
- **Key Verified Facts:**
  - `features.appHostServerV2: true` → NO-GO on `17.0.0` (refuses managed integration assemblies).
  - `#2259` → Aspire `17.0.0` redacts composed `DATABASE_URL` / `ConnectionStrings__*` / `APPDB_URI` to `null` in `aspire describe`; restore whole-snapshot scan in `credential-secret-surfaces.ts` and verify on hosted Postgres `scaffold-runtime`.
  - Native Deno AppHost (`aspire/deno.json`) requires `"./aspire"` in generated root `deno.json` `workspace` + `"sloppy-imports"` in root `unstable` for zero-warning resolution of `@netscript/aspire` (`zod: "catalog:"`) and Aspire `.mjs`→`.mts` imports.
  - `aspire agent init` `17.0.0` removed `--skill-locations` and old 4 skill IDs (`aspire-init`, `aspire-orchestration`, `aspire-monitoring`, `aspire-deployment`).
  - `aspire agent mcp` `17.0.0` exposes 15 tools (`wait_for_resources` added).
- **Slice Status:**
  - S0 (Live verification spike): **DONE**
  - PLAN-EVAL: **PENDING**
  - S1–S6: **PENDING**
