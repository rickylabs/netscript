# IMPL-EVAL: cold README published-release proof (#1881 correction)

## Evaluated state

- Head: `832e53720baf7a8d11e132d93582c48879a4628e` ("fix(release): prove README quickstart before
  warming the runner"), isolated worktree `007-eval-readme-cold`, against parent
  `0247471c89e381dd16e680bf0c10b6559caf36ee`. Worktree clean; changed files are exactly the four
  in scope (2 product paths + this run's `plan.md`/`worklog.md`).
- Evaluator (separate session from generator, per plan's recorded route): Claude Code +
  OpenRouter, model `z-ai/glm-5.3-flash` (max IMPL-EVAL preset), interactive evaluator session in
  this worktree, 2026-09-03. Local read-only evaluation; no GitHub writes, no commits, no runtime.
- Inputs read: `.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`, run `plan.md`,
  `worklog.md`, full diff, post-patch workflow, test suite. No historic run dirs reviewed.

## Verification commands and results (all run by this evaluator in this worktree)

| # | Command | Result |
| - | ------- | ------ |
| 1 | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all .llm/tools/release/release-canary-workflow_test.ts` | exit 0 — **8 passed / 0 failed** (matches worklog's claimed 8/0) |
| 2 | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file .llm/tools/release/release-canary-workflow_test.ts` | exit 0 — 1 file / 1 batch / **0 diagnostics** (matches worklog) |
| 3 | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .llm/tools/release/release-canary-workflow_test.ts` | exit 0 — 1 file, 0 findings |
| 4 | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .llm/tools/release/release-canary-workflow_test.ts` | exit 2 — fail-closed `all-excluded` refusal: `.llm/tools/**` is outside the repo lint surface (`deno task lint` covers `packages/`+`plugins/` only). Lint = **N/A by surface policy**, not a pass claimed |
| 5 | `deno eval --no-config --no-lock 'import { parse } from "jsr:@std/yaml@1"; …'` over `.github/workflows/e2e-cli-prod.yml` | YAML parses; **17 steps in exact order**: …Install Aspire CLI → preflight → version resolve → propagation wait → `Install workspace dependencies` → **`Verify cold README baseline`** → **`Root README Quickstart E2E`** → Install published CLI → Public init smoke → scaffold.runtime → quickstart.walk → report → upload |
| 6 | Independent RED reproduction: new test body (verbatim, assert shim) run against `git show 0247471c8:.github/workflows/e2e-cli-prod.yml` in `.llm/tmp/eval-red-check/` | **FAIL** with exactly `AssertionError: README must not inherit an Aspire cache (actual true !== expected false)` — the worklog's recorded RED, independently reproduced |
| 7 | Same probe against current head workflow | **PASS** (1/0) |
| 8 | `git ls-remote origin` (filtered) + `grep -c actions/cache` | 0 remote branches for this head (GitHub scope blocks push, as stated); **0** `actions/cache` occurrences remain in the workflow |

Scratch for items 6–7 is `.llm/tmp/eval-red-check/` only. No run-dir artifact was modified or
removed; no source file changed.

## Eval-question findings

**Cold ordering is real — verified.** YAML step order (item 5) shows the README suite is the first
`deno task e2e:cli run` and precedes both `Install published CLI from JSR` (global install) and all
other scaffolds. The only steps before it are tool/maintainer installs (Deno, .NET, Aspire CLI
13.5.x tool + preflight), version resolution, propagation wait, and workspace `deno install` — all
explicitly permitted by the accepted scope ("prerequisite CLI/tool and maintainer dependencies
still install"). The `actions/cache` Aspire NuGet restore is removed outright (0 occurrences).
Structural test asserts the ordering, not just prose.

**Baseline failures cannot be swallowed — verified.** `set -euo pipefail` first line; each count is
a `$(...)` assignment (failure aborts before JSON construction, per plan); `jq -e 'all(.[]; . == 0)'`
fails on any nonzero count; `test ! -e .llm/tmp/cli-e2e/my-app` fails if a generated project
pre-exists. The baseline JSON is written **before** the zero-check, so evidence uploads under the
existing `if: always()` upload step; `if-no-files-found: ignore` covers a count-command failure.
The step deletes nothing.

**Mandatory published-runtime gates retained — verified.** Job-level `if` unchanged;
`Download published version` still `workflow_run`-gated; `Quickstart walk` keeps
`always() && steps.install_published_cli.outcome == 'success' && steps.install_workspace_dependencies.outcome == 'success'`
and **both referenced step ids still exist** (moved, not renamed). The old README step's
`if: always() && …` was removed in favor of unconditional sequential placement — strictly more
fail-closed (an earlier failure now skips README instead of running it anyway). scaffold.runtime
and quickstart.walk still run after README with identical flags.

**No duplicate/retry/undocumented command in the README walk — verified.** The README suite step
body is byte-identical to the parent's (same command, `--source jsr`, exact published `--cli`,
`--cleanup`, report/log paths). The only new commands are the read-only baseline inventory
(`aspire ps --format Json`, `docker ps/image ls/volume ls/network ls`, `jq`, `test`,
`mkdir -p .llm/tmp`) — no application/runtime, scaffold, cleanup, retry (`|| true`), or duplicate
step. `aspire ps --format Json` matches the repo's existing probe contract
(`.llm/tools/agentic/teardown/probes.ts:277-281`: exit 0 + JSON array, throw on nonzero).

## Findings (severity-ranked)

1. **Low — process:** `worklog.md` has no explicitly labeled Design checkpoint (protocol rule 3).
   The design content is fully present in `plan.md` (baseline → README → install order,
   fail-closed semantics) and implemented faithfully, and the plan records the PLAN-EVAL: N/A
   rationale for this bounded correction. Non-blocking; note for the coordinator's close-out.
2. **Low — pending evidence, by design:** the plan's GREEN list includes CI and the
   exact-published-version runtime; the worklog honestly records those as "recorded next" and this
   evaluator ran none of them (forbidden here). CI and the real runtime canary remain
   **primary-owned gates, not run** — no claim of a cold verdict is made by this evaluation. The
   PR correctly Refs #1881 without a closing keyword; close-gate evidence lands only after the
   real cold run, 12 README commands, and owned cleanup.
3. **Observation — CI-owned runtime risk, fails closed, not silent:** the zero-baseline's
   empirical behavior on a hosted runner is unverified locally: (a) `aspire ps` must exit 0 with
   `[]` on an idle machine (consistent with the repo probe contract above); (b) `docker image ls
   -q` must be empty on a fresh ubuntu-latest runner (hosted images have historically carried
   pre-pulled images — unverified); (c) `wc -l` pads counts and feeds `jq --argjson`, which
   accepts leading whitespace but has no in-repo precedent. All three fail **loudly** (red gate,
   nothing deleted) — worst case is a false red surfaced by CI, never a false cold-pass.

No blocking finding. No doctrine violation introduced; no framework source touched (no
quality:gate obligation for `.github/`+`.llm/tools` release tooling).

## Verdict

**PASS_IMPL** (protocol PASS): accepted scope complete; required static gates pass or are N/A per
surface policy; runtime/consumer gates correctly remain primary-owned and pending; run artifacts
sufficient for resume.

Follow-ups for the primary owner (none block this verdict): record lint-N/A rationale + CI/runtime
results in the worklog when CI runs; keep the `Ref #1881` non-closing reference until the real
cold proof lands.
