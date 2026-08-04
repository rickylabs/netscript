use harness

## SKILL
Opposite-family `docs_audit` lane (gate set: .llm/harness/workflow/doc-audit.md) over a Claude-supervised docs changeset. Evidence-only verdicts: run the commands, read the source; never trust generator claims. Do not edit pages; findings file is the deliverable.

## Task — audit the main-pages revamp (PR #1216)
Worktree: /home/codex/repos/ns-mainpages, branch docs/main-pages-revamp, changeset 55aa37f81..HEAD (seven commits, four files: docs/site/{index,why,quickstart,concepts}.vto).

Gates:
1. **API/behavior accuracy**: the homepage saga snippet — extract it and `deno check` it against packages/plugin-sagas-core; verify the caption's behavioral claims (correlation via orderId, what requires bus-bridge/compensator/durable-store wiring) against saga-engine.ts / saga-bus-bridge.ts / saga-compensator.ts. Verify every CLI flag and command in quickstart.vto against packages/cli source (init-command.ts, init-interactive.ts) — including that `--yes` + defaults produce the `dashboard` app path and cache the success check names, and the exact `aspire stop --apphost ./apphost.mts` form. Verify every claim-bearing cell of why.vto's comparison table is supportable from this repo.
2. **Funnel/duplication**: no core fact told on two of the four pages; each page holds its single role; no links to /capabilities/; no :18888; no volatile counts; no unearned adjectives.
3. **Build gates**: run `cd docs/site && deno task build` and repo-root `deno task docs:links` yourself.
4. **Prose quality**: flag machine-flavored or filler wording with exact locations.

Write /home/codex/repos/ns-docs-orch/.llm/runs/docs-mainpages--orchestrator/slices/mainpages-s6/audit.md: per-gate PASS/FAIL with the commands run and their output, findings list, final verdict PASS / FAIL_FIX. Do not commit or push.
