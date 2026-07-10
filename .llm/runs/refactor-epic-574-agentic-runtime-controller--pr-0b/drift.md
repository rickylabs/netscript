# Drift Log: PR 0B desired-state agentic runtime controller

## 2026-07-10 - Owner-authorized evaluator waiver

- **Expected:** Separate OpenHands PLAN-EVAL and IMPL-EVAL sessions.
- **Actual:** The owner explicitly requested no evaluator use and directed personal review to be
  treated as passed.
- **Severity:** significant
- **Action:** keep the waiver explicit; retain Tier-A substantive review and all acceptance gates.

## 2026-07-10 - Requested Codex effort was not applied

- **Expected:** GPT-5.6 Sol with per-launch effort `high`.
- **Actual:** Thread `019f4b72-2ea4-7050-917e-6d6918371265` uses GPT-5.6 Sol with daemon-default
  effort `medium`.
- **Severity:** significant
- **Action:** keep the actual route explicit and continue with the sole attached worker; canonical
  route enforcement remains #581.

## 2026-07-10 - Evaluator waiver does not self-approve PR 0B Plan-Gate

- **Expected:** The bootstrap drift text implied the owner's no-evaluator direction could be
  recorded as a passed personal review, following PR 0A precedent.
- **Actual:** The resumed planning brief explicitly says not to self-certify and reserves Plan-Gate
  approval for coordinator substantive review.
- **Severity:** significant clarification; supersedes any PR 0B reading that the earlier waiver is
  already a `PASS`.
- **Action:** dispatch no external evaluator, create no worker-authored `plan-eval.md`, leave the
  gate pending, and stop before implementation. The coordinator may later record its independent
  substantive review under the owner waiver.

## 2026-07-10 - Bootstrap artifacts required scoped ownership repair

- **Expected:** The attached `codex` worker can update mandatory run artifacts.
- **Actual:** The PR 0B run directory and Markdown files were `root:root` mode `0755/0644`; the first
  `apply_patch` could not replace them.
- **Severity:** minor operational drift; no content or source drift.
- **Action:** changed ownership only for
  `.llm/runs/refactor-epic-574-agentic-runtime-controller--pr-0b/` to `codex:codex` using an existing
  local container bind mount. Contents and modes were preserved; no implementation source changed.

## 2026-07-10 - Archetype 6 applied as an internal-tool variant

- **Expected:** Full Archetype 6 v2 describes a published package with class spines, public and
  maintainer surfaces, composition, registries, and JSR gates.
- **Actual:** #576 is an internal functional Deno tool under `.llm/tools/agentic`, inheriting the PR
  0A internal-tool treatment. It has no published package/export map and no justified class spine.
- **Severity:** minor documented profile tailoring, not accepted package debt.
- **Action:** apply thin-edge, adapter, side-effect, semantic-test, permission, naming, and LOC gates;
  mark package/public/composition/JSR-only gates N/A with reasons. Rescope if implementation grows
  into a publishable package or open extension surface.

## 2026-07-10 - Locked broad format include reaches untouched S5 wrappers

- **Expected:** The every-slice format command in `plan.md` is a green verdict over S2-owned files.
- **Actual:** The exact broad include exits 1 on four pre-existing formatting findings in untouched
  S5 wrapper files: `claude-remote-smoke.ts`, `codex-resume.ts`, `codex-status.ts`, and
  `launch-codex-slice.ts`. `git diff ac71896 -- <those files>` is empty. The same scoped wrapper
  over `runtime/|agentic-runtime` selects all 13 S2/S1 runtime files and exits 0 with zero findings.
- **Severity:** minor gate-scope drift; no implementation or architecture drift.
- **Action:** preserve the raw exit-1 evidence, use the owned-surface exit-0 wrapper as the S2
  formatting verdict, and do not edit compatibility wrappers before locked slice S5.

## 2026-07-10 - Owner replaced Gemini CLI with Antigravity CLI

- **Expected:** Locked plan and implemented S1-S3 model Gemini CLI as the Google runtime/research
  component.
- **Actual:** The owner directed migration to Google Antigravity CLI (`agy`) after those slices.
- **Severity:** significant owner-authorized scope change.
- **Action:** preserve historical Gemini evidence, pause S4/S5/#578, revise GitHub and harness plans,
  and implement a reviewed compatibility migration later. Do not infer Gemini auth, quota, output,
  or research contracts for `agy`.

## 2026-07-10 - S4 lifecycle apply boundary clarified

- **Expected:** The earlier S4 plan broadly named lifecycle apply behavior.
- **Actual:** Transaction-safe launch/resume/static-smoke apply requires durable one-sender ownership
  owned by #580, so C7 returns an explicit #580 capability block while retaining data-only plan mode.
- **Severity:** reviewed child-boundary clarification; no hidden implementation debt.
- **Action:** keep lifecycle mutation deferred to #580 and do not claim it executable in #576.

## 2026-07-10 - Doctor repeat reflects deferred owner-state vocabulary

- **Expected:** Prior S4 doctor evidence exited 2 against the PR 0A foundation-state vocabulary.
- **Actual:** Both current repeats deterministically exit 5 with `state_corrupt` because the external
  owner-managed foundation state contains `antigravity`, whose migration is explicitly outside C5-C8.
- **Severity:** environment/input drift, not nondeterminism or a C5-C8 source regression.
- **Action:** preserve raw `5/5` evidence; do not migrate Antigravity vocabulary in this slice.

## 2026-07-10 - C7 lifecycle deferral precedence corrected

- **Expected:** Every lifecycle apply path is owned by #580 before provider capability routing.
- **Actual:** `f0a59a6` checked #577/#578 provider deferral first for Gemini/OpenRouter routes.
- **Severity:** narrow attribution defect; no mutation escaped and plan paths remained read-only.
- **Action:** apply mode now wins first; exact provider × launch/resume/smoke status/owner/exit tests
  prevent recurrence. Non-apply provider deferrals remain unchanged.

## 2026-07-10 - Owner fixture review stayed test-only

- **Expected:** Deduplicate runtime-test component versions without creating controller policy.
- **Actual:** One frozen typed test fixture now supplies the owned runtime tests that shared those
  exact values; historical foundation tests were intentionally not refactored.
- **Severity:** no implementation drift.
- **Action:** retain explicit node/Claude/Gemini typing and order in the test fixture only.

## 2026-07-10 - Schema 1.0 checkpoint reader gained bounded legacy migration

- **Expected:** Adding rollback progress and exact desired inverse must not corrupt serialized
  schema-1.0 checkpoints produced before S4.
- **Actual:** The strict reader initially required both new fields without a schema transition.
- **Severity:** backward-compatibility defect; unrelated commands could fail during checkpoint load.
- **Action:** infer progress only from legacy checkpoint status and mark absent desired inverse as
  unavailable. Refuse its rollback before ownership probes/mutation; do not invent metadata.

## 2026-07-10 - Antigravity compatibility implemented after foundation merge

- **Expected:** Replace historical Gemini controller vocabulary after PR #584 merges.
- **Actual:** Canonical Antigravity vocabulary is implemented; legacy state has bounded migration or
  ambiguity refusal.
- **Severity:** owner-approved transition, no architecture debt.
- **Action:** retain #578 deferrals; never add a Gemini executable alias or inferred agy policy.

## 2026-07-10 - S5 resolved prior wrapper-format drift

- **Expected:** S5 owns the four previously untouched wrapper formatting findings and explicit
  retirement boundaries.
- **Actual:** All owned wrapper formatting is now green and behavior/task mappings are retained.
- **Severity:** planned closure of recorded minor drift.
- **Action:** keep wrappers for one cycle; removal requires a separate reviewed change.

## 2026-07-10 - Final self-review

- **Expected:** Close implementation scope without self-certifying Tier-A.
- **Actual:** Compatibility, S5, gates, and six DoD items are complete; coordinator review remains.
- **Severity:** no drift or debt.
- **Action:** stop after final evidence/push/comments and await coordinator sign-off/merge.
