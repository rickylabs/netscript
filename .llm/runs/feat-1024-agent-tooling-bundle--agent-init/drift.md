# Drift Log: agent init tooling and docs bundles

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-03 — baseline advanced to consume the concurrent docs router

- **What:** The user-provided base `ab0fa13fe` was superseded during research by merged PR #1079.
- **Source:** GitHub PR #1079; `git fetch origin main`; merge commit `e5bae2858`.
- **Expected:** Begin from `origin/main` at `ab0fa13fe` while a concurrent docs slice owned #1068.
- **Actual:** #1079 merged cleanly and now supplies the required task router on `origin/main`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** branch rebased while clean; current `HEAD == origin/main == e5bae2858` before the
  harness bootstrap commit.

## 2026-08-03 — owner-started session route identity is opaque

- **What:** The active Codex session does not expose a configurable exact model id or a separate
  Fable orchestrator session.
- **Source:** runtime session metadata available to the assistant.
- **Expected:** lane-policy's named `planning_decisions` orchestrator and explicit Codex
  implementation route.
- **Actual:** the user directly started this Codex session and requested `use harness`.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `supervisor.md` records the owner-authorized current session; formal Qwen evaluation
  and opposite-family slice review remain separate and canonical.

## 2026-08-03 — local formal evaluator route lacks credentials

- **What:** The canonical local OpenRouter/Qwen PLAN-EVAL canary could not authenticate.
- **Source:** `deno task agentic:provider-canary --live --profile claude-openrouter
  --model qwen/qwen3.7-max --effort high --worktree /home/codex/repos/ns004-agenttools`.
- **Expected:** A separate local Qwen session writes the tracked PLAN-EVAL verdict.
- **Actual:** The canary returned `BLOCKED` with reason `auth_required`; no evaluator process was
  launched and no implementation began.
- **Severity:** moderate
- **Action:** accept a separate OpenHands/OpenRouter Qwen evaluator as the harness fallback.
- **Evidence:** exact canary command and observed `auth_required` result are recorded in the
  worklog; the tracked `plan-eval.md` remains the only verdict authority.

## 2026-08-03 — named review routes unavailable, native Opus used

- **What:** The named Fable review model and the lane-policy Claude alias were unavailable to the
  local Claude launcher.
- **Source:** bounded read-only launch attempts with `fable-5` and `opus-4.8` returned
  `model_not_found`.
- **Expected:** Use the named opposite-family slice-review route.
- **Actual:** The native model id `claude-opus-4-8` launched successfully; its initial review found
  two medium defects, and the resumed session returned `SLICE_REVIEW: PASS` after fixes.
- **Severity:** minor
- **Action:** accept
- **Evidence:** Claude session `964dfe11-04fb-4f0e-8b80-66d423354123`; focused suite 26/26 after
  the review fixes.

## 2026-08-03 — umbrella docs maintenance sees unrelated mirror drift

- **What:** `deno task docs:maintenance` reaches the repository-wide Claude skill mirror check,
  which reports stale `aspire` and `netscript-release` mirrors outside this slice.
- **Source:** slice-2 sign-off command output.
- **Expected:** The slice documentation checks complete without unrelated generated-surface drift.
- **Actual:** `docs:links` passed with zero broken links/anchors and `docs:accuracy` passed; the next
  repository-wide mirror check stopped on two files this slice does not own.
- **Severity:** minor
- **Action:** accept baseline drift; do not rewrite unrelated generated skills.
- **Evidence:** `docs=98 broken-links=0 broken-anchors=0`; `docs accuracy: PASS`; mirror checker names
  only `.claude/skills/aspire/SKILL.md` and `.claude/skills/netscript-release/SKILL.md`.

## 2026-08-03 — foreign runtime began after clean ownership check

- **What:** A separate Aspire verification repeatedly began after this slice's read-only leak-check
  returned clear, creating a race between the guard and the expensive runtime start.
- **Source:** `agentic:leak-check`, process ownership paths, and the scaffold runtime JSON log.
- **Expected:** Run `scaffold.runtime` without another slice on the 15 GB host.
- **Actual:** The first owned run was interrupted before service startup. After the foreign owner
  exited and leak-check reported zero survivors, a fresh run started; a new foreign AppHost under
  `/home/codex/repos/ns004-aspire-e8-verify` began two seconds later. The owned run passed 47 gates
  but its users health probe reported database-unhealthy; cleanup passed.
- **Severity:** moderate
- **Action:** reject the result as acceptance evidence, tick nothing, leave foreign resources alone,
  and retry only after a stable quiet window.
- **Evidence:** suite summary `passed=47 failed=1`; sole failure `behavior.service-health`; cleanup
  stopped the owned AppHost and removed all three run-owned containers.

## 2026-08-03 — published scaffold still emits pinned host ports

- **What:** The installed clone-independent smoke reaches the final generated-artifact gate, which
  rejects six literal Aspire host ports emitted by the current public `@netscript/cli@0.0.3`.
- **Source:** fresh consumer run from `/tmp` after local `agent init`; exact release metadata.
- **Expected:** The installed smoke completes without a framework checkout.
- **Actual:** Twenty-two steps pass, then the shipped validator rejects one service and five plugin
  endpoint pins. The concurrent scaffold lane owns those emitted defaults.
- **Severity:** moderate
- **Action:** do not weaken the gate or edit `/home/codex/repos/ns004-scaffold`; leave #1024's final
  criterion unchecked and remove its closing keyword until a released scaffold passes.
- **Evidence:** exact CLI `jsr:@netscript/cli@0.0.3`; six file/line findings; cleanup reporter found
  zero survivors after removing the exact owned Postgres container.

## 2026-08-03 — quiet-host merge smoke reproduces baseline service-health failure

- **What:** A fully serialized local-source `scaffold.runtime` retry still fails the users aggregate
  health probe after every resource wait succeeds.
- **Source:** required one-pass merge gate after leak-check reported zero foreign or owned resources.
- **Expected:** All runtime gates pass.
- **Actual:** 47 gates and cleanup pass; `behavior.service-health` returns HTTP 503 because Prisma's
  raw query cannot reach the generated database. This matches the earlier clean baseline shape.
- **Severity:** moderate
- **Action:** record as a baseline blocker outside the tooling/docs diff; do not claim a green
  runtime verdict.
- **Evidence:** `passed=47 failed=1`; the sole stderr names HTTP 503, `database` unhealthy, and the
  Prisma raw-query failure; post-run leak-check reports zero survivors.
