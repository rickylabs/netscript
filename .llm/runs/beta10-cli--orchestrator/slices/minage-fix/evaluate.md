# IMPL-EVAL — PR #813 (prod E2E `--minimum-dependency-age=0`)

- **Verdict: PASS**
- Evaluator: Claude · Opus 4.8 · high (supervisor-dispatched, opposite-family to the Codex Sol·low generator)
- Subject: worktree `/home/codex/repos/b10-minage`, branch `fix/e2e-prod-min-dep-age` @ `b7e4f8b8`, base `main` (@ `8a8a9537`)
- Skills: netscript-harness, netscript-cli, netscript-tools, rtk
- Protocol: `evaluator/protocol.md` (IMPL-EVAL), `verdict-definitions.md`

## Rationale

The approved plan (single locked slice S1: add the age override to the one direct published
`deno x` invocation that bypasses the shared command helpers, strengthen its unit test, scope the
README, defer shipped-CLI call sites) is complete and correctly bounded. Every required gate passes
under independent verification, scope is disciplined to the test harness, and no doctrine violation
or suppression is introduced. This meets every `PASS` condition in `verdict-definitions.md`.

## Probe results

| # | Probe | Result | Evidence |
|---|-------|--------|----------|
| 1 | Sweep completeness | PASS | See below — no missed published invocation |
| 2 | Scope discipline | PASS | 3 files, all under `packages/cli/e2e/**`; zero runtime/plugins/services/src source |
| 3 | Command-builder tests | PASS | 7/7 pass; AI-lifecycle test now asserts full array incl flag → fails-closed if dropped |
| 4 | Follow-up: user-facing window | PASS (non-blocking probe) | Section present, 3 shipped call sites named and verified accurate |
| 5 | No new suppressions / quality | PASS | No `deno-lint-ignore`/`ts-ignore`/`ts-expect-error` added; changed source type-checks clean |

### 1 — Sweep completeness (blocking probe → clear)

Published `jsr:@netscript/*` deno invocations in the suite are built by exactly three routes; all
now carry the flag in published mode:

- `cli()` helper (`gate-factory.ts:14-26`) — injects `--minimum-dependency-age=0` when
  `cliEntrypoint` starts with `jsr:@netscript/cli@`. Covers the main-CLI path (plugin install in
  JSR mode, db gates, etc.).
- `denoCommand()` helper (`gate-factory.ts:34-42`) — injects the flag when
  `packageSource === PACKAGE_SOURCE.JSR`. Covers raw `deno check`/`eval` subcommands
  (`runtime-gates.ts:241`, `database-gates.ts:164/171/179/196/205`).
- Inline command arrays that bypass both helpers:
  - `plugin-install-gates.ts:117-126` — the AI-lifecycle `deno x jsr:@netscript/plugin-ai@…/cli` —
    **this was the sole straggler; the fix (`:120`) closes it.**
  - `prepare-flow-b-fixture.ts:136-141` (`deno run … jsr:@netscript/plugin-workers@…/cli`) and
    `:314-321` (`deno cache … services`) — already carried the flag before this PR.

All other inline `'deno'` arrays (`runtime-gates.ts`, `otel-gates.ts`, `database-gates.ts`) are
`deno eval <inline-script>` or `deno run <local e2e harness helper .ts>` — none targets a
`jsr:@netscript/*` specifier as its resolution target, so none is subject to the release-day guard.
No published-mode `deno x/run/add/install` targeting `jsr:@netscript/*` remains without the flag.
The `drift.md` claim ("existing shared builders already cover all published-JSR execution paths
except the direct AI lifecycle command") is confirmed accurate.

Flag placement (`… x -A --minimum-dependency-age=0 <specifier> …`) matches the established
convention proven green by the already-flagged suite invocations.

### 2 — Scope discipline

`git diff --stat 8a8a9537..HEAD -- packages/ plugins/ services/ src/` → only
`packages/cli/e2e/README.md`, `packages/cli/e2e/src/application/gates/scaffold/plugin-install-gates.ts`
(+1 line), and `packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts`. These live under
the CLI **E2E test harness**; no shipped runtime, plugin, service, or `packages/cli/src` product
source is touched. Remaining diff is run artifacts under `.llm/runs/`.

### 3 — Command-builder tests (run independently)

`deno test packages/cli/e2e/tests/application/gates/{scaffold-gates_test.ts,configure-published-workers-block_test.ts}`
→ **7 passed / 0 failed** (type-checks the transitive graph incl. the changed
`plugin-install-gates.ts`). The `published AI lifecycle gate…` test was upgraded from a single
positional check (`command[3] === specifier`) to a **full-array `assertEquals`** whose expected
array contains `'--minimum-dependency-age=0'` at index 3. Dropping the flag from the builder would
shift/omit that element, breaking array equality → the test fails closed. Assertion strength is
adequate to guard the fix.

### 4 — Follow-up section (non-blocking probe → satisfied)

PR #813 body carries a **"Follow-up: user-facing window"** section that precisely names the shipped
CLI's own published-JSR shell-outs subject to the same 24h wall, each verified against source:

- `…/plugins/dispatch/dispatch-plugin-verb.ts` → `processRunner.exec('deno', ['x','-A', resolvePluginCliSpecifier(pkg), verb, …])` — no override ✓
- `…/plugins/ai/ai-plugin-command.ts` → `exec('deno', ['x','-A', AI_CLI_SPECIFIER, …])` — no override ✓
- `…/agent/init/init-agent.ts` → writes MCP config `args: ['run','-A', netscriptJsrSpecifier('cli'),'agent','mcp',…]` — no override ✓

Descriptions are accurate; the cited line numbers are approximate (±1–3 lines from the exact
`exec`/`args` call) but unambiguous. This correctly seeds a beta.11 product-policy issue and is
properly deferred (not architecture debt). No finding.

### 5 — Suppressions / changed-file quality

No `deno-lint-ignore`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, or `eslint-disable` added
(grep over the diff → NONE). Changed source type-checks clean via the test run above. README edit is
a narrow behavioral clarification correctly scoping the override to release E2E (does not advise
users to disable the guard universally).

## Process notes (non-blocking)

- **Generator-self-arranged eval artifacts are present and are disregarded as authorizing.** The run
  dir contains a generator-authored `evaluate.md`, and the PR body records both an "Opposite-family
  slice review (Claude Opus 4.8) — PASS" and a "Separate open-model IMPL-EVAL (Qwen 3.7) — PASS,
  `b7e4f8b8`" (commit `b7e4f8b8 chore(harness): evaluate prod E2E minimum-age fix`). Per harness
  doctrine, a generator-self-dispatched evaluation is **not** an authorizing verdict — **this
  supervisor-dispatched Opus 4.8 pass is the official IMPL-EVAL.** Recommend the generator stop
  recording its own IMPL-EVAL as an authorizing PASS in the PR body to avoid double-counting.
- PR #813 is a draft against `main` with no resolving issue; absence of a closing keyword is
  correct (no `Closes #N` on a harness-only fix without a filed issue). Labels (`type:fix`,
  `area:cli`, `priority:p0`, `status:impl-eval`, `gate:ci`) and the Definition-of-Done checklist are
  present. Close-gate rule is `n/a` (no issue being auto-closed). Release-gate class is `n/a` for
  this non-cut slice; full prod E2E execution is deferred to CI per plan.

## Recommendation

`status:impl-eval` → advance to `status:ready-merge` on owner review. The fix is correct, complete,
minimally scoped, and independently verified. The user-facing 24h-window follow-up should be filed
as a beta.11 issue before or at merge so the three named shipped call sites are not lost.
