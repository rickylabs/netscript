# Generated AppHost validation recipes

Maintainer init requires its target below the checkout. It treats --path as a parent and appends
project name. Minimal proof uses `init <name> --path .llm/tmp/<proof> --db none --editor none --ci
--yes --no-git`, install stream then `sync plugin stream streams --project-root <project>
--no-samples --force` for current local service source. For streams-only focused proof, clear
Cache/PrimaryCache/Apps in the generated config and use copied service entrypoint. The normal
full runtime suite remains forbidden locally and required in armed CI.

registerPlugins' appHostDir parameter is actually project root; index resolves the parent of
builder.appHostDirectory(). Directory paths resolve from each resource's configured Workdir.
Execution fixtures outside the Deno workspace must resolve the compat shim's zod import to
import.meta.resolve('zod') (same native dependency), or bare zod cannot resolve.

CLI source is excluded by root fmt settings. Use the structured wrappers with a style-only config
(copy root fmt/lint fields without selection exclusions), require selected == processed; never
call a partial-exclusion refusal PASS.

After main integration, sync plugin inferred the generated fixture itself as the source, producing
a source/destination-same error. Pass --source-root <actual-monorepo> explicitly when refreshing an
existing generated fixture. Only the successful explicit sync plus restart proof counts as the
updated-source acceptance. Stop the exact focused AppHost after proof; no local full E2E needed.
