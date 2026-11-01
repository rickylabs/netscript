# Independent MCP slice review — final

Requested route: `claude -p --model claude-opus-5-5 --effort high`; same evaluator session, read-only, stdin closed, blockers only.

**PASS.** The repair closes the truncation blocker, and I found no new blockers in the MCP registry-tool slice. This verdict comes from reading the current files only; the shell was disabled, so I didn't run anything.

- **Policy:** `view_registry_item` now has `truncation: 'exempt'` and `envelopeCheck: true` (`packages/mcp/src/application/tool-registry.ts:79-84`), the same policy `get_doc` uses. Exempt results skip the 2,000-character cut but still go through the 64 KB check inside `truncateResult` (`mcp-server.ts:138-143`, `truncation.ts:34-36`).
- **Oversized responses fail cleanly:**
  - An inner result over the limit fails in `truncateResult` with `-32603` and data code `tool_result_too_large` (`mcp-server.ts:147-151`).
  - A result that is under the limit but whose full response is over it (the content is duplicated in `content[0].text` and `structuredContent`) fails at the envelope check with the same code (`mcp-server.ts:164-174`).
  - Neither path returns a partial result.
- **Tests:**
  - `ui-registry-tools_test.ts:158-178` sends `button` through `createMcpCliServer()`, compares every file's `content` with `FRESH_UI_REGISTRY_CONTENT`, and requires at least two source files over 2,000 characters.
  - `ui-registry-tools_test.ts:180-199` uses 40,000- and 100,000-byte payloads to cover both failure paths. It asserts the error code and that `result` is `undefined`.
- **Description:** the tool says it returns exact bytes and fails with a structured error when a response is too large. It points to `netscript ui:view` for larger items. That command belongs to the remaining CLI slices, so it isn't a blocker here.

Nothing else in scope has changed since the last review: list and search, the input limits, the secret-free error mapping, the `ui:add` argv tool and the default offline composition.
