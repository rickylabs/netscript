# Worklog

2026-11-02: Verified #2589 merged as6766130. Read #2412/#2474 trackers and current PRs.
#2581 is explicitly the next independent unit in #2571 and has no worker claim/implementation PR.
Claimed it without duplicating #2577 or other active leaves. Feature matrix queried.
Research and independent plan review precede implementation.

## Design

1. Public surface: existing plugin `mcp add/list` gains service/path/protocol options; generated
   config remains core `McpTransportConfig`. No new root export.
2. Vocabulary: logical service identity, root-relative MCP path, endpoint protocol, existing
   serverId/auth environment. Discriminated generator input represents three configuration sources.
3. Ports: existing PluginCommandContext/LocalProjectFiles, SDK discovery, AI MCP pool/transport
   and tool registry; none redefined. Web URL composes the endpoint.
4. Constants: MCP default path /mcp and protocol http; finite protocols http/https. Version pin
   comes from existing PLUGIN_PACKAGE_VERSION. No runtime host/port constants.
5. Slices: S0 research/plan/review; S1 complete implementation/tests/docs/carriers after plan PASS;
   S2 only for independently reviewed actual gate corrections. Gates/files are in plan.md.
6. Deferred: full showcase, MCP server/auth, durable chat, UI, alternate indices/rediscovery.
7. Contributor path: plugins/ai/README.md MCP configuration section points to the command and
   existing resource generator; new sources must normalize to core transport config.

Plan evaluation is explicitly required by #2581. GLM plan route has no proven allowance
(Go HTTP401; other providers lack usage snapshot); native Fable5.1 is the declared fallback.
