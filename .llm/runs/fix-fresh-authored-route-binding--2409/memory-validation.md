# Validation recipes

- Use --filter '/regex|alternatives/' for Deno test regular expressions. An unwrapped string is a
  literal substring; zero selected tests can exit zero, so inspect structured totalResults.
- Focused wrapper: deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --
  --allow-all packages/fresh/src/application/route/manifest-page-module.test.ts
  packages/fresh/src/application/route/manifest.test.ts packages/fresh/src/application/vite/vite.test.ts
  packages/cli/src/public/features/generate/routes/generate-routes-command_test.ts
- Actual Vite createServer with middlewareMode:true, watch:null and ws:false executes configureServer
  without a listening server. Close it before production build; tests need no custom type casts.
- Maintainer init has no --no-agent flag. --editor none is accepted. Its target must be below the
  monorepo; use ignored .llm/tmp for a focused no-Aspire scaffold proof, not an external runs path.
- Export corpus write mode refuses dirty source by design. Commit reviewed source before native
  regeneration; --check is non-mutating. Prose/assets generators are separate freshness surfaces.
- Current CLI route manifest staging already leaves authored pages alone, unlike Vite page rewriting.
