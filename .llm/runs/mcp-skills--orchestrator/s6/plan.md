# Plan: `@netscript/mcp` S6 CLI trigger tools

## Metadata

| Field | Value |
| --- | --- |
| Run | `mcp-skills--orchestrator/s6` |
| Branch | `feat/netscript-mcp-skills-s6-clitrigger` |
| Target | `packages/mcp` |
| Archetype | `6 — CLI / Tooling` (integration ports/adapters inside locked package shape) |
| Overlays | none |

## Goal and Scope

Implement dynamic command catalog and policy-gated subprocess execution tools without coupling MCP to CLI. Scope excludes S7's `agent` command group and real CLI registry/composition adapter, the sibling top-level `skills/` bundle, docs, telemetry, dependencies, and any PR/merge action.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | MCP owns narrow `CommandCatalogPort` and `CommandExecutorPort` contracts; S7 injects registry-backed implementations | Prevents the forbidden MCP→CLI dependency/cycle and preserves dynamic enumeration. |
| D2 | `CommandDescriptor` carries bounded `path`, `description`, and `usage` strings; catalog flow filters case-insensitively and caps limit at 100 | Machine-readable and bounded without mirroring Cliffy's entire model. |
| D3 | Policy is immutable data with allow/deny prefix arrays; token-aware prefix matching, deny wins, default deny, and decisions name the matched rule | Pure, renderable, overrideable, and auditable. |
| D4 | Default allows exact safe families/subverbs: db init/generate/migrate/seed/status/introspect; generate; contract; service list/status; plugin add/list/sync/doctor; ui. Explicit denies include deploy, init, marketplace, db reset, plugin remove; unknown defaults deny | Conservative mutation gate meeting the slice contract; broad families only where explicitly authorized. |
| D5 | Command input accepts a whitespace-separated path plus string args; normalize it into path tokens before policy/execution | Preserves the existing input key while supporting paths such as `db migrate`. |
| D6 | Executor returns exit code, elapsed milliseconds, last 4096 decoded bytes of combined stdout/stderr, and truncation; timeout kills the process and returns a stable timed-out result | Bounded evidence with correct filesystem/locking semantics. |
| D7 | `SpawnCommandExecutor` defaults to `deno run -A jsr:@netscript/cli`, because scaffolds do not emit a `netscript` task; `cliCommand` and timeout are injectable | Matches the public scaffold invocation and remains cheap to test/wire locally. |
| D8 | `StaticCommandCatalog` accepts descriptors and defaults to one informational unwired descriptor | Mirrors S5's explicit stub; does not pretend a static production catalog is dynamic. |
| D9 | `cli.ts` wires both flows additively using defaults; server options expose flow overrides already, while policy is passed to the execute flow and remains exported data | Keeps composition explicit and avoids a container. |
| D10 | Preserve `MCP-A6-V2-SHAPE`; no new debt expected | Work stays within the accepted horizontal architecture. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Default CLI invocation | resolved now | D7 uses published JSR binary invocation derived from scaffold behavior. |
| Policy matching semantics | resolved now | D3 fixes token-aware prefixes, deny precedence, and default deny. |
| Allowed service operations | resolved now | D4 conservatively limits default service access to list/status. |
| Timeout representation | resolved now | D6 uses a stable result rather than an exception. |
| Real registry catalog/default CLI wiring | safe to defer | S7 injects these from the CLI side through D1 ports. |
| Consumer policy customization through higher-level server options | safe to defer | Exported data/functions and flow injection provide the S6 contract; S7 owns the outer CLI option surface. |

## Commit Slices

1. Domain contracts, policy, and flows — proves allow/deny/deny-wins/default-deny plus catalog filter/limit and denied execution; creates domain port/policy and application flow files, tests, exports, contracts, and S6 artifacts. Gate: focused policy/flow tests + scoped check.
2. Static catalog and spawn executor — proves default stub, real subprocess output, timeout, and byte-tail truncation; creates infrastructure adapters/tests and updates exports/artifacts. Gate: focused adapter tests + all MCP tests.
3. Composition and merge-readiness — proves additive stdio wiring, accurate tool descriptions/contracts, scoped static gates, architecture, full-export docs, package publish dry-run, and consumer smoke; changes `cli.ts`, registry/contracts/tests, and artifacts. Gate: requested full validation set.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Prefix matching accidentally allows `db reset` | Token-aware matching plus explicit deny precedence and table tests. |
| Capturing stdout/stderr separately loses ordering | Pipe both streams concurrently into one bounded collector; document combined-tail semantics. |
| UTF-8 truncation splits code points | Decode bounded bytes with replacement-safe `TextDecoder`; assert byte bounds/truncation. |
| Timeout leaves child running | Kill on deadline and await terminal status; test with a cheap delayed `deno eval`. |
| Static stub looks authoritative | Return an explicitly informational `catalog not wired` descriptor and record S7 drift. |
| Public declarations create slow types/doc gaps | Explicit types/JSDoc, full-export doc lint, publish dry-run. |
| Sibling edits touch `cli.ts`/contracts | Keep changes additive and inspect current worktree before every commit. |

## Gates and Debt

Required: scoped check/lint/fmt wrappers; all MCP tests with process permission; `deno task arch:check`; full-export doc lint; package publish dry-run; public consumer/server smoke. Apply universal and applicable F-CLI gates manually where scripts do not cover them. F-13 is N/A; runtime validation is the real cheap subprocess suite; consumer validation is required. Preserve accepted `MCP-A6-V2-SHAPE`; record new/deepened debt before completion.

Anti-pattern focus: AP-2 speculative ports (both map S7/test seams), AP-3 oversized backend contracts, AP-8 containers, AP-11/AP-25 effects outside infrastructure, AP-19 process permission, AP-22 barrels, AP-23 inline composition, and AP-24 policy switches/closed registries.

## Deferred Scope

S7 registry-backed catalog/default injection and `agent` command group; S8 consumer rendering; top-level `skills/`; docs/telemetry; deploy/publish/destructive verbs; dependencies; PR creation or merge.
