**FAIL_PLAN.** The slicing is viable and does not need a rescope, but the plan has to be revised and resubmitted to this session before any code. Four of its API assumptions are wrong, and one acceptance item (MCP over orders) has no shipped API behind it and needs an owner decision. Everything below comes from reading the source; I made no edits. `plan-eval.md` is still empty, and `worklog.md` is a word-for-word copy of `plan.md` rather than a log, so it needs real entries.

## Blocking corrections

**B1. Where the recipe runs is not possible as written.** "After base files and packages exist, before final format/summary/agent handoff" does not match the current flow:
- **Format and commit happen inside the pipeline:** `runInitPipeline` runs `formatOutput` and `gitInit`, including `git commit`, itself (`packages/cli/src/kernel/application/scaffold/init-pipeline.ts:81-89`).
- **JSON is printed early:** `executeInit` prints the single JSON object before it returns (`init-orchestrator.ts:35-36`). The UI preset and the agent install only run after that (`public/features/init/run-init-command.ts:137-156`).
- **Maintainer packages arrive late:** maintainer mode copies local packages only after `runInit` has returned (`maintainer/features/init/orchestrate-maintainer-init.ts:112-125`). Local plugin installs that need those packages cannot run inside the pipeline.

The plan must pick one placement and state it, then enforce it with one shared test across public and maintainer modes. It must say:
- whether the scaffold commit includes the showcase;
- how the JSON output and `InitResult` gain recipe effects without printing twice (the JSON already has a `plugins: []` field, `init-json-renderer.ts:43`);
- whether the showcase runs before or after `--preset`, or rejects `--preset`.

**B2. The list of ports is incomplete.** `InitPipelineContext` (`context.ts:10-33`) has no way to install a plugin. That dependency graph is built separately (`public-command-dependencies.ts:384-396`): workspace mutator, plugin registry, JSR validator, prompt with skip-confirmation, process runner and file fetcher. Maintainer mode uses `installLocalPlugin` with source-root discovery instead. The plan must list each recipe step against its existing entry point:
- install for each plugin;
- `db generate` and `db seed`;
- `generate plugins` and `generate resource`;
- plugin-owned commands such as `plugin ai add …`, `plugin ai mcp add` and `plugin auth backend/provider set`.

Plugin-owned commands always run as subprocesses through the plugin dispatcher, so "prefer injected callbacks over nested CLI" cannot apply to them; say so. Dry-run must not call `installPlugin` even with its own dry-run flag, because that still contacts JSR and starts the plugin scaffolder process (`public/features/plugins/install/install-plugin.ts:155-160, 431-436`).

**B3. No `orders` contract exists to reuse.** The default example service is `users` (`constants/scaffold/scaffold-defaults.ts:9`). The Prisma model template, the placeholder Zod file and the seed only have a `name` field (`assets/database/schema.prisma.template:17-22`, `adapters/database/scaffolder.ts:52-70, 216-219`). Pages that use customer, status or total fields will fail typecheck until a real `db generate` has run.

The plan must choose one approach:
- (a) give `DatabaseScaffolder` a closed field-spec input that also produces the placeholder Zod file and the seed, or
- (b) write showcase files in place of the database files, with an explicit conflict check.

Either way, the generated workspace must be typechecked after a real `db generate`. The orders create/update/delete procedures are rendered as `authentication: 'none'` (`assets/service/contract.ts.template:47-56`). The plan must state how orders are protected once auth is installed, without text-replacing generated TypeScript.

**B4. MCP over orders has no shipped API (owner decision).** The facts:
- **Client side only:** the AI plugin only consumes MCP servers and scaffolds none (`plugins/ai/README.md:33-35`).
- **Static URL:** `plugin ai mcp add` only takes a fixed `--url` or `--stdio` (`plugins/ai/src/cli/ai-commands.ts:57-61`, `adapter/resources/mcp-server/mcp-server.ts:14-30`). That conflicts with the no-hard-coded-URLs rule.
- **Wrong tool:** `--mcp` only scaffolds a skill-loader tool (`mcp-tool/mcp-tool.ts:14-21`).
- **Dev-time server:** `packages/mcp` is a developer endpoint-discovery server that drives the `aspire` CLI. It is not a runtime server over app data.

The options:
- (a) **Plain AI tools.** Orders tools call the typed orders client; the issue's MCP requirement is redefined and the drift recorded.
- (b) **App-owned MCP server.** Showcase code exposes orders over MCP, with its address resolved through Aspire service discovery.
- (c) **Framework gap.** Recorded as debt; this needs a WSL Codex slice, not this run.

Pick one before S4.

**B5. Durable AI chat needs app-owned replacement files.** As shipped:
- **No auth on chat:** the chat-stream route trusts the `sessionId` sent by the browser and passes no `authorize` (`plugins/ai/src/adapter/resources/stream-proxy/stream-proxy.stub.ts:142-155`).
- **One shared session:** the chat island hard-codes `sessionId: 'default'` (`chat-route/chat-route.stub.ts:27-30`).
- **Thread store not connected:** the thread store is not wired into anything. The `--persist-threads` flag named in the plugin comments does not exist in the CLI; only an add-only `thread-store` resource does.
- **Cross-origin by default:** the browser connection falls back to `getStreamsUrl()` (`packages/fresh/src/runtime/ai/create-chat-connection.ts:70`). The plan forbids that topology unless `createNetScriptChatStreamProxy` (`stream-proxy.ts:166`) is used.

S4 must specify showcase files, typed against the plugin's public API, that replace the emitted chat files under a stated conflict policy. They need per-user session ids from the auth session, an `authorize` gate, the thread store connected, a same-origin stream proxy, and the streams plugin installed first. The same-origin rule applies to the S3 activity subscription: if only the chat proxy exists, record that as a gap.

**B6. Auth and background plugins carry runtime prerequisites.**
- **No local sign-in:** auth defaults to `kv-oauth`, which needs an external OAuth provider (`plugins/auth/scaffold.plugin.json:71-96`). There is no credential-free local sign-in. The existing gates use smoke client credentials plus an in-process credential fixture (`e2e/src/application/gates/scaffold/runtime/runtime-scripts.ts:128-136`). The plan must label sign-in evidence as fixture evidence, separate from an external provider, the same way it does for AI.
- **Cache dependency:** workers, sagas, triggers and auth all require KV, so install adds a Garnet cache in `Auto` mode, which is Docker or the dotnet tool (`kernel/adapters/plugin/workspace-mutator.ts:637-665`). Given the known .NET shim failure, local native SQLite proof may not cover them, and the plan must say so.

**B7. Public mode cannot be proven before release.** Public init installs published plugin versions through JSR. Pre-release runtime proof is maintainer/local-source only. Public-mode proof belongs to the release E2E, and the plan should say that.

## Conditions to write into the plan

1. **`--example` versus `--from`.** `--from <preset>` and an exported `PresetRegistry` already exist but are unused (`public/features/init/init-command.ts:50`, `run-init-command.ts:83-91`). Either reuse them or justify a third overlapping flag next to `--from` and `--preset`.
2. **Option matrix.** Reject `--db` mysql/mssql/none, `--no-aspire`, `--service false` and conflicting service/model names. Decide whether interactive init offers the example or skips it, and test it.
3. **Failure semantics.** Nothing can be rolled back, so a mid-recipe failure must exit non-zero, list the completed and failed steps in JSON, and leave a partial project that cannot be mistaken for a working one.
4. **Default init unchanged.** Prove it with a golden file-set and content-hash test, not a claim.
5. **Carried finding from the #2570 S2 review.** With a live service, the capability projection still reports the service as `installed-unwired` (`assets/app/lib/scaffold-capabilities.ts.template:45-47`). The showcase consumes this projection, so fix it in S2.
6. **Runtime suite.** Add a new showcase suite in `packages/cli/e2e/src/domain/cli-surface.ts` and the expensive-runtime list; leave `scaffold.runtime` untouched. Background services and streams must be found by Aspire resource name. Lifecycle updates from the sagas must reach orders through installer-declared service references, not hand-edited `appsettings.json`.
7. **Visual matrix.** Name the Figma reference frames for each new page (orders, detail, chat, lifecycle) before S2. Where no frame exists, state how the 8/10 fidelity score is judged.
8. **Evidence labels.** The full showcase runtime proof stays UNPROVEN until it runs in Docker-capable CI. Keep three labels separate: native Aspire runs, deterministic provider/credential fixtures, and real external providers. No made-up rows or provider responses.

The five-slice order holds, with S3 (streams) required before S4's durable chat. Resolve B1–B3 in `plan.md` before S1, get the owner's choice on B4, write B5–B7 into S3–S5 and `drift.md`, then resubmit to this session.
