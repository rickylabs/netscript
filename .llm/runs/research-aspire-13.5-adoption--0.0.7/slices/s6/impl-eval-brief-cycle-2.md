use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/evaluator/protocol.md`, and
`.llm/harness/evaluator/verdict-definitions.md` first. You are the **independent IMPL-EVAL
evaluator** (Claude · Fable 5 · medium, native opposite-family route for Codex · GPT-5.6 Sol work).
You are a separate session from the generator thread and from the supervisor; you self-certify
nothing and inherit no earlier verdict.

## Context

- Slice: **S6 — listener-readiness health checks** (#1718, PR #1743, draft, base branch
  `fix/aspire-13-5-s5-literal-ports`). Epic #1712. Cycle 1 (`slices/s6/evaluate.md`, head
  `78d0ded28`) returned `FAIL_FIX` (H-1 expression handles vs `.host()/.port()`, H-2
  `HealthCheckResult.data` typing, M-1 stub looseness/no consumer typecheck, M-2 debt bookkeeping,
  L-1 reformat, L-2 missing slice comment). Slice 6 (`564d465c`) is the fix; the branch was then
  rebased onto S5's settled head `aa822069` (D-29). This is **cycle 2**.
- Evaluate **exactly** head `564d465cc6b6af5518f959f3ad53beb422590da1` on
  `feat/aspire-13-5-s6-health-checks`; base = S5 head `aa822069e10fd90f2bae656b91e28c018bafec0b`
  (evaluate only `aa822069..564d465c`). Your worktree:
  `/home/agent/projects/netscript/worktrees/007-aspire-s6-eval` (detached at that head; product
  files read-only). Supervisor run dir (absolute):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  — read `plan.md` D3/D5/D-19/D-29, `slices/s6/brief.md`, `slices/s6/evaluate.md` (cycle 1),
  `slices/s6/review-tier-a.md` (both Tier-A sections), the S6 branch's own run dir
  `.llm/runs/feat-aspire-13-5-s6-health-checks--impl/` (worklog, drift,
  `receipts/06-consumer-
  typecheck-13.5.3.txt`), and the PR #1743 commit list + comments.
- Environment: NAS `ai-agents` container, Deno 2.9.5, Aspire CLI 13.5.3, .NET 10.0.400 via
  `~/.local/bin/mise exec` (the `mise` shell function is broken; use the binary path).
  `DOCKER_HOST=tcp://netscript-dind:2375`. **Known host infra (D-25/D-25a):**
  `hybrid-launcher_test.ts` cancellation-survivor and `codex-follow_test.ts` inotify failures are
  environment artifacts — report them, never `FAIL_FIX` on them. Phase A is **static**: do not run
  `aspire start`, do not start containers, do not run `e2e:cli` runtime suites.

## What to verify (execute the gates yourself)

1. Every cycle-1 finding H-1/H-2/M-1/M-2/L-1/L-2 against the diff — closed, or not.
2. Scoped `deno check` / raw lint / raw fmt on changed files; `quality:scan`; `arch:check`;
   `check:assets-barrel`; `check:publish-assets`; `check:aspire-host-ports`; tests under
   `packages/cli/src/kernel/templates/aspire` and `packages/cli/e2e/tests`. New `deno-lint-ignore` /
   `as unknown as` / `: any` in the diff are blocking.
3. **D-19 consumer typecheck** at this head: the branch receipt was taken pre-rebase. Verify the
   supervisor's carry-over argument
   (`git diff --stat 0bd8ba83..aa822069 -- packages/cli/src/kernel/templates/aspire packages/cli/e2e`
   is empty) yourself. You MAY additionally reproduce it: `netscript init` a throwaway project under
   your eval worktree's `.llm/tmp/`, run `aspire restore` there (SDK/package restore only — **no**
   `aspire start`, no AppHost, no containers), then `tsc --noEmit -p tsconfig.apphost.json`; the two
   pre-existing `TS2307 'zod'` baseline errors are known. If restore is impossible, say so and rely
   on the carry-over argument with your own verification of it.
4. Generated-output review: render `generateRegisterInfrastructure` for Postgres+Redis and confirm
   the emitted callbacks use `endpoint.host()/port()` values and `withHealthCheck` keys
   `<r>_listener` / `<r>_resp`; confirm `listenerData` is `Record<string,string>`.
5. PR hygiene: draft state, base branch, closing keywords, labels/milestone, per-slice comments
   (slice 6 has none — report, do not fix).

## Output

Write `evaluate-cycle-2.md` (from `.llm/harness/templates/evaluate.md`, declare the exact head) to
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s6/evaluate-cycle-2.md`
and post the same verdict as a PR #1743 comment starting with `**[PHASE: IMPL-EVAL]**` and the head
SHA. Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`; `PASS` here means **phase A
only** — say so explicitly; phase B remains lease-gated. Do not commit to the S6 branch, do not mark
the PR ready, do not merge, do not relabel, do not close issues, do not touch Aspire/Docker runtime.
