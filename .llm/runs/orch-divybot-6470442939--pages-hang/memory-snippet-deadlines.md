# Snippet process and validation recipes

- Production entry: `.llm/tools/docs/check-snippets.ts`; keep its imports registry-independent.
  The incident stalled loading @std/text before the old checker could execute.
- Worker retains the extractor/policy/compiler flow. All source fences are materialized first;
  each compiler entrypoint then has its own deadline. Snippets remain compilation-only.
- `node:child_process.spawn` with inherited environment requires `--allow-env` in Deno, even
  when the code does not explicitly call Deno.env. Docs snippet tasks now declare it.
- Root lint excludes `.llm/`; use the structured lint wrapper with explicit changed files and
  `--config docs/site/deno.json`. Linting every docs tool encounters unrelated existing findings.
- Structured check and fmt wrappers accept `.llm/tools/docs` directly. Exclude `/fixtures/`
  because negative fixtures intentionally contain invalid TypeScript or nonterminating code.
- Full scaffold.runtime currently fails Aspire doctor and Docker-daemon preflight in this worker;
  do not treat runtime validation as green or delete resources belonging to another run.
