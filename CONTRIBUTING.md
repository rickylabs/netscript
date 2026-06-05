# Contributing

Use the harness workflow in `.llm/harness/` for substantial changes. Package
and plugin work follows the Architecture Doctrine under `docs/architecture/`
once Group B carries the governance payload.

Before opening a PR, run the narrowest affected `deno task check`, then run
`deno task fmt` and `deno task lint` for changed files.
