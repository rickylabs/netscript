use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/evaluator/protocol.md`,
`.llm/harness/evaluator/verdict-definitions.md`, `.agents/skills/netscript-cli/SKILL.md`, and
`.agents/skills/netscript-tools/SKILL.md`. You are the **independent IMPL-EVAL evaluator** (Claude ·
Fable 5 · medium, native opposite-family evaluator of Codex · GPT-5.6 Sol work): a separate session
from the generator thread and the supervisor; you inherit no verdict and self-certify nothing.

## Context

- Slice: **S10 — E2E gate upgrades: doctor receipt, `describe --follow` evidence, `stop --force`
  cleanup, resource-command gate class** (#1722, PR #1760 draft, base
  `feat/aspire-13-5-s8-typed-resource-commands`; partial for #1372 — reference only). Epic #1712.
  Evaluate **exactly** head `14daa764` on `test/aspire-13-5-s10-e2e-gate-upgrades`; base = S8
  `9dd06647` (evaluate only `9dd06647..14daa764`). Your worktree:
  `/home/agent/projects/netscript/worktrees/007-aspire-s10-eval` (detached at that head; product
  files read-only). Supervisor run dir (absolute):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  — read `sub-issues/10-e2e-gate-upgrades.md` (the contract), `slices/s10/brief.md`,
  `slices/s10/review-tier-a.md`, `plan.md`, `drift.md` D-39/D-42/D-43/D-50; the S10 branch's own run
  dir `.llm/runs/test-aspire-13-5-s10-e2e-gate-upgrades--impl/` (worklog, drift, receipts, `#1372`
  update draft); S7's teardown contract on
  `origin/fix/aspire-13-5-s7-teardown-leak-check:.llm/tools/agentic/teardown/probes.ts`; PR #1760
  commit list + per-slice comments.
- Environment (D-39): Deno 2.9.5; Aspire CLI 13.5.3, dotnet 10.0.400, node 24.20.0 via
  `/home/agent/.local/bin/mise exec --`; Docker 28.5.2 on `tcp://netscript-dind:2375`; inotify 1024;
  tini. **Static only: no `aspire start`, no containers, no `e2e:cli` runtime suites** (host AppHost
  gates are environment-blocked, D-42/D-43 — not a slice defect). Allowed non-runtime reads:
  `aspire doctor --format Json --non-interactive --nologo`, `aspire describe --help`,
  `aspire stop --help`, `aspire resource --help`; `aspire ps` `[]` before/after.

## What to verify (execute yourself)

1. `preflight.aspire`: runs `aspire doctor --format Json --non-interactive --nologo`, persists the
   JSON through the gate receipt path, fails on any `status: fail`, warns (not fails) on `warning`;
   reproduce with this host's doctor JSON.
2. Readiness: `aspire describe --follow --format Json` NDJSON captured into
   `.netscript/e2e/aspire-describe.ndjson` bounded by the S8 timeout budget; wait gates assert
   convergence from the stream (last-seen state per resource, object-valued `healthReports` per S6)
   rather than polling; fixture-driven tests cover convergence, non-convergence/timeout, and
   malformed lines.
3. Cleanup: `CLEANUP_ASPIRE_STOP` = `aspire stop --apphost <exact path>` then
   `aspire stop --force --apphost <exact>` **only** with `--cleanup`; post-stop probe over the S7
   contract (`com.microsoft.developer.usvc-dev.mountsLabel`, `ASPIRE_DCP_APPHOST_PATH`, `--apphost`
   argv) asserts zero containers for that AppHost path; receipt records the probe output; never
   `aspire stop --all`.
4. Gate class `resource-command` in `cli-surface.ts`: invokes S8's typed
   `aspire resource <db>-cli <cmd> --<arg>` and background-child `aspire resource <bg> restart`,
   asserts state via `describe`; registered in `scaffold.runtime` on both tiers after the S8/S9
   runtime gates and before cleanup; explicit skip receipt when the runtime phase does not run; no
   new suites.
5. Doctrine/gates: no product change outside `packages/cli/e2e` (+ README/skill gate table, run
   dir); `quality:scan`, `arch:check`, `check:assets-barrel`, `check:publish-assets`,
   `check:emitted-samples`, `check:aspire-host-ports`; scoped `deno check` / raw lint / raw fmt on
   changed files; `packages/cli/e2e/tests` green; no new `any`/casts/lint-ignores; the `#1372`
   update draft exists and is truthful about what S10 covers vs. what remains (compensation,
   streams).
6. PR hygiene: draft, base branch, `Closes #1722`, `Part of #1712`, `Refs #1372` (no closing
   keyword), labels `type:test`, `epic:aspire-13-5`, `area:tooling`, `area:cli`, `gate:e2e`,
   `priority:p1`, `status:impl`, milestone 0.0.7, per-slice comments; #1722 `status:impl`. Report,
   do not fix.

## Output

Write `evaluate.md` (from `.llm/harness/templates/evaluate.md`, declare the exact head) to
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s10/evaluate.md`
and post the same verdict as a PR #1760 comment starting with `**[PHASE: IMPL-EVAL]**` and the head
SHA. Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`; `PASS` = **phase A only** — say
so; Phase B (`scaffold.runtime --cleanup` green on both tiers with the new receipts, leak = 0)
remains lease-backed and environment-blocked. Do not commit to the S10 branch, do not mark ready, do
not merge, do not relabel, no runtime.
