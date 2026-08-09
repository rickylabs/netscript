# S1 RED evidence — #1375

Date: 2026-08-09

No product source changed in this slice. Every test module loaded and ran; no RED below is a
module-resolution, missing-export, type-check, permission, or process-launch setup failure.

## MCP documentation behavior

Command:

```text
deno test -A --no-lock packages/mcp/tests/docs_test.ts
```

Raw exit code: `1`

Named result: `14 passed | 3 failed`; failures:

- `docs root precedence is flag then environment then an indexable project probe` — expected
  `<temp>/.netscript/docs`, received `undefined`.
- `list_docs reports filesystem corpus kind, root, and total document count` — the tool returned
  the expected bounded row, but `corpus` was `undefined` instead of filesystem/root/count metadata.
- `an empty project probe falls back to an observable embedded corpus` — the embedded result was
  nonempty, but `corpus` was `undefined` instead of embedded/null/count metadata.

## MCP output contract

Command:

```text
deno test -A --no-lock packages/mcp/tests/registry_test.ts
```

Raw exit code: `1`

Named result: `4 passed | 1 failed`; failure:

- `list_docs output schema requires observable corpus health metadata` — `corpus` is absent from
  the schema's required fields and properties.

## Agent-init host configuration and real stdio search

Command:

```text
deno test -A --no-lock packages/cli/src/public/features/agent/init/init-agent_test.ts
```

Raw exit code: `1`

Named result: `16 passed | 3 failed`; failures:

- `agent init --with-docs installs a path-closed local corpus` — the generated Claude args ended
  in `--project-root <root>` rather than `--docs-root <root>/.netscript/docs`.
- `agent init --with-docs gives Claude, VS Code, and Zed the same docs root` — the first generated
  host lacked the expected docs-root pair; the shared assertion matrix is therefore RED.
- `generated project search_docs reaches its installed corpus after host restart` — the generated
  project and real local CLI stdio process both started successfully, but the query `typed client
  for a service` returned exactly the embedded `mcp` and `help` matches. It did not return the
  installed-only slug `pages/services-sdk/services`.

The stdio fixture substitutes only the repository config and local CLI module for the generated
command's published specifier, while preserving the generated project-root and docs-root arguments.
This is a focused local-source proof, not a post-publish consumer measurement (#1197 remains
unclaimed).
