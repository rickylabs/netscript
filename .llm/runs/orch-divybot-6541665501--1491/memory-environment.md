# Environment and reusable commands

RTK is unavailable; use native commands without changing semantics. Existing docs session notes were consulted before research. Run site validation via `deno task --cwd docs/site verify`. Canonical carrier refresh: `deno task gen:agent-docs-prose`, then `deno task gen:publish-assets`; check assets-barrel after committing generated changes because it checks git diff. Command and relay are service subpaths (`packages/service/commands.ts`, `commands-relay.ts`), not separate packages.
