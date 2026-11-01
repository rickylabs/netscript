# Idiomatic, up-to-date NetScript in the docs (owner rule, 2026-10-28)

The owner: "curl is no longer the documented way. The CLI provides built-in tools together with MCP. That's the kind of catch I want: idiomatic, up-to-date NetScript patterns."

Every page and tutorial step shows the current NetScript way. Verify each tool against the source before writing it (`packages/cli/src/public/features/*/*-group.ts` for the `.name()` and `.command()` registrations, which are singular: `service`, `contract`, `plugin`, `db`; and `packages/mcp/src/application/tool-registry.ts`). `plugin dispatch` is NOT a public command. `docs:accuracy` checks the CLI commands.

| Task in a doc | Idiomatic way (prefer the first; also show the MCP form where agents are the audience) |
|---|---|
| See which services exist | `netscript service list` · MCP `list_api_services` |
| See a service's operations and shapes | `netscript contract inspect` (`contract list`) · MCP `list_service_operations` → `get_operation_schema` |
| Call a service from app code | The generated typed client (`apps/<app>/lib/<service>.ts`, from `service add --with-client`) or `@netscript/sdk`. Never raw `fetch` or `curl`. |
| Check that the app is up or healthy | The Aspire dashboard / `aspire describe` · MCP `get_app_status`, `get_recent_errors` |
| Check plugins | `netscript plugin doctor` · MCP `doctor` |
| Run or inspect background and durable work | The plugin's own published CLI (for example `ns-workers`, `ns-sagas`), `netscript plugin info` · MCP `get_last_job_result`, `list_runs`, `get_run` |
| Performance and DB questions | MCP `analyze_service_performance`, `analyze_db_bottlenecks` |
| Look up an API | `deno doc`, the reference pages · MCP `find_guidance`, `search_docs`, `get_export` |

- **curl** stays only where the subject is HTTP itself: a webhook receiver that an external system calls, OpenAPI/Scalar exposure, or a public health endpoint. Even then, use the URL Aspire prints, never a hard-coded port.
- **Ports:** never hard-code dashboard, OTLP or service ports; the AppHost assigns them. Say "the URL Aspire prints" or show `aspire describe`.
- **Install and help:** use one canonical CLI install command and one canonical `--help` group list across the quickstart and every tutorial.
- **Removed APIs and old flows** go.
