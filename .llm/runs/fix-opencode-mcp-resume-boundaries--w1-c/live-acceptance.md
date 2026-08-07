# Live acceptance — OpenCode MCP attachment and resume

Date: 2026-08-07

## Generated project

- Repo-local CLI scaffolded an Aspire-enabled project beneath the run-owned `.llm/tmp/w1-c-live`
  root.
- `netscript agent init --host all --editor none --with-docs` exited 0 and generated the current
  project `.mcp.json` with `netscript` and `aspire` stdio declarations.
- Observed host versions: OpenCode `1.17.20`; Aspire `13.4.6`.
- The generated project is temporary evidence input. No generated project file is committed.

## Derived route matrix

The matrix was queried from `CANONICAL_ROUTE_POLICY` immediately before dispatch. Current OpenCode
row count: 1.

| Lane                      | Provider     | Model                             | Effort | Measured turn | Resume |
| ------------------------- | ------------ | --------------------------------- | ------ | ------------- | ------ |
| `adversarial_design_eval` | `openrouter` | `openrouter/moonshotai/kimi-k2.6` | `high` | exit 0        | exit 0 |

## MCP-required measured run

- Safe receipt: `live-receipt.jsonl` lines 1–3.
- Preflight: 2 expected / 2 connected servers; host catalog count 14; expected MCP identity count 2;
  documentation lookup passed; MCP preflight call count 1.
- Product turn: a second `netscript_search_docs` discovery receipt proves non-zero NetScript MCP use
  after preflight.
- Stored product session: `ses_023871aaeffehRNSqFc3I43Fvc`.
- Raw launcher exit: 0.

## Real OpenRouter/OpenCode resume

- Resumed the exact stored session above through the sole current policy row.
- Provider response was `RESUME_OK`; raw launcher exit 0.
- Safe receipt line 4 proves the pre-dispatch hook validated two stored assistant events as
  `provider_valid`, with zero removed fragments/events. No prompt, message content, tool
  input/output, path, config, credential, or secret is present in the receipt.

## Resource and lock hygiene

- Read-only leak check after the interrupted negative-control attempt found no run-owned survivor;
  all reported containers were foreign/unproven and were left untouched.
- A local CLI invocation briefly changed three root lock entries. The run detected this before
  staging, reversed only those exact run-owned lines with a patch, and restored the recorded
  byte-identical SHA-256 `d32ef0c1f2b9256e05cf7339c452bd8cf6addeb9a4b433d38abcee992651b529`.
- No lock restore command, reload, cache clean, or foreign-resource cleanup was used.
