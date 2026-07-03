# Drift Log — feat-aspire-kv-connect-provisioner--371-372

Append-only. Format: `- <date> | <severity: minor|significant|architectural> | <what diverged> | <action>`

- 2026-07-03 | minor | Issue #371 claims the generator "emits a no-op comment" for a `DenoKv` engine; on main@bd03e51d `DenoKv` is absent from the cache vocabulary entirely. | Plan S1 introduces the engine value; issue text treated as historical.
- 2026-07-03 | minor | Issue #372 asks for `.config/dotnet-tools.json` + `dotnet tool restore`; Aspire TS SDK 13.4.4 ships native `addDotnetTool` which supersedes the manifest approach. | Locked D2 (SDK-native, manifest as fallback); will comment the drift on #372 when PR-B opens.
- 2026-07-03 | minor | Issue-era claim that `plugins/workers/bin/runtime.ts` lacks `import '@netscript/kv/redis'` is stale — present on main; template conditionally emits it. | Reduced to a verification item (PR-B S6 audit across generated RequiresKv entrypoints).
