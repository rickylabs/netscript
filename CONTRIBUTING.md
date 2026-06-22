# Contributing

Start with [`AGENTS.md`](AGENTS.md): it is the entry point for the operating rules, read order,
tooling, and validation that every change follows.

Use the harness workflow in [`.llm/harness/`](.llm/harness/README.md) for substantial changes.
Package and plugin work follows the Architecture Doctrine under
[`docs/architecture/doctrine/`](docs/architecture/doctrine/) — identify the archetype, public
surface, and gates before changing framework code.

Before opening a PR, run the narrowest validation that proves your change. The canonical command set
and the scoped check/lint/format wrappers are documented in [`AGENTS.md`](AGENTS.md) under
**Validation**; do not run repo-wide `deno task fmt` unless you are explicitly making a
formatting-only change.
