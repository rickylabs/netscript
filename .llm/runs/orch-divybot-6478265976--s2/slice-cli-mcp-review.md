# Independent CLI-hosted MCP registry review

Requested route: `claude -p --model claude-opus-5-5 --effort high`; same evaluator session, read-only, closed stdin, blockers only.

**PASS.** I found no runtime, security, public-surface or layering blockers in the CLI-hosted MCP registry integration. As before, I couldn't run anything, so this is from reading the code only; I didn't re-run the 10 agent/MCP tests you cited.

- **Project config:** `createCliUiRegistryCatalog` (`packages/cli/src/public/features/agent/mcp/create-cli-ui-registry-catalog.ts`) reads `components.json` from the explicit `projectRoot` on each call, through `readUiConfig` and the injected `FileSystemPort`. A missing file falls back to defaults (`config-lock.ts:16`), so apps without `components.json` still get the built-in catalog with no network access. The factory only reads; it never writes.
- **Listing:** list returns the built-in catalog plus each configured namespace's catalog, with namespaced names written as `@ns/name`. That matches the client's `namespaceRef` and the add-command checks, so a listed `@acme/x` round-trips into `ui:add`.
- **Viewing:**
  - Built-in names are checked against the built-in catalog first, so an unknown name gets the structured not-found result.
  - `@ns/name`, `http(s):` and `github:` references go through the same `registry.item()` resolver the installer uses.
  - It returns the resolved files with their exact content, so the earlier exact-bytes policy and the 64 KB limit still apply.
- **Credentials:**
  - The configured header templates go only to `transport.read`, and `FetchUiRegistry` resolves them there.
  - Neither the summaries nor the view payload include config or header values. The view payload is the item plus its files.
  - Transport exceptions are turned into the fixed `REGISTRY_UNAVAILABLE` error by the MCP flows.
  - File and `include` paths must pass `isUiRelativePath`, so a namespace's headers are only sent to paths under that namespace's own registry base.
- **Layering:** the public agent feature depends only on kernel application functions and ports. The concrete `FetchUiRegistry` adapter is wired in once, in the composition code (`run-agent-mcp.ts:73-77`). No installer or root-command code changed.
