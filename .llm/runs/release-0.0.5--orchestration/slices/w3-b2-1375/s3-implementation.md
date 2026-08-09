# S3 implementation evidence — #1375

Date: 2026-08-09

## Delivered

- `agent init --with-docs` derives one absolute installed root only after docs generation succeeds.
- Claude `.mcp.json`, VS Code `.vscode/mcp.json`, and Zed `.zed/settings.json` append the same
  `--docs-root <project>/.netscript/docs` pair. No-docs exact command assertions remain unchanged.
- The generated-project local-source stdio proof now returns installed slug
  `pages/services-sdk/services` for `typed client for a service` rather than the fallback corpus.
- The same generated command reports `filesystem`, the installed root, and total count through
  `list_docs.corpus`.
- Agent tooling, MCP reference, and package README document wiring, precedence, generated fallback,
  negative behavior, and observability. The README publish asset was regenerated.
- Nullable corpus-root JSON Schema validation accepts string/null and rejects other types.

The `packages/mcp/README.md` edit is limited to docs corpus examples/configuration. It does not edit
#1376's command execution, list-command identity, or receipt material. The second-to-merge branch
must still rebase and regenerate publish assets.

## Focused GREEN verdict

Command:

```text
deno test -A --no-lock packages/cli/src/public/features/agent/init/init-agent_test.ts packages/mcp/tests/docs_test.ts packages/mcp/tests/registry_test.ts packages/mcp/tests/release-embedded-docs-corpus_test.ts .llm/tools/generate-publish-assets_test.ts
```

Raw exit code: `0`; named result: `48 passed | 0 failed`; no skips.

Decisive named test:

- `generated project search_docs reaches its installed corpus after host restart` — GREEN against
  a real local CLI stdio process launched from the generated host args. It returns the installed
  services slug and filesystem/root/count metadata.

All-host named test:

- `agent init --with-docs gives Claude, VS Code, and Zed the same docs root` — GREEN.

Command:

```text
deno task check:publish-assets
```

Raw exit code: `0`; generated README/fallback assets were current.
