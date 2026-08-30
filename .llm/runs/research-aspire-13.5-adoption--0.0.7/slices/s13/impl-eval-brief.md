use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/evaluator/protocol.md`,
`.llm/harness/evaluator/verdict-definitions.md`, `.agents/skills/netscript-doctrine/SKILL.md`, and
`.agents/skills/netscript-tools/SKILL.md`. You are the **independent IMPL-EVAL evaluator** (Claude ·
Fable 5 · medium, native opposite-family evaluator of Codex · GPT-5.6 Sol work): a separate session
from the generator thread and the supervisor; you inherit no verdict and self-certify nothing.

## Context

- Slice: **S13 — stale version-bound surface cleanup, D-17 telemetry resolver, parity phase 2**
  (#1724, PR **PR** draft, base `test/aspire-13-5-s10-e2e-gate-upgrades`; epic #1712; canary C).
  Evaluate **exactly** head `__HEAD__` on `chore/aspire-13-5-s13-stale-surface-cleanup`; base = S10′
  `a46ea16d` (evaluate only `a46ea16d..__HEAD__`). Your worktree:
  `/home/agent/projects/netscript/worktrees/007-aspire-s13-eval` (detached at that head; product
  files read-only). Supervisor run dir (absolute):
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  — read `sub-issues/13-stale-surface-cleanup.md` (contract), `slices/s13/brief.md`,
  `slices/s13/review-tier-a.md`, `plan.md` D-13/D-16/D-17, `drift.md` D-39/D-45/D-54/D-55/D-60,
  `aspire-surface-manifest.tsv` + `tools/aspire-surface-manifest.ts`; the S13 branch's own run dir;
  PR commit list + per-slice comments.
- **D-17 is ratified as written (D-60):** `resolveTelemetryEndpoint` precedence explicit option →
  `NETSCRIPT_TELEMETRY_ENDPOINT` → `ASPIRE_DASHBOARD_PORT` → `aspire ps --format Json`
  `dashboardUrl` (`source: 'aspire_ps'`, injectable helper) → `DEFAULT_TELEMETRY_ENDPOINT`
  `http://localhost:18888` (`source: 'default'`); recorded `source` preserved; no bare `18888` in
  generated code.
- Environment (D-39): Deno 2.9.5; Aspire CLI 13.5.3 / dotnet 10.0.400 via
  `/home/agent/.local/bin/mise exec --`; Docker 28.5.2 on `tcp://netscript-dind:2375`. **Static
  only: no `aspire start`, no containers, no `e2e:cli` runtime**; you may run
  `aspire ps --format Json --nologo --non-interactive` (read-only) for the empty-list shape;
  `aspire ps` must stay `[]`. Host AppHost gates are environment-blocked (D-42/D-43/D-55) — not a
  slice defect.

## What to verify (execute yourself)

1. Resolver: implement-vs-contract order and `source` values (unit tests, including the `aspire_ps`
   step with S2's `02-v5-aspire-ps-final.json` shape and the empty `[]` shape); no IO in domain code
   (A7/A11 — `aspire ps` read behind an injectable port); README precedence line matches the code.
2. Templates: telemetry example route template has no bare `18888` and follows env → running AppHost
   → "dashboard unavailable — run `aspire ps`"; Windows env-file adapters emit
   `ASPIRE_DASHBOARD_PORT` only when configured; consumer CI template installs
   `Aspire.Cli --version {{ASPIRE_SDK}}` before `aspire restore`; render a fresh scaffold under your
   eval worktree's `.llm/tmp/` and confirm (delete the scratch).
3. Cleanup rows owned by S13 in the manifest (skill toolchain snapshot via `agentic:sync-claude`,
   `render-ts-apphost.ts:81`, `scaffold-aspire.ts` `SCAFFOLD_COMMUNITY_TOOLKIT`, `ownership.ts`
   `MCP_COMMAND` if not already S7's), regenerated barrels, and `tools/aspire-surface-manifest.ts`
   re-run producing no diff.
4. Parity `--phase 2`: implemented with tests for both phases; **phase 1 still the default and
   `ci.yml` unchanged** unless S1 (#1727), S9 (#1759) and S11 (#1771) are on `main` — verify the
   gating statement in the run dir/PR body is true at evaluation time; run the phase-2 sweep in
   report mode and list any remaining non-archival hit with its owner.
5. Doctrine/gates: `quality:scan`, `arch:check`, scoped `deno check` / raw lint / raw fmt on changed
   files, tests for `packages/mcp`, touched `packages/cli` roots, `.llm/tools/validation`;
   `check:assets-barrel`, `check:publish-assets`, `agentic:sync-claude:check`,
   `check:emitted-samples`; no new `any`/casts/lint-ignores; archival rows untouched; no `docs/site`
   prose, no skill behaviour text, no pins.
6. PR hygiene: draft, base branch, `Closes #1724`, `Part of #1712`, labels `type:chore`,
   `epic:aspire-13-5`, `area:cli`, `area:agentic`, `area:tooling`, `priority:p2`, `status:impl`,
   milestone 0.0.7, per-slice comments; #1724 `status:impl`. Report, do not fix.

## Output

Write `evaluate.md` (from `.llm/harness/templates/evaluate.md`, declare the exact head) to
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s13/evaluate.md`
and post the same verdict as a PR **PR** comment starting with `**[PHASE: IMPL-EVAL]**` and the head
SHA. Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`; `PASS` = phase A complete (S13
has no Phase B) — say whether the parity flip is applied or deferred. Do not commit to the S13
branch, do not mark ready, do not merge, do not relabel, no runtime.
