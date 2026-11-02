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

## S0 draft and baseline

- Draft PR #2590 opened at3986437; milestone0.0.9 and feature/plugin/in-progress taxonomy.
- Native Fable5.1/low independent PLAN-EVAL is running through the repository Claude launcher. GLM primary transports failed availability preflight (Go401, others lack required usage snapshot); no paid-provider guard was bypassed.
- Baseline: existing plugin AI command tests4/4 and core MCP tests20/20 PASS. A first command targeted the MCP source directory, which contains no tests; the corrected core command targeted packages/ai/tests/mcp_test.ts.

## PLAN-EVAL PASS

Independent Fable5.1/low review passed iteration2 after replacing namespace pin with mode-aware CLI import wiring. Baseline quality:gate PASS (exit0). Implement service union/validation first, then CLI/emission/tests/docs. Older JSR installs receive a documented SDK alias migration.

## S1 implementation and local proof

- Added service-reference generator union, CLI flag validation and SDK runtime discovery URL emission. Preserved URL/stdio and existing auth header semantics.
- Added SDK alias to the existing JSR-only CLI plugin import map. Both-mode completeness guard now includes an emitted service server; local-source no-pin control includes SDK.
- New real HTTP MCP fixture lists/calls a tool on an allocated port through the emitted module. Includes auth, custom/default paths, HTTPS selection and missing discovery. Invalid/ambiguous CLI controls prove no writes to new or populated projects.
- All AI plugin, core MCP and CLI workspace-mutator tests:86 PASS,0 FAIL. Plugin scoped check PASS; selected44 TypeScript files lint/format PASS. Generated installed consumer typechecks its populated registry.
- quality:gate and docs:accuracy PASS. Plugin publication dry-run PASS. Full export doc lint16 findings exactly matches baseline; no new findings.
- Implementation reviewer primary Muse transports unavailable (Go401 and OpenRouter missing required usage snapshot); declared native Opus5/xhigh fallback will review in a separate session.
