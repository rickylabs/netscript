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

## 2026-06-12 - Zag proof already exists

- **What:** User clarified that Zag has already been proved working in a previous commit and is
  mentioned in PR #32.
- **Source:** User message on 2026-06-12.
- **Expected:** Initial Run 3 artifacts described Zag as needing a fresh viability spike.
- **Actual:** Slice 7 should cite and validate the existing proof while still recording the
  adoption policy as an ADR. The locked slice remains unchanged; this narrows the evidence-gathering
  posture, not the scope.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `research.md`, `plan.md`, and `worklog.md` updated in this bookkeeping pass.

## 2026-06-12 - repo-genesis fresh-ui copy has broader pre-existing drift

- **What:** The outer repo-genesis `packages/fresh-ui/deno.json` already differed from the
  framework worktree before Slice 1 (version/export/publish/task shape). Slice 1 synced only the
  single-config ownership change: folded the local `deno.gates.json` fmt settings into
  repo-genesis `deno.json` and deleted repo-genesis `deno.gates.json`.
- **Source:** `Get-Content` and targeted `git diff` against the outer repo before sync.
- **Expected:** Copy-fidelity guidance wants synced package copies.
- **Actual:** A broad package-copy reconciliation would exceed Slice 1 and overlap later version,
  manifest, test-layout, and scaffold slices.
- **Severity:** minor
- **Action:** defer
- **Evidence:** framework commit `52a9ab24ed4dd32801a8422bf85b591367d62999`; repo-genesis commit
  `a76b344600de529c00d3d707db4f61be8997201a`.

## 2026-06-12 - repo-genesis package lock captures broader workspace closure

- **What:** Applying the approved package-local lock policy in the outer repo-genesis copy generated
  a larger `packages/fresh-ui/deno.lock` than the framework worktree lock.
- **Source:** Slice 2 outer `deno task check` from `packages/fresh-ui` after adding explicit
  `--lock=deno.lock`.
- **Expected:** Copy-fidelity sync records the same lock policy in both repos.
- **Actual:** The outer copy's existing workspace and package drift causes Deno to resolve a broader
  dependency closure while still writing to the package-local lock.
- **Severity:** minor
- **Action:** accept for Slice 2; broad copy reconciliation remains deferred to later locked slices.
- **Evidence:** framework commit `17f410390396f079c8abd184522871a46abd95fc`; repo-genesis commit
  `808a6bd3d24a4f2ad4e1b622f48ea2f8a9d1792f`.

## 2026-06-12 - repo-genesis lacks CLI source for Slice 3 sync

- **What:** Slice 3 changes the framework CLI `ui:add` registry loader, but the outer
  repo-genesis worktree does not contain `packages/cli/src/public/features/ui/registry.ts`.
- **Source:** `Get-Content` for the outer CLI path failed before sync.
- **Expected:** Copy-fidelity sync applies relevant package and CLI changes to repo-genesis where
  those files exist.
- **Actual:** Only the outer `packages/fresh-ui` manifest/schema relocation and package test import
  could be synced in this worktree.
- **Severity:** minor
- **Action:** accept; later scaffold-revamp slices will operate against the framework CLI source.
- **Evidence:** framework commit `84558e0e2eab6d314763fa1d339a173786e15a34`; repo-genesis commit
  `5137ec90f7e3a758601d2ce3cf6373c5768cae37`.

## 2026-06-12 - framework worktree lacks apps/playground for Slice 4

- **What:** The locked Slice 4 asks to wire `sheet-styles` and `floating-styles` into the gallery,
  but the framework worktree has no `apps/` directory.
- **Source:** `Get-ChildItem apps` failed in the framework worktree; prior run context and the
  outer repo-genesis tree locate the real playground at `apps/playground`.
- **Expected:** Gallery work happens in `apps/playground`.
- **Actual:** Visual gallery implementation lives in repo-genesis; framework repo records browser
  evidence and harness artifacts.
- **Severity:** minor
- **Action:** accept for visual slices.
- **Evidence:** repo-genesis commit `84748b56be0199a193bf556a454d62fd55937c02`.

## 2026-06-12 - Playwright MCP profile locked during Slice 4

- **What:** Both Playwright MCP namespaces failed with a locked profile error for
  `mcp-chrome-a7ac91e`.
- **Source:** `browser_resize` and `browser_tabs list` returned "Browser is already in use".
- **Expected:** Browser validation uses Playwright on real routes.
- **Actual:** An isolated Playwright Core script launched installed Chrome headlessly and produced
  the browser report and screenshots.
- **Severity:** minor
- **Action:** accept; evidence remains Playwright-based.
- **Evidence:** `slice4-browser-check.ts`, `slice4-browser-report.json`, and screenshots in the run
  directory.

## 2026-06-12 - playground full check blocked by unrelated CRLF fmt drift

- **What:** `deno task check` in `apps/playground` failed at the fmt phase on eight unrelated
  existing files due line-ending-only differences.
- **Source:** full playground check output listed existing files such as
  `assets/ui/checkbox.css`, `assets/ui/choice-styles.css`, and
  `components/ui/checkbox.tsx`.
- **Expected:** Full playground check is green after visual edits.
- **Actual:** Focused fmt/lint/check on touched Slice 4 files passed; unrelated line-ending
  normalization was left untouched.
- **Severity:** minor
- **Action:** defer to the fmt ownership slice or a dedicated playground normalization slice.
- **Evidence:** focused gate rows in `worklog.md`; root `deno.lock` restored after checks.
