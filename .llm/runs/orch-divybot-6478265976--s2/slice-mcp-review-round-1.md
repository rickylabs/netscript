# Independent MCP slice review — round 1

**FAIL_FIX.** The registry-tool slice has one blocker: `view_registry_item` silently cuts the source of almost every real component. I couldn't run anything this round because the shell was disabled, so this finding comes from reading the code, not from a run.

### Blocker 1: `view_registry_item` returns cut-off copy files with no warning

- **What happens:** `FreshUiRegistryCatalog.view` (`packages/mcp/src/infrastructure/fresh-ui-registry-catalog.ts:20-38`) builds the item with the shared publisher and puts each file's full source in `files[].content`. The MCP server then applies its default size limits to every successful result (`packages/mcp/src/application/runner/mcp-server.ts:138-143`, `truncation.ts:10`). Those limits cut any string over 2,000 characters down to its first 2,000 and add `…[truncated]`. The only tool exempt from this is `get_doc` (`packages/mcp/src/application/tool-registry.ts:76-85`); `view_registry_item` gets no exemption.
- **Result:** `button.tsx` is 175 lines, so `view_registry_item {name:"button"}` returns only its first 2,000 characters. The same goes for its 181-line CSS and most other component, block and theme files. The cut-down result still passes the output schema, `isError` is `false`, and the item has no `truncated` field, so the client gets corrupted source with nothing marking it except the suffix inside each string.
- **Why it's a blocker:** viewing an item's copy files is what this tool is for, and the code says it returns "exact embedded copy bytes". The test `default MCP composition serves embedded registry metadata and exact copy bytes offline` (`packages/mcp/tests/ui-registry-tools_test.ts:141`) only checks `cn`, which is 11 lines and under the limit, and it only checks that `clsx` appears somewhere. So the suite passes while the default offline tool is wrong for real items.
- **Required fix:**
  1. Return exact bytes. Either give `view_registry_item` a size policy that exempts it from string cutting but still enforces the 64 KB response limit, or page large items (for example, return file metadata and use a cursor to fetch file content in exact chunks, as `get_doc` does).
  2. Add a test that compares the default-composition view of a component over 2,000 characters (for example `button`) byte for byte with `FRESH_UI_REGISTRY_CONTENT`.
  3. Add a test that a large item either pages correctly or fails with a structured error, rather than returning partial content.

### Checked, no blockers

- **Default composition:** `cli.ts:158` wires `FreshUiRegistryCatalog` in by default and lets the caller swap in another catalog. It reads embedded data with lazy imports, so it needs no network and runs no registry code.
- **Input limits and pagination:**
  - `offset` is 0–100000, `limit` is 1–20, `query` is 1–500 characters, and `name` is 1–2000 characters. Extra properties are rejected.
  - Pages are capped at 20 items, and `nextOffset` appears only when more items remain.
  - The output schema caps item lists at 20 entries.
- **No secrets in errors:** list, search and view failures all collapse to a fixed `REGISTRY_UNAVAILABLE` message, and a test confirms the secret string never appears in the response.
- **`ui:add` command output:** the tool returns `{command:'netscript', args:['ui:add', name]}` and never runs it.
  - **Accepted:** a bare id or `@namespace/name`, or an http(s) URL with no username or password.
  - **Rejected:** flags like `--force`, shell syntax, `file:` URLs and URLs with credentials.
  - The tool never reads the catalog.
- **Dependencies and surface:**
  - `@netscript/fresh-ui@0.0.8/registry` and `/registry-v2` are pinned the same way as the other internal imports, and `registry-v2.ts` exports `buildRegistry`.
  - All registry source paths sit under `packages/fresh-ui/`, so stripping that prefix to find the embedded content works.
  - The four new tools are appended at the end of `TOOL_NAMES`.
  - The registry tools are classified `read`/`meta`; none can change anything.

## Single repair

Exempt registry views from generic string/array truncation while enforcing the complete response byte ceiling. Tests compare both long button source files byte-for-byte and require a structured transport-limit error for oversized payloads.
