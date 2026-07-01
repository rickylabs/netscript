You are OpenHands running for the NetScript repository.

User task:
Trigger comment:
@openhands-agent model=openrouter/qwen/qwen3.7-max output=pr-comment iterations=400

use harness

# IMPL-EVAL — PR #208 (feat/scaffold-crud-surface) [#153 CODE half]

You are the **IMPL-EVAL evaluator**, a separate session from the generator. Follow
`.llm/harness/evaluator/protocol.md` exactly. Your job is to verify the **approved plan** against the
**changed state** on this PR branch — NOT to continue or fix implementation. **Protocol Rule 11: do
NOT edit implementation.** Only read-only / minimal validation commands are permitted.

The PR branch is already checked out for you at HEAD `48edf028`. All CI on this head is GREEN and is
authoritative (see "Gates" below).

## APPROVED PLAN — where it lives (read this before applying Rule 2)

There is intentionally **no `plan.md` / `plan-eval.md` in the run directory**. The approved scope and
the Plan-Gate PASS are recorded as follows — treat these as the approved plan and do **NOT** raise a
process-failure for the absent `plan.md`; record it as a documented substitution:

- **PLAN-EVAL = PASS** on issue **#153** (OpenHands PLAN-EVAL run `28519388650`, verdict PASS).
- **Approved scope = the PR #208 description** (the C1–C15 slice ledger + CI-hardening notes + the
  "Notes for IMPL-EVAL" section listing the doctrine-legal cross-package changes) **plus the owner
  scope-locks below**.

## OWNER SCOPE-LOCKS (binding acceptance bar — do not exceed or contradict)

- **OQ4 (multi-engine merge bar) = "3 boot + mssql typecheck":** postgres / mysql / sqlite must pass
  a **real** `scaffold.runtime` end-to-end boot; **mssql** is accepted as **typecheck-proof only**
  (scaffold + standalone `db:generate` + `deno check`), with the e2e-boot follow-up tracked in
  **#216**. Do **NOT** fail this PR because mssql does not boot end-to-end — that is the agreed bar.
- **OQ1 (model shape):** generated Prisma model = **singularized + PascalCase** name, **Int
  autoincrement id**, with a `--model-name` override that flows end-to-end.
- **OQ5 (docs are OUT OF SCOPE here):** tutorial/docs conformance to the new CRUD surface lands in a
  **separate docs-only PR**, not this CODE PR. Do **NOT** fail this PR for tutorial/docs drift.

## INPUTS TO READ

Run directory `.llm/tmp/run/feat-scaffold-crud-surface--impl/`:
- `worklog.md` — design checkpoint + per-slice generator evidence.
- `commits.md` — slice→commit history (C1–C15; final impl commit `fee58a6b`, debt commit `48edf028`).
- `drift.md` — plan/doctrine drift (incl. the 2026-07-01 scaffold-static root-cause that produced C14,
  and the Fable-5-unavailable pre-eval skip — informational only, not a defect).
- `context-pack.md`, `adversarial-review.md` — resumable state + the pre-IMPL-EVAL adversarial pass (C11).
- `.llm/harness/debt/arch-debt.md` — the **debt delta** for this PR is `DB-GENERATE-ASPIRE-COUPLING`
  (open; worked around in the e2e harness by C14, CLI command still Aspire-coupled). Verify it is
  present and well-formed (Rule 9 / `FAIL_DEBT` only if the sole blocker is missing/malformed debt).
- The **PR #208 description** on GitHub (approved scope + IMPL-EVAL notes).

## WHAT TO VERIFY (protocol Rules 3–8)

1. Each committed slice (C1–C15) maps to its intent in the PR ledger and its named gate passes.
2. **Concept of Done** (run-loop §5 + service/frontend archetype gates) for the scaffold surface:
   `netscript init --service --db <engine>` emits the real documented surface — parameterized Prisma
   model (OQ1), `@database/zod` schemas, `createCrudContract`/`baseContract` contract, Prisma-backed
   `context.db.<model>.*` handlers, live model-backed Fresh CRUD dashboard — with NO fallback to the
   old in-memory `oc` stub.
3. **C11 soundness gate:** generated handler + island code is **cast-free and
   non-null-assertion-free**; the only accepted cast is the centralized
   `packages/contracts/crud/create-crud-contract.ts` Zod-shape seam. Spot-verify on a freshly
   scaffolded project (grep for `as ` casts / `!` non-null in generated `services/**/routers` +
   generated island).
4. **C14 premise:** the static suites run the standalone Aspire-less `deno task db:generate` (new
   `database.codegen` gate) in `database/<engine>`, not the Aspire-coupled `netscript db generate`.
5. Missing evidence is a finding; name doctrine violations by AP code where possible.

## GATES (authoritative + optional spot-check)

CI on HEAD `48edf028` is **green** and authoritative: `scaffold-static (deno-only)`,
`scaffold-runtime (aspire + docker + postgres)`, `check-test`, `quality`, `deps-report` all pass
(`agent` is this dispatch job). You are **not required** to re-run the expensive `scaffold.runtime`
suite. You MAY spot-verify cheaply with read-only commands — e.g. `deno task check`, a static suite
(`deno task e2e:cli run scaffold.service --cleanup --format pretty`), or a fresh scaffold + standalone
`deno task db:generate` + `deno check`. If you run anything, use the **native WSL worktree** (never
`/mnt/c` for deno/aspire) and prefer `rtk proxy` for `deno task` runs.

## LOCK HYGIENE (BINDING — you are an evaluator, not a committer)

- Do **NOT** commit or push any source, `deno.lock`, `deno.json`, or trace/scratch files to the PR
  branch. Your deliverable is the PR-comment verdict only. If a validation run dirties the worktree
  (lock re-resolution, generated files), leave it unstaged and do not push it.
- Do not delete lock files/caches or run `deno cache --reload`.

## OUTPUT (protocol § Output)

- Write the verdict to `.llm/tmp/run/feat-scaffold-crud-surface--impl/evaluate.md` using
  `.llm/harness/templates/evaluate.md`. Every `PASS` row must carry evidence (command / file / trace /
  route / debt entry) — a blank PASS is not a pass.
- Post the verdict as a PR comment (this dispatch uses `output=pr-comment`). Lead with the verdict
  token from `verdict-definitions.md` (PASS / FAIL_DEBT / FAIL_RESCOPE / FAIL). Use `FAIL_DEBT` only
  if the sole blocker is unrecorded/malformed arch-debt; `FAIL_RESCOPE` only if the plan is materially
  wrong (not merely incomplete). Given the scope-locks above (mssql typecheck-proof, docs deferred to
  OQ5), those are **not** grounds for FAIL.

## SKILL

- `netscript-harness` — harness workflow, run-loop, verdict definitions, evaluator protocol.
- `netscript-doctrine` — package/plugin archetype gates + AP codes for naming violations.
- `netscript-cli` — CLI scaffold/init/db surface being evaluated.
- `netscript-tools` — validation evidence, raw-git verification, lock-hygiene decisions.
- `netscript-deno-toolchain` — `deno doc` / `deno check --unstable-kv` / task wrappers.
- `netscript-pr` — PR comment / phase-summary conventions.


Issue/PR title: feat(cli): scaffold CRUD surface DX upgrade (C1–C10) [#153 CODE]

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
- Write /home/runner/work/_temp/openhands/28547342778-1/summary.md before exit. Include Summary, Changes, Validation,
  Responses to review comments or issue comments when relevant, and Remaining risks.
- Do not write or reuse .llm/tmp/openhands/summary.md. Write only the run-scoped path
  from OPENHANDS_SUMMARY_PATH.
- If output_mode is thread-replies, optionally write /home/runner/work/_temp/openhands/28547342778-1/replies.json as
  an array of {"comment_id": number, "body": string} objects for PR review-thread replies.
- The workflow records durable trace metadata under .llm/tmp/run/openhands/pr-208/run-28547342778-1.

Trigger metadata:
- event: issue_comment
- issue_or_pr: 208
- is_pr: true
- output_mode: pr-comment
- selected_model: openrouter/qwen/qwen3.7-max
- selected_provider: OPENROUTER
- action_run: https://github.com/rickylabs/netscript/actions/runs/28547342778
