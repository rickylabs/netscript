You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/minimax/minimax-m3 output=pr-comment iterations=300 use harness — run **PLAN-EVAL** (separate evaluator session) for the **JSR alpha-1 publish-mechanics** slice (PR1). Hard gate: no implementation begins until this returns PASS. Do NOT write code.

You are on branch **`chore/jsr-alpha1-publish-prep`** (this PR's head, off current `main`). Read the run artifacts first: `.llm/tmp/run/chore-jsr-alpha1-publish-prep/research.md` and `.llm/tmp/run/chore-jsr-alpha1-publish-prep/plan.md`. Verify every claim below against the code on this branch.

## What this slice does (ratify or reject — do not implement)
A release-mechanics slice to make the workspace publishable to JSR under one aligned alpha version and to fix the broken scaffold version pins. Four slices:

1. **Version align** — normalize `packages/fresh-ui/deno.json` `0.1.0` → `0.0.1-alpha.0`, then `deno bump-version prerelease -w` → all 32 members uniform at `0.0.1-alpha.1` + root import-map `jsr:` refs rewritten. (The bump tool is increment-only; `prerelease -w --dry-run` was confirmed to map every `0.0.1-alpha.0`→`0.0.1-alpha.1` EXCEPT the off-base fresh-ui `0.1.0`→`0.1.1-0`, hence the normalize-first step.)
2. **Single version source + scaffold pin fix** — `packages/cli/src/kernel/adapters/scaffold/import-resolver.ts` `PACKAGE_TO_JSR` hardcodes 48 `jsr:@netscript/...@^1.0.0` specifiers that will NOT resolve once `0.0.1-alpha.1` publishes (`^1.0.0` ⇒ `>=1.0.0 <2.0.0`). Replace with an **exact** pin `@0.0.1-alpha.1` sourced from ONE release-version constant (preferred: derive from the CLI package's own lockstep `version`, so the next bump keeps scaffolds correct — drift-free). Update `tests/import-resolver_test.ts:21-22`.
3. **Docs dynamic version** — feed the release version into one docs data constant; remove hardcoded `^1.0.0`/`1.0.0`/"not installable today" framing in `docs/site/concepts.vto`, `docs/site/capabilities/auth.md`, `docs/site/explanation/auth-model.md`, `docs/site/how-to/add-authentication.md`.
4. **OIDC publish workflow + lock regen** — new `.github/workflows/publish.yml`, tag-push trigger, `permissions: id-token: write` + `contents: read`, tokenless `deno publish` at workspace root; regenerate `deno.lock` (version-driven only).

## Plan-Gate (evaluate and report each)
1. **Version mechanism** — is normalize-fresh-ui-then-`bump-version prerelease -w` correct and complete? Does it actually update root import-map `jsr:` self-refs, or are there `jsr:@netscript/*` references elsewhere (package deno.json `imports`, exports) the bump misses and that must be hand-reconciled? Confirm nothing published yet makes the fresh-ui downgrade safe.
2. **Scaffold single-source** — is deriving the scaffold pin from the CLI package's own `version` the right drift-free mechanism, vs a generated constant? Verify `import-resolver.ts` is the only place the `^1.0.0` pins live (plus the test) and that `generate-app-deno-json.ts` consumes it. Is an EXACT pin (not `^`) correct for a prerelease?
3. **Docs dynamic version** — does a clean single-source mechanism exist for `docs/site` (Lume `_data`), and does removing the "forward-looking/not installable" narrative leave the docs accurate once published? (Honesty-framing voice is banned per repo doctrine.)
4. **OIDC workflow** — is tag-push + `id-token: write` + workspace-root `deno publish` the correct shape given the `@netscript` scope posture ("Restrict publishing to members" ON, "Require publishing from CI" OFF)? Any missing permission, tag-pattern, or member/OIDC linkage concern?
5. **Gates/scope** — is the gate set right (scoped check/lint/fmt, CLI scaffold unit test, `publish:dry-run`)? Is `scaffold.runtime` E2E required for the JSR-pin change, or does scaffold.runtime use local-source mode such that the unit test suffices? Any slice mis-scoped or reaching beyond its boundary?
6. **Debt** — anything deferred that should be explicit debt? Anything proposed for deletion that is load-bearing?

## Constraints (verify the plan honors these)
- Lock hygiene: only the version-driven re-resolution in `deno.lock`; no unrelated churn.
- Implementation lane = WSL Codex daemon-attached, slice-by-slice, IMPL-EVAL gated.
- README revamp + in-package `/docs` removal are a SEPARATE PR (PR2, doc-authoring lane) — do NOT evaluate them here.

## Output
Emit **PASS** or **FAIL_PLAN** with per-slice notes. On PASS, list any slice-time corrections to fold in. On FAIL_PLAN, give the specific blocking defect. Two FAIL_PLAN cycles → escalate. Deliver the full verdict in this PR comment thread.


Issue/PR title: chore(publish-prep): JSR alpha-1 publish mechanics (PR1)

Operational contract:
- Read AGENTS.md first.
- Your iteration budget is limited. Create deliverable files in the repository
  workspace EARLY and grow them incrementally as you learn; never defer all
  writing to the end of the run. Uncommitted workspace files are committed back
  to the branch automatically when the run ends, even if you run out of budget.
- If the task says "use harness", follow .agents/skills/netscript-harness/SKILL.md.
- If the work touches packages/ or plugins/, use .agents/skills/netscript-doctrine/SKILL.md.
- Use rtk for read-heavy git/grep/gh/docker commands when it is available.
- Preserve user changes and avoid destructive git commands.
- Run the smallest validation that proves the change.
- Do not post GitHub issue or PR comments directly. The workflow owns GitHub comments.
- Write /home/runner/work/_temp/openhands/28069607556-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28069607556-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-116/run-28069607556-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 116
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/minimax/minimax-m3
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28069607556
