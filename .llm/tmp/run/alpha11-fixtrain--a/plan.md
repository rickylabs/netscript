# Plan

## Selected Profile

- Archetype: `ARCHETYPE-6-cli-tooling.md`.
- Scope overlays: none.
- Current doctrine verdict: `packages/cli` is a known Archetype 6 restructure target. This slice
  does not deepen that debt.

## Locked Decisions

- F-3: import `packages/cli/deno.json` as JSON from the public command tree and wire
  `cliMeta.version` into Cliffy's root `version`.
- F-4: keep normal public command dependencies on `DenoFileSystem`, but add an init-context factory
  in the public dependency composition that swaps in `DryRunFileSystemAdapter` when the parsed
  `--dry-run` flag is true.
- F-4: retain the `runInitPipeline` dry-run guards around format and git init, and add regression
  coverage proving a dry-run init leaves the target path absent.

## Open-Decision Sweep

- No open decision would force rework if deferred.

## Risk Register

- Risk: static JSON import type-checking changes the module graph. Mitigation: run the requested
  package check wrapper.
- Risk: dry-run adapter may not emulate enough filesystem behavior for later phases. Mitigation:
  run a real public `init --dry-run` command against a temporary target and assert the target remains
  absent.
- Risk: existing unrelated `.llm/tmp/run/openhands/**/request.md` modifications may pollute staging.
  Mitigation: stage explicit paths only.

## Gate Set

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts --unstable-kv`
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli --ext ts`
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts`
- Targeted unit tests for root version and write-free dry-run init.

## Deferred Scope

- Full `scaffold.runtime` e2e is explicitly out of scope for Slice A.
- Archetype 6 restructuring debt is out of scope.

