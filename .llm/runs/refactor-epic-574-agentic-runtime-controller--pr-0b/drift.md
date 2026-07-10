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
