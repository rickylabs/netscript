# Validation commands

Structured check wrapper flags use separate arguments: `--deno-arg --frozen`, not `--deno-arg=--frozen`. Source check adds unstable-kv itself. `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read --frozen packages/fresh-ui/tests/contracts/format.test.ts` passes. Narrow check/lint/fmt use `--root packages/fresh-ui/src/contracts --root packages/fresh-ui/contracts.ts --ext ts,tsx`. The full quality:gate passes on the initial contract schema (baseline warnings remain).

Wrapper JSON contains absolute cwd by default. Public run evidence replaces the worktree prefix with `.`; evaluator transport JSON (which contains session identity) must stay outside the public repository and only its verdict text is committed.
