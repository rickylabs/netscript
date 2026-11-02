# Live proof setup

Maintainer init resolves the monorepo from the target path, so an external sibling project run path is rejected even when invoked at repo root. Put generated proof under the worktree `.llm/tmp/` (gitignored), keep raw logs in the project run area, and declare it as an owned root for cleanup if needed. Root imports do not expose all CLI/contracts dependencies; generated-contract tests resolve actual sibling contract modules and the existing npm catalog.
