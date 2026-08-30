# Aspire 13.5 emitted member table — S8

Restored authority: Aspire SDK 13.5.3, `.aspire/modules/aspire.mts` SHA-256
`7cd4cf8319360b4ddbe8fb8f5481e3e5907610883c40179840fa249a86600487`, and
`.aspire/modules/base.mts` SHA-256
`e2ce97fa0ceaf103fd604174473dfcb6e586db9f548d1759e291618514ec656e`.

| Emitted member | Emitted call sites | Restored 13.5.3 declaration | Verdict |
| --- | --- | --- | --- |
| `withCommand` | Three definitions on each `<db>-cli` executable | `aspire.mts:27169`: `withCommand(name: string, displayName: string, executeCommand: (arg: ExecuteCommandContext) => Promise<ExecuteCommandResult>, options?: WithCommandOptions): ExecutableResourcePromise` | Direct 13.5.3 member; callbacks return `{ success, message }`. |
| `WithCommandOptions.commandOptions` | Options object on each command | `aspire.mts:1695-1697`: `commandOptions?: CommandOptions` | Matches the restored wrapper shape rather than the older documentation-only positional spelling. |
| `CommandOptions.arguments` | `timeout` on all commands; `confirm` on `reset` | `aspire.mts:802-814`: `arguments?: InteractionInput[]` | Direct typed argument contract; no `promptInputs`. |
| `ExecuteCommandContext.arguments()` | Every command callback | `aspire.mts:5842-5850`: `arguments(): InteractionInputCollectionPromise`; `base.mts:476-486`: `value(name)` and `requiredValue(name)` | Reset confirmation is read before connection resolution or process IO. |
| `CommandOptions.iconName` | Every command definition | `aspire.mts:835-836`: `iconName?: string \| null` | Direct metadata using Fluent UI database icons. |
| `DistributedApplicationBuilder.getConfiguration()` / `Configuration.getConnectionString()` | Non-SQLite callbacks | `aspire.mts:10463-10466`: `getConfiguration(): ConfigurationPromise`; `aspire.mts:10035-10040`: `getConnectionString(name: string): Promise<string>` | Resolves the allocated database connection string at callback time without using an unsupported `ServiceProvider` member. |
| `excludeFromMcp()` | Once per `<db>-cli`, guarded by `RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp` | `aspire.mts:27323-27327`: `excludeFromMcp(): ExecutableResourcePromise` | Direct D-6 member; affects MCP resource/log/telemetry exposure only and never emits `withHidden()`. |
| Default command visibility | Explicit `visibility` omitted | `aspire.mts:734-740` emits string enum values; `aspire.mts:824-832` types `visibility?: ResourceCommandVisibility` | The documented bitwise UI+API form fails D-19. Omission retains Aspire's documented default of both surfaces without a cast; see drift D-03. |

Official API pages remain the prose cross-reference:
[`withCommand`](https://aspire.dev/reference/api/typescript/aspire.hosting/withcommand.md),
[`CommandOptions`](https://aspire.dev/reference/api/typescript/aspire.hosting/commandoptions.md),
[`ExecuteCommandContext`](https://aspire.dev/reference/api/typescript/aspire.hosting/executecommandcontext.md),
[`InteractionInputCollection`](https://aspire.dev/reference/api/typescript/aspire.hosting/interactioninputcollection.md),
[`getConnectionString`](https://aspire.dev/reference/api/typescript/aspire.hosting/getconnectionstring.md), and
[`excludeFromMcp`](https://aspire.dev/reference/api/typescript/aspire.hosting/excludefrommcp.md).
