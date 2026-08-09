# S6 final-head generated-consumer completion — CLI embedded docs

Date: 2026-08-09

## Diagnosis

Fresh CI after S5 passed `check:netscript-jsr-specifiers` but failed `check:assets-barrel`. The
refreshed `.llm/assets/agent-docs/prose.json.gz` is a shared input: MCP publish assets consume it,
and the CLI asset-barrel generator embeds it for the installed offline documentation corpus. S5
regenerated the former but omitted the latter.

## Repair

- Ran the canonical `deno task gen:assets-barrel` generator.
- Committed its sole generated delta in
  `packages/cli/src/kernel/assets/agent-docs.generated.ts`: payload base64 plus matching
  `compressedBytes` and `sha256` provenance.
- Did not hand-edit generated output or change product source behavior.
- Did not rerun `scaffold.runtime`; the prior serialized runtime verdict remains the relevant
  behavioral proof.
- Preserved the declared #1400 overlap: #1400 remains second-to-merge and will rebase/regenerate
  publish assets afterward.

## Gate evidence

| Gate | Raw exit | Named result |
| --- | ---: | --- |
| `deno task check:assets-barrel` | 0 | CLI embedded-docs asset matches the shared compressed prose input |
| `deno task check:publish-assets` | 0 | MCP generated corpus/provenance remains current |
| `deno task check:netscript-jsr-specifiers` | 0 | scanned 2,314; allowances 1; ranges 0; failures 0 |
| focused CLI/MCP/docs/generator suite | 0 | 48 passed, 0 failed; decisive stdio and all corpus acceptance tests remain green |
| `git diff origin/main -- deno.lock` | 0 | empty diff |
