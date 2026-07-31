# Drift Log: adopt the 0.0.x release scheme

Drift is append-only. Record facts that diverge from the plan, owner brief, doctrine, or current
documentation.

## 2026-07-31 — Owner-established run ID omits canonical suffix

- **What:** The launcher and owner refinement use `.llm/runs/version-scheme-0-0-x/` rather than a
  branch-derived `chore-version-scheme-0-0-x--<suffix>` directory.
- **Source:** Commits `e87de8e6b` and `fbd57c3bf`; `codex-thread-ids.md`.
- **Expected:** Harness activation normally derives the run ID from the full branch plus suffix.
- **Actual:** An established committed run path exists and the owner explicitly points to it.
- **Severity:** minor
- **Action:** accept; keep one authoritative run directory rather than fork state.
- **Evidence:** `.llm/runs/version-scheme-0-0-x/implement.md`.

## 2026-07-31 — Tier-majority expectation conflicts with release-owned baseline

- **What:** At least 258 of the stated 325 occurrences are already exact-version surfaces that the
  owner requires this branch to leave at `0.0.1-beta.12` and that `release:cut` owns.
- **Source:** Exact baseline census plus bumper/generator inspection.
- **Expected:** Revised brief says to expect most references in Tiers 1 and 2.
- **Actual:** 131 lockfile + 106 `deno.json` + 12 scaffold-manifest + 9 generated-constant
  occurrences are necessarily Tier 3 (258 total), before other exact consumers are classified.
- **Severity:** significant
- **Action:** accept factual constraint; report both the complete census and the reducible
  non-manifest/non-generated remainder, without manipulating counts.
- **Evidence:** `.llm/tools/deps/bump-version.ts`, `.llm/tools/generate-publish-assets.ts`,
  `.llm/tools/release/prepare-release.ts`, and `research.md`.

## 2026-07-31 — Local formal evaluator credential unavailable

- **What:** The canonical local PLAN-EVAL route could not launch because its isolated
  `claude-openrouter` child environment has no OpenRouter credential.
- **Source:** `deno task agentic:provider-canary --live --profile claude-openrouter --model
  qwen/qwen3.7-max --effort high --worktree /home/codex/repos/b12-scheme`.
- **Expected:** A separate Qwen evaluator session writes `plan-eval.md` before implementation.
- **Actual:** Agentic canary returned `status=blocked`, `credential=absent`, and
  `auth_required`; no evaluator process or session started.
- **Severity:** significant
- **Action:** block implementation pending an OpenRouter credential or explicit owner authorization
  to change the local run's evaluator transport to cloud OpenHands. Closed-model substitution and
  self-evaluation remain prohibited.
- **Evidence:** PR #995 Plan-Gate status comment and the command result recorded in `worklog.md`.
