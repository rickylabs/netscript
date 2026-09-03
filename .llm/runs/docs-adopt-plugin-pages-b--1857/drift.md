# Drift Log: final plugin reference adoption

Drift is append-only.

## 2026-09-01 — carried-in baseline advanced

- **What:** The assignment was measured at `8e01a347a`, while live `origin/main` is
  `d2b33a09bbcb37946e339837238987b79c192fd3`.
- **Source:** `git fetch origin main`; `git rev-parse origin/main`.
- **Expected:** Re-baseline all findings and use the current 32-row mapping.
- **Actual:** Findings and counts remain the same after rebase; symbol coverage was freshly measured.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `research.md` and measurement output under `.llm/tmp/`.

## 2026-09-01 — RTK unavailable

- **What:** The checked-in RTK skill says the binary is on PATH, but `rtk` returns command not
  found in this environment.
- **Source:** attempted bounded `rtk git`/`rtk gh` commands.
- **Expected:** RTK v0.38.0 available for read-heavy shell output.
- **Actual:** `/bin/bash: rtk: command not found`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Raw bounded commands are used; durable verdicts use real command exit codes.

## 2026-09-01 — Deno doc JSON schema corrected in research helper

- **What:** The first temporary helper assumed a top-level array; Deno 2.9 emits version 2 JSON
  with module records under `nodes` and public symbols under each record's `symbols` array.
- **Source:** `deno doc --json plugins/triggers/cli.ts`.
- **Expected:** Read all exported node names excluding `default`.
- **Actual:** First helper exited 1 before results; corrected helper reran all entrypoints and exited 0.
- **Severity:** minor
- **Action:** fix
- **Evidence:** `.llm/tmp/measure-reference-symbol-coverage.ts` and
  `.llm/tmp/docs-adopt-plugin-pages-b-symbols.jsonl`.
