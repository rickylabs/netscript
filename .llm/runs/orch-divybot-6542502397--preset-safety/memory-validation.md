# CLI validation recipes

Root fmt and lint deliberately exclude packages/cli; explicit CLI file checks require an external scoped config with the same formatting options and lint rule tags, without the CLI exclusion. Structured wrappers report filesProcessed/droppedFiles, which must be checked. run-deno-check.ts passes --unstable-kv by default; its own parser does not accept --unstable-kv (use --deno-arg if needed). Full URL preset token compilation tests are expensive; select only new regressions for the red run and run the full relevant set once for final validation.
