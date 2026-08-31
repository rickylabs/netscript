# Drift Log: TanStack AI coherent family bump

## 2026-08-31 — launcher run ID supersedes stale brief path

- **What:** Use `fix-tanstack-ai-caret-bump--1695` rather than the brief's `deps-` run directory.
- **Source:** owner correction and launcher-created `codex-thread-ids.md`.
- **Expected:** `.llm/runs/deps-tanstack-ai-caret-bump--1695/` in the original brief.
- **Actual:** `.llm/runs/fix-tanstack-ai-caret-bump--1695/` is authoritative.
- **Severity:** minor
- **Action:** accept
- **Evidence:** this run directory.

## 2026-08-31 — current stable exceeds brief example

- **What:** Core stable is now `0.52.0`, with corresponding newer provider releases.
- **Source:** captured `deno task deps:latest --filter '@tanstack/ai*'` RC 0.
- **Expected:** brief problem statement cited core `0.48.0` as shipped.
- **Actual:** core `0.52.0`, Anthropic `0.18.3`, MCP `0.3.8`, OpenAI `0.22.3`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `worklog.md` raw output.

## 2026-08-31 — RTK unavailable

- **What:** The preferred read-heavy output proxy is not installed on this host.
- **Source:** shell returned `rtk: command not found`.
- **Expected:** AGENTS.md tooling path uses `rtk` for read-heavy git/rg commands.
- **Actual:** Raw read-only `git` and `rg` commands were used; gates remain wrapper-sourced.
- **Severity:** minor
- **Action:** accept
- **Evidence:** bootstrap command output.

