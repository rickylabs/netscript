### S1 Slice 7 green-up: cli-config-fixtures sub-slice

Commit: `bb7a521` (`test(greenup): cli fixtures — isolate config-dependent tests`)

Before -> after failure count: expected `7 failed` -> expected `1 failed` after targeted fix.

Dispositions:
- `plugin-registry.test.ts` (`:7`, `:37`, `:49`) had missing fixture setup: tests assumed a repo-root `netscript.config.ts` that is no longer present. Rewritten to create a temp project config and load real workspace plugin manifests by package specifier.
- `compile.test.ts:7` and `compile_test.ts` (`:35`, `:63`) had the same missing config root, plus stale `dotnet/AppHost/appsettings.json` repo reads. Rewritten to create local temp `netscript.config.ts` and `dotnet/AppHost/appsettings.json` fixtures.

Proof:

```text
deno test --allow-all packages/cli/src/kernel/adapters/config/plugin-registry.test.ts packages/cli/src/kernel/adapters/windows/compile/compile.test.ts packages/cli/src/kernel/adapters/windows/compile/compile_test.ts
ok | 6 passed | 0 failed (1s)
```
