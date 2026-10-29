# Worker command recipes

Native Gemini review works through agy with --mode plan --model gemini-4-argon-high and an explicit prompt argument after -p. Bare -p followed immediately by --mode is rejected; stdin alone is not the print prompt. Use structured subprocess argv to pass the prompt safely. JSON output is buffered until the turn ends.

The worker lacks RTK and initially had no git author identity. Set repository-local identity before the first commit; no attribution footers. Explicit fetch refspecs are needed for remote branches because the clone fetch configuration is narrow.

Renderer tests: deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all docs/site/_plugins/markdown-render_test.ts docs/site/_plugins/file-tree_test.ts. Site verify: deno task --cwd docs/site verify. Check wrapper needs --deno-arg --config --deno-arg docs/site/deno.json for site-imported fixtures.
