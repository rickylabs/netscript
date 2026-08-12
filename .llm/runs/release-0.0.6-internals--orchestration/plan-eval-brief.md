use harness

# PLAN-EVAL — the 0.0.6 internals quality rail (#1403 → #1380 → #1378, with #1530 inserted)

You are a **formal PLAN-EVAL evaluator** in a fresh session. You did not write this plan and you must
not implement any of it. Your output is a verdict plus findings.

The plan under evaluation is **Claude-authored**, so you are the opposite family per
`.llm/harness/workflow/lane-policy.md` (`formal_plan_evaluation`: Codex · GPT-5.6 Sol · high for Claude
plans). The generator session is a Claude Opus 5 high orchestrator; it is not reviewing itself, and it
does not get to overrule you on evidence.

## SKILL

- `netscript-harness` — evaluator separation, run artifacts, verdict vocabulary.
- `netscript-doctrine` — architecture/gate fitness; #1380 rewrites the doctrine's own verdict table.
- `netscript-tools` — which commands are verdict sources and which are non-verdicts.
- `netscript-deno-toolchain` — `deno doc --json`, task semantics, deterministic tests.
- `rtk` — prefix read-heavy `git`/`gh`/`grep`.

## Identity

| Field | Value |
| --- | --- |
| Worktree | `/home/codex/repos/ns006-raileval` (detached at `9c3cdfead`) |
| Role | PLAN-EVAL only — read, execute, verify, judge. **Write nothing outside your verdict file.** |
| Verdict file | `.llm/runs/release-0.0.6-internals--orchestration/plan-eval.md` in that worktree |
| Protocol | `.llm/harness/evaluator/plan-protocol.md` + `.llm/harness/gates/plan-gate.md` |
| Verdict vocabulary | `PASS` or `FAIL_PLAN` (`.llm/harness/evaluator/verdict-definitions.md`) |

Do not commit, do not push, do not open or comment on a PR, do not touch any other worktree, and do
not launch other agents.

## What to read

1. `.llm/runs/release-0.0.6-internals--orchestration/plan-quality-rail.md` — **the plan under
   evaluation**.
2. `plan.md` (the lane's wave plan — sequencing locks S-1…S-6 live there and the rail plan depends on
   them), `supervisor.md`, `drift.md`, `cut-trace.md` in the same dir, for context and recorded
   decisions.
3. The four **live** issue bodies: `#1403`, `#1380`, `#1378`, `#1530`. Read them from GitHub, not from
   the plan's paraphrase. The plan asserts that issue-body measurements have already gone stale; part
   of your job is checking whether the plan's own numbers are right **now**.
4. The code the plan proposes to change: `.llm/tools/quality/scan-code-quality.ts`,
   `.llm/tools/fitness/check-doctrine.ts`, `deno.json` (tasks `quality:*`, `arch:check`,
   `arch:check:repo`), `docs/architecture/doctrine/10-codebase-verdict-and-handoff.md`,
   `docs/architecture/doctrine/06-archetypes.md`, `.llm/harness/debt/arch-debt.md`, `rfcs/README.md`,
   `.github/workflows/code-quality.yml`.

## What this plan claims, and what you should attack

The plan's whole value proposition is that it re-measured everything instead of trusting the issues.
**Verify that by re-measuring independently.** If any number below is wrong, that is a finding, and a
wrong baseline is a `FAIL_PLAN` because three PRs are sequenced off it.

| Claim | Verify with |
| --- | --- |
| `quality:scan` exit 0, `allowCount: 7` | `deno task quality:scan` |
| `quality:scan:repo` exit **1**, 5 findings, `allowCount: 10` | `deno task quality:scan:repo` |
| `arch:check` exit 0 | `deno task arch:check` |
| `arch:check:repo` exit 1, **FAIL=55** (not the 53 #1380 records) | `deno task arch:check:repo` |
| 36 live units (30 `packages/*` + 6 `plugins/*`) | `ls -d packages/*/ plugins/*/` |
| 6 verdict rows name non-live units; 14 live units have no row | read the table at `10-…md:22-51` against the live dirs |
| 6 `*-soundness_test.ts`; 12 `*_type.ts`, all under `tests/type-fixtures/`, 3 with `@ts-expect-error` | `find` + `grep` |
| `packages/{streams,triggers,workers,sagas}` and `plugins/hello-world` **never existed**; only `@netscript/shared` ever did | `git log --all --oneline --diff-filter=A -- 'packages/<p>/deno.json'` |

The last row is the plan's most consequential claim: it asserts #1380's "plausibly renamed into the
`plugin-*-core` tier" hypothesis is **false for five of six rows**, and that recording a rename would
fabricate provenance. If you can show any of those directories did exist, or that a rename is
documented somewhere the plan did not look, say so — the plan then schedules the wrong deliverable.

## Judge these decisions specifically

Nine decisions are locked as R-1…R-9. Attack the ones where a wrong choice is expensive:

- **R-1** (PR-E/#1530 before PR-D/#1378). Is #1378's `gate:` box genuinely unsatisfiable until
  `quality:scan:repo` is green? Or could PR-D satisfy it by fixing the type-fixture scope itself,
  making PR-E redundant work and one extra merge?
- **R-3** (export-awareness via `deno doc --json`, not a fourth regex). Is this actually feasible and
  fast enough to run in the PR gate, which today scans only changed files? **Measure it** — run
  `deno doc --json` against a couple of package `exports` maps and time it. A plan that mandates an
  approach nobody timed is a plan with a hidden timeout in it. If it is too slow, the plan's own
  fallback (entrypoints + re-export graph) needs to be the primary, and that is a finding.
- **R-4 + R-6** (move `arch:check`'s 16-root shell string into data in PR-B, then switch the source to
  the workspace member list in PR-C). Is the two-step justified, or is it churn that touches the same
  task twice? Note S-4 forbids deleting PR-B's coverage assertion in PR-C — check that the two-step
  does not make S-4 impossible to honour.
- **R-5** (A14 must resolve identifier origin). Is "where did `describe` come from" implementable
  without a type checker, given `check-doctrine.ts` is a line scanner? If it needs real import
  resolution, does the plan acknowledge that cost anywhere?
- **R-9** (record the RFC location the repo already uses rather than adopt a promotion pipeline). Check
  the live state: how many numbered RFCs exist under `rfcs/` now, and where were RFCs 0001–0005
  actually accepted? The plan asserts the de-facto path is the harness path. Recent `main` commits
  mention "RFC 0001".."RFC 0005" being accepted — reconcile that with `ls rfcs/`. If numbered RFCs now
  exist in `rfcs/`, R-9's premise is stale and the finding matters, because #1380 has an acceptance box
  on it.

## Also judge

- **Coverage of acceptance.** #1403 has 5 boxes, #1380 has 12, #1378 has 9, #1530 has 7. Does the plan
  route **every** box to a specific PR with a stated proof? Name any box that no PR owns. An
  unrouted box is how a milestone reaches merge with an unticked gate.
- **Negative cases.** Each PR's "must prove" column claims a negative case. Is each one actually a
  negative case (a thing that fails before and after the change in the right direction), or is any of
  them a tautology that cannot fail? This repo has shipped guards whose predicate could never fire —
  see `.llm/harness/workflow/milestone-run.md` § Gate integrity — and the plan's stated purpose is to
  stop exactly that, so a non-firing proof here would be self-refuting.
- **The unresolved open decision.** The plan flags a collision with **#1374** (docs lane, live at
  `/home/codex/repos/ns006-1374-compilegate`): both #1374 and #1378 need fenced-TS extraction from
  `docs/site/**`. The plan marks it "must resolve before PR-D" but does not resolve it. Is deferring it
  acceptable, or does it need resolving before PR-B lands? Read what #1374's worktree is actually
  building before answering, but **do not modify anything there**.
- **Missing scope.** Anything the four issues require that no PR covers, and anything the plan pulls in
  that the issues' Boundaries sections forbid (#1378 and #1380 both carry explicit do-not lists).

## Output contract

Write `.llm/runs/release-0.0.6-internals--orchestration/plan-eval.md` with:

1. **Verdict** — `PASS` or `FAIL_PLAN`, on its own line, at the top.
2. **Identity** — your provider/model/effort, the worktree, and the baseline sha you evaluated at.
3. **Re-measured baseline** — your own numbers next to the plan's, with the commands you ran. Mark each
   `confirmed` or `diverges`.
4. **Findings** — numbered, each with severity (`blocking` / `should-fix` / `advisory`), the exact file
   and line or command output it rests on, and the concrete change you want. No finding without
   evidence.
5. **Decision review** — a verdict per R-1…R-9: `sound`, `sound with caveat`, or `wrong`, with reasons.
6. **Acceptance-box routing table** — all 33 boxes across the four issues, each mapped to a PR or
   flagged unrouted.
7. **What you executed** — every command you ran with its exit code, so the orchestrator can tell your
   verdict from a reading of the plan.

Rules for your verdict:

- `FAIL_PLAN` if a baseline number is wrong, an acceptance box is unrouted, a locked decision is
  unimplementable as written, or a claimed negative case cannot fail.
- `PASS` with `should-fix`/`advisory` findings is a legitimate and expected outcome. Do not manufacture
  a blocking finding to look thorough, and do not withhold one to be agreeable.
- **Do not praise the plan.** Adjectives are not findings. Give checkable statements and executed
  evidence only; a verdict whose support is "this is comprehensive and well-structured" is worthless to
  the orchestrator and will be discarded.
- If you cannot verify something, say `unverified` and why — never infer a pass from silence.
