# Plan — S7 CLI integration

## Profile and doctrine

- Archetype: **6 — CLI/Tooling**, because the delivered surface is two public command flows and a
  published binary composition path. MCP integration concerns are folded into the CLI application
  composition.
- Overlays: none (run artifacts are evidence, not a docs product; S9 owns docs-site work).
- Current doctrine verdict: the CLI is an active Archetype-6 remediation surface; preserve vertical
  feature slicing, thin commands, adapter-owned IO, and declarative root registration.
- In-scope anti-patterns: AP-1, AP-2, AP-3, AP-5, AP-7, AP-8, AP-9, AP-11, AP-13, AP-18, AP-19,
  AP-21, AP-22, AP-23, AP-25.

## Locked decisions

1. Add one additive `agent` registration to the existing public registry; its group owns `mcp` and
   `init` sub-features.
2. Put batteries-included MCP construction in the CLI agent feature application layer. Commands
   parse flags and call injected operations only.
3. Adapt the existing typed plugin doctor use case; enumerate the live registry and enumerable
   Cliffy descendants; retain top-level verbs as the guaranteed bounded catalog.
4. Use the existing public CLI execution base `deno run -A jsr:@netscript/cli`; host config invokes
   that same binary with `agent mcp` and absolute project/docs arguments.
5. Default docs to `<project-root>/docs/site`; accept `--docs-root` for installed docs. Do not add a
   repository-relative published fallback that would fail over JSR.
6. Extend the existing asset generator to emit a JSR-safe embedded skill map and deterministic
   SHA-256 bundle hash. Installation verifies the embedded bytes before writing.
7. Host selection is `claude|vscode|all`; absent flag detects existing host markers/config and uses
   all if neither is detected. Claude installs `.mcp.json`, skills, and marked `AGENTS.md`; VS Code
   installs `.vscode/mcp.json`.
8. File writes are content-aware and atomic enough for this command: unchanged bytes are no-ops;
   AGENTS content is replaced only inside stable markers.

## Open-decision sweep

- Safe to defer: embedding the complete NetScript public docs corpus (S9).
- Safe to defer: deeper Cliffy option-schema extraction when the public API is not enumerable;
  descriptors always include real registered verbs.
- Safe to defer: custom allow/deny flags unless composition remains small; the default allowlist is
  required and injectable.
- Must resolve now: none.

## Commit slices

1. **Embedded skill contract and installer flow.** Proves published bytes, hash verification, host
   selection, config emission, and idempotence. Files: asset manifest/generated barrel/generator;
   `public/features/agent/init/**`; focused tests; run artifacts. Gate: focused init tests + scoped
   check/lint/fmt.
2. **Real MCP composition and command group.** Proves telemetry/docs/doctor/catalog/executor wiring
   and additive CLI registration. Files: `public/features/agent/mcp/**`, adapters as needed,
   `agent-group.ts`, root registry, CLI import map, composition test, run artifacts. Gate: focused
   MCP round-trip and all MCP tests + scoped wrappers.
3. **Merge-readiness evidence.** Proves architecture, docs, publish surfaces, and regression suite;
   fixes only issues directly revealed by required gates. Files: run artifacts and owned fixes.
   Gate: specified checks/lints/fmt/tests, `arch:check`, doc lint, both publish dry-runs.

## Risk register

| Risk                                        | Mitigation                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Published CLI cannot read repo-root skills  | Generate TypeScript literals; test from embedded map.                                |
| CLI↔MCP dependency cycle                    | Only CLI imports MCP; MCP ports remain package-owned and generic.                    |
| Command catalog depends on Cliffy internals | Guarantee registry verbs; recurse only through public enumerable collections.        |
| Doctor fixture lacks a valid project        | Test with a controlled config/adapter seam and assert non-stub plugin family source. |
| Sibling CLI edits collide                   | One additive root import/register block; avoid unrelated shared-file formatting.     |
| Init overwrites user configuration          | Merge named server objects, stable markers, content-aware writes, temp fixtures.     |

## Required gates

- Scoped check/lint/fmt wrappers for `packages/cli` and `packages/mcp`.
- Focused CLI agent tests and all `packages/mcp/tests` with `--no-lock`.
- Universal/F-CLI structural evidence via `deno task arch:check` plus manual pending-script review.
- Full-export doc lint for both packages and publish dry-run for both packages.
- Consumer/runtime gate: MCP initialize → tools/list (13) → real `list_commands` → real plugin
  doctor family.

## Debt and deferred scope

No new debt planned. No new MCP tools, docs-site pages, skill content changes, broader CLI command
refactors, or full scaffold E2E (this slice does not change scaffold output).
