# Drift: service OpenAPI Scalar asset embed

## 2026-06-28 — minor

- The requested service check command included `--unstable-kv` directly:
  `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts --unstable-kv`.
- Current `.llm/tools/run-deno-check.ts` exits 1 for that argument because it passes
  `--unstable-kv` to `deno check` by default and exposes `--no-unstable-kv` / `--deno-arg`.
- Equivalent supported command was run:
  `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/service --ext ts`.
- Evidence: exit 0; wrapper reported `deno check --quiet --unstable-kv <files>`, 35 files, 0
  occurrences.
