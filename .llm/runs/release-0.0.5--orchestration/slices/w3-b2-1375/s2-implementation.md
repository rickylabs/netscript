# S2 implementation evidence — #1375

Date: 2026-08-09

## Delivered

- Generated five locked golden-path Markdown sources from
  `.llm/assets/agent-docs/prose.json.gz` into registry-safe TypeScript.
- Recorded schema/framework/source-commit/path/source-byte/count/SHA-256 provenance.
- Enforced the exact 256 KiB (`262_144`) ceiling; selected source size is `79_292` bytes.
- Added a release embedded corpus that rejects version/cardinality/byte mismatches synchronously and
  verifies SHA-256 before its first query. Outer CLI `help.md` augments rather than replaces it.
- Added an indexability probe that reuses filesystem serving's path, parser, redirect, and public
  document rules.
- Implemented flag > environment > probe > embedded selection, including a real stdio regression
  showing environment wins over an indexable project probe.
- Added `list_docs.corpus = { kind, root, documentCount }` to live output and exact schema.

The `packages/mcp/cli.ts` diff is confined to docs imports, resolution, corpus construction, and
docs-flow composition. It does not change any #1376-owned symbol or behavior.

## Focused verdict

Command:

```text
deno test -A --no-lock .llm/tools/generate-publish-assets_test.ts packages/mcp/tests/release-embedded-docs-corpus_test.ts packages/mcp/tests/docs_test.ts packages/mcp/tests/registry_test.ts
```

Raw exit code: `0`

Named result: `29 passed | 0 failed`:

- release adapter: 4/4, including golden paths, additive help, constructor version mismatch, hash
  mismatch;
- docs behavior: 18/18, including precedence, non-indexable fallback, stdio environment precedence,
  and filesystem/embedded metadata;
- registry: 5/5, including exact required corpus schema;
- generator: 2/2, including locked paths, `79_292 <= 262_144`, hash, and release provenance refresh.

Command:

```text
deno task check:publish-assets
```

Raw exit code: `0`; generated outputs were current. No tests were skipped.
