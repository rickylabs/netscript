# Context pack — #1117

Target `canary/0.0.5-canary.13`. Existing OpenAPI projection, endpoint discovery, three read tools,
receipts, and activation surfaces are present. The remaining reachability defect is that generated
app conventions omit `list_api_services`, even though the next tool requires a service name, and the
runtime gate proves only the first tool in isolation. Locked fix: document and live-test the ordered
`list_api_services → list_service_operations → get_operation_schema` funnel. `deno.lock` entered the
branch modified and must remain unstaged.

Implementation now updates both the scaffold convention and MCP server instructions. The runtime
verifier follows the generated instruction through JSON-RPC and chains discovered service and
operation identities into schema retrieval. Focused tests are green; full gates remain pending.
