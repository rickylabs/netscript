# Drift — fix-cli-jsr-asset-embedding--asset-embed

## Fresh UI Full Export-Map Doc Lint

The S3 plan asked for `deno doc --lint` over the full `@netscript/fresh-ui` export map. The new
`./registry` export is doc-lint clean, but the full export-map command remains red on existing
runtime public-surface debt:

```text
deno doc --lint packages/fresh-ui/mod.ts packages/fresh-ui/interactive.ts packages/fresh-ui/primitives.tsx packages/fresh-ui/registry.ts
```

Result: FAIL with 87 findings, all under existing runtime files such as
`src/runtime/accordion`, `src/runtime/dialog`, `src/runtime/drawer`, `src/runtime/popover`,
`src/runtime/sheet`, `src/runtime/tabs`, and `src/runtime/tooltip`. Findings are missing JSDoc and
private-type references on already-exported runtime namespace/props types. The new
`packages/fresh-ui/registry.ts` subpath passes `deno doc --lint` by itself.

## Scaffold Runtime Smoke

The full `scaffold.runtime` smoke was run twice.

The first run failed after exposing an S1/S3 regression: embedded service templates were rendered
without the existing pipe support, leaving placeholders such as `{{serviceName | camelCase}}` in
generated service files. That was fixed by delegating `renderTemplateAssetSync` to the existing
`renderTemplate` helper.

The rerun passed scaffold init and all plugin-add gates, then failed at `database.init` due an
external Aspire dashboard port conflict:

```text
Failed to bind to address https://127.0.0.1:18891: address already in use.
```

`ss -ltnp 'sport = :18891'` showed the port owned by `aspire-managed` for a separate worktree:

```text
/home/codex/repos/netscript-cli-plugin-copy/.llm/tmp/cli-e2e/plugin-smoke-20260626-101742/aspire/apphost.mts
```

That AppHost was not stopped from this worktree. No scaffold output byte drift was observed in the
rerun's scaffold init output.
