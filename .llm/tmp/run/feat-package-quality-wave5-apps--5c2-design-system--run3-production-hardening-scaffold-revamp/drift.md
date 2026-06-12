# Drift Log: Run 3 production hardening + scaffold revamp

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-06-12 - requested doctrine skill path missing

- **What:** The prompt requested `.claude/skills/netscript-doctrine/SKILL.md`, but that file does
  not exist in this worktree.
- **Source:** `Test-Path .claude/skills/netscript-doctrine/SKILL.md` returned `False`.
- **Expected:** Prompt-listed skill path exists.
- **Actual:** `.agents/skills/netscript-doctrine/SKILL.md` exists and was used.
- **Severity:** minor
- **Action:** accept
- **Evidence:** bootstrap command output; `.agents/skills/netscript-doctrine/SKILL.md`.

## 2026-06-12 - impeccable helper scripts absent

- **What:** The repo-local Impeccable skill text references helper scripts and references that are
  absent in the worktree.
- **Source:** `node .agents/skills/impeccable/scripts/context.mjs` failed with
  `MODULE_NOT_FOUND`; `Get-Content .agents/skills/impeccable/reference/product.md` failed.
- **Expected:** Impeccable setup script and register reference are present.
- **Actual:** Only the skill text is available; design guidance was applied from that text and the
  separate frontend-design skill.
- **Severity:** minor
- **Action:** accept
- **Evidence:** bootstrap command output.

## 2026-06-12 - deps docs directory absent

- **What:** The prompt listed `.resources/deps-docs/` as an available resource, but it is absent in
  this worktree.
- **Source:** `Get-ChildItem .resources/deps-docs -Recurse -File` failed.
- **Expected:** Dependency docs are available under `.resources/deps-docs/`.
- **Actual:** Curated `.llm/tmp/docs/` files are present and were read first.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `.llm/tmp/docs/zagjs-preact-api.md`, `fresh2-islands-partials.md`,
  `tailwindcss-v4-theme.md`, `shadcn-registry-schema.md`.

## 2026-06-12 - no Run 3 Plan-Gate artifact found

- **What:** No `plan-eval.md` exists for this Run 3 scope.
- **Source:** `Get-ChildItem -Recurse .llm/tmp/run -Filter plan-eval.md` listed only prior wave
  run directories.
- **Expected:** Implementation session starts after separate PLAN-EVAL `PASS`.
- **Actual:** Plan-Gate status is missing for Run 3; implementation is blocked until a separate
  evaluator writes `PASS` or the user explicitly waives the gate.
- **Severity:** significant
- **Action:** defer
- **Evidence:** `worklog.md` gate result `Plan-Gate presence`.

## 2026-06-12 - search tooling unavailable

- **What:** `rg` is not on PATH and `rtk grep` cannot fall back because neither `rg` nor `grep`
  resolves.
- **Source:** failed `rg` and `rtk grep` commands during bootstrap.
- **Expected:** AGENTS.md says prefer `rg`; rtk skill says prefix read-heavy grep with `rtk`.
- **Actual:** Focused PowerShell `Get-ChildItem` and `Select-String` are required for this shell.
- **Severity:** minor
- **Action:** accept
- **Evidence:** bootstrap command output.
