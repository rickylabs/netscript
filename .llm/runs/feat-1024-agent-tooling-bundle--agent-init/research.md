# Research — feat-1024-agent-tooling-bundle--agent-init

## Re-baseline

- Carried-in source: user slice brief for issues #1024 and #1061, based on `origin/main` at
  `ab0fa13fe`.
- Re-derived against `origin/main` at `e5bae2858` on 2026-08-03.
- What changed vs the carried-in version:
  - PR #1079 merged while research was in progress. It owns #1068's documentation task router and
    is now part of this run's baseline. This run consumes its generated `llms.txt`; it does not
    author or edit the router.
  - The branch was clean, so it was rebased from `ab0fa13fe` to `e5bae2858` before the plan was
    locked.

## Findings

| # | Finding | How to verify |
| - | ------- | ------------- |
| 1 | #1024 has six unchecked acceptance criteria and #1061 has five; all eleven are close-gated. | GitHub issue bodies fetched in full on 2026-08-03. |
| 2 | `agent init` currently accepts only `--host`; it embeds and installs skills but no consumer tools or docs. | `deno run -A packages/cli/bin/netscript-dev.ts agent init --help`; `init-agent-command.ts`; `init-agent.ts`. |
| 3 | The existing skill generator reads only `skills/manifest.json`; no manifest distinguishes consumer-facing `.llm/tools` from repo-internal tooling. | `.llm/tools/generate-cli-assets-barrel.ts`; `skills/manifest.json`. |
| 4 | Seven requested tools are standalone or use only JSR imports. The scaffold E2E tool is not consumer-safe: it imports agentic teardown internals and defaults to the repository-only `packages/cli/bin/netscript-dev.ts`. | Imports and `defaultOptions()` in `.llm/tools/e2e/scaffold-e2e-test.ts`. |
| 5 | The E2E tool writes its default smoke/log/resource paths relative to its inferred repository root. Once installed at `<project>/.llm/tools/e2e`, that inference can become the consumer project root, but the CLI default and teardown imports must be removed/refactored first. | `inferRepoRoot()`, `defaultOptions()`, and `normalizeCommandOptions()` in the E2E tool. |
| 6 | The host-port validator exists but is only a root task; `agent init` does not install it and the consumer E2E does not invoke it against its generated project. | root `deno.json` task `check:aspire-host-ports`; E2E step list. |
| 7 | The installed `help.md` names local `docs/deno-doc/` and `docs/llms-full.txt` paths even though `agent init` never creates them. This violates the slice rule that generated path references must resolve. | `skills/help.md`; baseline `agent init` fixture. |
| 8 | The external wave builder produces an 8.2 MB bundle (162 pages, 36 API files at the 0.0.3 snapshot). Prose/index data and API surfaces have different freshness authorities: site output is release-built, while API surfaces must be generated from exact installed packages. | `/home/codex/repos/.briefing/build-docs-bundle.sh`; existing bundle `MANIFEST.md`. |
| 9 | PR #1079's task router is generated into `llms.txt` by `docs/site/_plugins/ai-tooling.ts`, so consuming the built `llms.txt` includes it without duplicating router prose. | `buildLlmsIndex()` in `docs/site/_plugins/ai-tooling.ts`; PR #1079. |
| 10 | JSR version metadata already exposes exact-version export maps at `<version>_meta.json`; the CLI has a tested parser for that shape. The docs installer can instead embed the same-release export manifest at build time and use the project's exact locked NetScript versions, avoiding a runtime metadata dependency. | `packages/cli/src/public/infra/jsr/fetch-jsr-plugin-validator.ts`; its tests. |
| 11 | `Deno.Command(...).output()` throws when the executable is missing. Current E2E command execution catches thrown launches, but there is no fixture proving the installed consumer tool reports this path structurally. | `SmokeRunner.#runCommand()`; slice rule; planned missing-binary fixture. |
| 12 | Baseline `@netscript/cli` documentation lint is clean across all three published exports. | `deno task doc:lint --root packages/cli --pretty` → 0 total errors on 2026-08-03. |
| 13 | Baseline focused agent-init tests pass (9/9), and no test currently covers tool/docs installation or consumer path closure. | `deno test --allow-all packages/cli/src/public/features/agent/init/init-agent_test.ts`. |

## jsr-audit surface scan (package/plugin waves)

- Surface scanned: `packages/cli/deno.json` exports (`.`, `./scaffolding`, `./testing`) and
  `deno doc packages/cli/mod.ts`.
- Current metadata: scoped name, description under 250 characters, three valid entrypoints, ESM
  source, and publish include/exclude rules are present.
- Baseline documentation risk: none (`deno task doc:lint --root packages/cli --pretty` returned zero
  diagnostics).
- Planned surface risk: `--with-docs` is a command option, not a new package export. New exported
  internal module symbols still need JSDoc because the touched published package must remain clean.
- Publish risk: compressed embedded prose and generated tool text must be included as TypeScript
  constants rather than runtime filesystem reads or import attributes, matching the repository's
  established JSR-safe asset pattern.

## Open questions resolved by the plan

- Install root: tools go to `.llm/tools/`; optional docs go to `.netscript/docs/`.
- Tool scope: exactly the eight issue-listed consumer entrypoints; implementation-only support
  modules, if any, are manifest-declared dependencies and are not advertised as standalone tools.
- Docs authority: prose/index comes from a release-built site bundle; API text is generated during
  `agent init --with-docs` from exact locked `@netscript/*` versions and every build-time-known
  export subpath.
- Failure semantics: version mismatch, missing lock/package evidence, a missing `deno` executable,
  or any failed `deno doc` aborts before docs files are written.
- #1072 boundary: this slice announces and routes the installed tools/docs from `AGENTS.md` and
  skills, but does not implement the drift-entry diagnostic gate or edit `/home/codex/repos/ns004-scaffold`.
