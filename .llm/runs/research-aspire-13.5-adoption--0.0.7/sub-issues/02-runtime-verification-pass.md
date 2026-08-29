# [aspire-13-5 S2] 13.5 runtime verification pass with receipts

> DRAFT TEXT ONLY. Labels: `type:test`, `epic:aspire-13-5`, `area:aspire`, `area:tooling`,
> `gate:e2e`, `priority:p0`, `status:triage`. Milestone: `0.0.7`. Requires the globally serialized
> runtime lease (one AppHost at a time on the shared host).

## Summary

Execute every claim `research.md` marks **RUNTIME-VERIFY** against a live 13.5.3 CLI + generated
project, and re-run the closed-issue regression list. Output is a receipts table committed to the
epic's run dir plus any test/fixture fixes needed to keep `scaffold.runtime` honest. No generator
changes.

## Verification list (each row → observed behaviour + receipt path)

| Id  | Claim to verify                                                                                                                                                                                                                                                   | How                                                                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| V1  | `aspire restore` on the 13.5.3 train regenerates `.aspire/modules/aspire.mts` and `tsc --noEmit` accepts the options-object `withHttpHealthCheck({ path, endpointName })` the generator emits (`generate-register-services.ts:89`)                                | `netscript init` (postgres) → `aspire restore` → `aspire start --isolated --format Json`                                            |
| V2  | Startup timing vs 13.4.6 (C9): time-to-`dashboardUrl`, `withBrowserLogs()` child readiness                                                                                                                                                                        | wall-clock from the start script; compare to skill baseline (13 s)                                                                  |
| V3  | Proxyless port allocation (BC-5): `urls[].url` vs `environment.PORT` for executables; fixed `targetPort` containers unchanged; `ASPIRE_PROXYLESS_ENDPOINT_PORT_RANGE` not needed                                                                                  | `aspire describe --format Json`; re-run `generated-app-endpoint`, `capture-db-endpoint-allocation`, `verify-live-db-endpoint` gates |
| V4  | Detached telemetry discovery (#1025 / Q10): does `aspire otel logs` succeed without `--dashboard-url` after `aspire start`?                                                                                                                                       | run both forms; record exit codes                                                                                                   |
| V5  | `aspire ps --format Json` fields (`appHostPath, appHostPid, cliPid, logFilePath, dashboardUrl`, `sdkVersion`?) and `aspire describe` `resources[]` shape vs 13.4.6 fixtures                                                                                       | diff against `packages/mcp/tests/service-endpoint-source-fixtures.ts` and teardown fixture                                          |
| V6  | Orphan cleanup: kill the launching CLI, then `aspire ps` / `aspire stop` auto-clean (C11/C14); DCP helper exit time after scoped stop (skill says ~20 s)                                                                                                          | `ps -ef`, `aspire ps`, timestamps                                                                                                   |
| V7  | `aspire stop --force --apphost <path>` removes persistent containers the run created and nothing else                                                                                                                                                             | `docker ps -a` before/after with DCP labels                                                                                         |
| V8  | Aspire MCP server tool list via `aspire agent mcp` (expect `get_integration_docs`, `refresh_tools`); `list_resources` env redaction unchanged                                                                                                                     | MCP client transcript or `mcp__aspire__*` tools from the session                                                                    |
| V9  | `CommunityToolkit.Aspire.Hosting.Deno@13.5.0` in `aspire.config.json` → `addDenoApp` present in `.aspire/modules/aspire.mts` (C25 projection proof)                                                                                                               | scratch `aspire.config.json` + `aspire restore`; grep the module                                                                    |
| V10 | `aspire doctor --format Json` check ids on Linux/WSL (`cli-version`, `operating-system`, container, certs)                                                                                                                                                        | capture JSON for S10                                                                                                                |
| V12 | Deploy CLI contract (D-15): `aspire publish --help`, `aspire deploy --help`, `aspire destroy --help` on 13.5.3 list `--apphost`, `--output-path`, `--environment`, `--non-interactive`/`--yes` as the adapters expect (`aspire-{cloud,compose}-deploy-target.ts`) | capture help text as receipts for S4                                                                                                |
| V11 | Regression list `existing-issue-map.md` §B (#952, #954, #958, #964, #970, #1011/#1196, #1012, #1025, #1227, #1447, #1575/#1577) — reproduce each acceptance quickly                                                                                               | one-line receipt each                                                                                                               |

## Boundaries

- No product/generator code. Test or fixture edits only where a gate would otherwise lie.
- Do not upgrade the shared host CLI outside the lease window; use `--isolated`.

## Acceptance

- [ ] `receipts/aspire-13.5-verification.md` committed in the epic run dir with all V1–V12 rows
      filled (observed value + command + exit code + timestamp), no row "not run".
- [ ] Each behaviour that differs from the 13.4.6 skill text is listed as an input for S9.
- [ ] `scaffold.runtime` still green after any test/fixture fix; failing gates that reflect a real
      13.5 change are filed as follow-ups, not silenced.
- [ ] Arch-debt `aspire-otel-cli-discovery` updated with the V4 outcome.

## Tests / gates

`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`; `deno task agentic:leak-check`
after every AppHost; the run's `teardown --apply` only on positively owned resources.

## Docs / static asset regeneration

None (receipts only).

## Related

Part of #<epic>. Depends on S1. Feeds S3, S4, S7, S9, S10. Related closed: #1025, #1227, #1597.
