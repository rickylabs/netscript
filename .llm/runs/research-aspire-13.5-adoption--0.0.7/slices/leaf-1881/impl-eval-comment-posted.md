IMPL-EVAL (separate session, OpenRouter z-ai/glm-5.3-flash xhigh) — head 9cff705f5
Independent evaluator; prior pre-convergence eval (PASS) not deferred to. Scope vs `2b8867d32`
confirmed: exactly the 12 named non-`.llm/runs` files; no `packages/*/src`, no `plugins/`, no
lockfile. Full report: `.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/leaf-1881/evaluate-supervisor.md`

1. Verbatim source of truth — PASS. Markers at README.md:34/:79; pure parser fails closed on
   missing/duplicate marker (readme-quickstart.ts:109-115), unclosed fence (:62-64), unbacked
   `<port>` (:75-78), unknown placeholder (:81-84), shell quoting (:89-96). Bidirectional drift
   is a test failure — drift test reads the real root README (readme-quickstart-drift_test.ts:8-14).
2. One command, one attempt — PASS. Single awaited run, no retry/fallback/budget
   (readme-command.ts:144-159); gates pass `retry: undefined` (suite:81-91, asserted in test).
   aspire-walk.ts change is export-only (:98); its retry contract untouched. Named per-command
   receipts with stdout/stderr tails (receipts/NN.json), nothing masked.
3. Executable readiness — PASS. `aspire wait postgres --status healthy --timeout 60`
   (README.md:58); flags verified read-only via `aspire wait --help` (real `--status`/`--timeout`
   in seconds; `--apphost` optional). No invented flags; nothing started.
4. Suite shape — PASS. 11 gates built from `README_QUICKSTART_EXPECTED_COMMANDS` in README order
   + `createCleanupGates()` unchanged (suite:65-70); cli-surface/registry additions only.
   `deno task e2e:cli suites` lists `readme.quickstart`; `gates readme.quickstart` lists the 11
   gates + `cleanup.aspire-stop`, exit 0. Cleanup runs in runner `finally`; Docker prune is
   snapshot-diff owned-only.
5. Hosted runner — PASS. One step after `quickstart.walk` with the exact command, byte-identical
   `if:` gating to its neighbour; report in the summary loop, artifacts uploaded (incl. state.json
   + receipts glob). No `continue-on-error`, no retry, no manual recovery.
6. Process lifecycle — PASS. AbortController kills the child on deadline (aspire-walk.ts:103-126);
   wrapper grace backstop; `<port>` capture is read-only `aspire describe`; cleanup gates run even
   on failure paths (suite-runner.ts:97-119).
7. Doctrine/scope — PASS. E2E gate code + README + workflow only; no product-behaviour change.
8. Tests — PASS. Mandated `deno test --allow-all …readme-quickstart_test.ts …tests/presentation/`
   → 56 passed / 0 failed. `deno fmt --check` and `deno lint` on the 10 changed `.ts` files →
   clean (exit 0 each). Prohibited runs (readme.quickstart, quickstart.walk, scaffold suites,
   task test/check, Aspire/Docker) not executed.

Findings (both low, optional hardening, non-blocking):
- Empty block parses to `[]` rather than throwing in the parser; fail-closed is enforced by
  `assertExpectedCommands` before any execution (readme-command.ts:56-57,171-187) and by the
  drift test — no silent path.
- Verbatim curl cannot distinguish HTTP 500 from 200 by exit code; DB readiness is independently
  gated by `aspire wait`, and the receipt body preserves evidence.

Hosted `readme.quickstart` transcript and exact-head CI are canary/supervisor-owned; not cited.

VERDICT: PASS

