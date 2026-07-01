You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=600

use harness

**IMPL-EVAL** for the release-automation tooling on branch `chore/release-one-shot` (PR #164,
HEAD `58ab73cb`). You are a SEPARATE evaluator session from the generator — do NOT implement or
"fix" anything. Read the artifacts, verify the slices against the LOCKED plan, emit exactly one
verdict: `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT` (see
`.llm/harness/evaluator/verdict-definitions.md`).

## SKILL
- `netscript-harness` — controlling skill; load `.llm/harness/evaluator/protocol.md` +
  `gates/plan-gate.md` + `gates/archetype-gate-matrix.md`. Preserve evaluator separation; this is the
  final IMPL pass.
- `netscript-tools` — `.llm/tools/` conventions, scoped check/lint/fmt wrappers, gate-evidence rules,
  lock hygiene.
- `netscript-deno-toolchain` — `deno ci`/`ci --prod` (the `--frozen` rejection), `bump-version`,
  `publish --dry-run`, catalog law.
- `jsr-audit` — D3/S2 preflight encodes the locked "JSR-safe asset embedding = text imports, never
  `readTextFile`/`fromFileUrl`/`resolve(bare)` on `import.meta` paths" rule.
- `netscript-pr` — branch/PR/commit mechanics.

## What to evaluate
This is **SCOPE-tools** (repo/harness tooling: CI workflows + `.llm/tools/` + a new skill). NO
`packages/`/`plugins/` source was in scope. Read:
- `.llm/tmp/run/chore-release-one-shot--tooling/plan.md` (LOCKED, PLAN-EVAL cycle-2 PASS)
- `.llm/tmp/run/chore-release-one-shot--tooling/worklog.md` (gate evidence per slice)
- `.llm/tmp/run/chore-release-one-shot--tooling/commits.md`
- `plan-eval.md` (the cycle-2 PASS verdict + its 4 IMPL notes)

The 5 slices (commits f07613d5, d74ba7c2, 0b2d1aa5, 307981d8, e2a6a2f5):
1. **S1 / D2 (#146):** `deps:prod-install` drops `--frozen` (Deno 2.9 `deno ci` rejects it). Verify
   `git grep -nF -- '--frozen' .llm/tools/` returns ZERO (incl. `entry.md`, the evaluator note-1 site)
   and the wrapper unit test asserts no `--frozen`.
2. **S2 / D3 (#133):** `.llm/tools/release/preflight-text-imports.ts` + `deno task release:preflight`,
   two-pass cross-line resolver, narrowed to `Deno.readTextFile/readFile`, positive
   (`openapi.ts:29→155`-style) + negative fixtures, wired into `publish.yml` before "Publish dry-run".
   Verify the positive fixture flags non-zero, the negative exits 0, and test trees are excluded
   (evaluator note 2).
3. **S3 / D1 (#122):** `deno task release:cut -- <version>` (`.llm/tools/release/cut.ts`):
   workspace-coordinated bump (root `deno.json` + every `packages/*` + `plugins/*` + `deno.lock`
   `@netscript/*` ranges), residue check, gate chain (preflight → publish:dry-run → `deno ci --prod`),
   branch/commit/push/PR, `--dry-run`. Verify the unit test + that `--dry-run` does NOT push.
4. **S4 / D4 (#123):** `e2e-cli-prod.yml` `on: release: published` → `workflow_run` after `publish` +
   `workflow_dispatch`; success guard; non-racy version handoff via run-id-named artifact
   (`netscript-published-version-${{ github.run_id }}`) uploaded by `publish.yml` / downloaded by
   e2e from `github.event.workflow_run.id`.
5. **S5 / D5:** `.agents/skills/netscript-release/SKILL.md` + regenerated `.claude/skills/` mirror via
   `deno task agentic:sync-claude` (verify `agentic:sync-claude:check` green, no hand-edited mirror) +
   AGENTS.md pointer.

## CRITICAL — the preflight "true finding" (do NOT penalize the tooling for it)
The generator's `release:cut --dry-run` gate proof stopped fail-fast at S2's `release:preflight`
because the tool correctly flagged a REAL pre-existing bug: `packages/service/src/primitives/openapi.ts:155`
reads `scalar.min.js` via `Deno.readTextFile(new URL(..., import.meta.url))` — the JSR-unusable asset
class. Per the tooling scope (no `packages/` edits), the generator recorded it and did NOT suppress
it. **This is the gate working as designed**, not a tooling defect. Confirm the finding is genuine
(read `openapi.ts:29` + `:155`). Treat it as out-of-tooling-scope and tracked separately by the
supervisor (a follow-up framework-source fix slice). It must NOT drag the tooling verdict to FAIL —
if anything it is positive evidence S2 works. If you believe it should block, classify `FAIL_DEBT`
with the finding recorded, not `FAIL_FIX`.

## Validation you should run
Re-run the scoped gates yourself (don't trust the worklog blindly): `run-deno-check` on
`.llm/tools/release` + the unit tests (`cut_test.ts`, preflight fixtures, prod-install arg test),
`agentic:sync-claude:check`, the `--frozen` grep, and a YAML sanity parse of both workflows
(actionlint if available, else `@std/yaml` parse). Do NOT run the full CLI E2E (`e2e:cli`) — out of
scope; #123's live proof is deferred to the next real cut.

## Output
Write `.llm/tmp/run/chore-release-one-shot--tooling/evaluate.md` with the verdict, per-slice findings,
gate re-run evidence, and the run id. Post the `pr-comment` summary. Two FAIL cycles max. Do not
commit source changes beyond the eval artifact + trace.


Issue/PR title: chore(release): one-shot deterministic release automation (plan) — #147

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
- Write /home/runner/work/_temp/openhands/28305978962-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28305978962-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-164/run-28305978962-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 164
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28305978962
