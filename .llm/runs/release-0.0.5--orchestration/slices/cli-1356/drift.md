# Drift Log: #1356 UI app-root resolution

## 2026-08-09 — Tier-D runtime identity is not registered

- **What:** The active thread id exists in `CODEX_THREAD_ID`, but the agentic runtime controller
  cannot match it to this worktree/session.
- **Source:** `deno task agentic:runtime status --agent codex --worktree
  /home/codex/repos/ns005-w3b1 --session 019fe4b4-7c12-72c2-b692-8d851f9c3b5c --json`.
- **Expected:** Daemon-managed Tier-D identity with worktree, session, and steering command.
- **Actual:** `status=blocked`, diagnostic `missing_identity`, raw exit 3; foundation components are
  ready but desired/observed worktree and session lists are empty.
- **Severity:** significant
- **Action:** accept owner-authorized continuation of this already-active sole-writer product
  thread; make no daemon/mobile-visibility claim and do not create a replacement thread.
- **Evidence:** `supervisor.md`; raw status output in the implementation session.

## 2026-08-09 — Live issue has nine acceptance rows

- **What:** The dispatch shorthand names four behavioral rows, while the live issue body has nine
  close-gated acceptance boxes.
- **Source:** `gh issue view 1356 --repo rickylabs/netscript`.
- **Expected:** Four behavioral rows from the dispatch.
- **Actual:** Five additional rows cover public input, docs truth, two negative controls, and the
  serialized runtime proof.
- **Severity:** minor
- **Action:** implement/evidence every non-runtime live row; leave the runtime proof to owner CI
  because no token is granted.
- **Evidence:** `research.md` F8 and the validation plan.

## 2026-08-09 — Package-scoped CLI doctrine diagnostic remains globally red

- **What:** An extra package-scoped diagnostic was run beyond the dispatch's required aggregate
  `arch:check`.
- **Source:** `.llm/tools/fitness/check-doctrine.ts --root packages/cli`.
- **Expected:** The required aggregate is the named doctrine gate for this slice.
- **Actual:** Required `arch:check` exits 0. The extra CLI scan exits 1 with
  `FAIL=50 WARN=51 INFO=1`, matching the package's already-recorded Restructure verdict and
  surfacing no #1356-specific new class; its matcher also reports longstanding `Deno.test` files as
  Jest/Vitest globals.
- **Severity:** minor / pre-existing debt
- **Action:** record it as non-decisive diagnostic evidence; do not widen this release blocker into
  the global CLI restructure.
- **Evidence:** `worklog.md` gate table; no new ignore or allowance added.

## 2026-08-09 — Cliffy help assertion depended on terminal color capability

- **What:** CI colorized `Command.getHelp()`, splitting the literal `--app <name>` with ANSI escape
  bytes; the local non-color environment had allowed a terminal-dependent assertion to pass.
- **Source:** PR #1422 `check-test` at `3f7d954bd`.
- **Expected:** Help behavior is checked independently of terminal capability while retaining the
  option name and value placeholder contract.
- **Actual:** Product help was correct; only the test's raw substring assumption was wrong.
- **Severity:** blocking test defect
- **Action:** normalize each of the five help strings with `@std/fmt/colors.stripAnsiCode`, then
  keep the exact `--app <name>` assertion. A colorized TTY run passes; removing one command's option
  in a detached scratch copy fails raw exit 1.
- **Evidence:** `worklog.md` ANSI-independent and mutation-control rows.
