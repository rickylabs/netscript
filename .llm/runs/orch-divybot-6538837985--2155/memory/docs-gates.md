# Docs gate recipe

Use `deno task --cwd docs/site verify` for build, rendered checks, internal links and caveat refs. `deno task docs:snippets` is the repository snippet gate, with Tier-1 coverage only; new worker/retry examples need an additional focused compile. Markdown is excluded by docs/site/deno.json: raw deno fmt does not prove Markdown quality.
