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

## 2026-06-12 - package fmt has no targets before fmt ownership slice

- **What:** A bare `deno fmt --check` from `packages/fresh-ui` returns "No target files found" under
  the current package fmt config.
- **Source:** Slice 5 fmt probe after moving tests.
- **Expected:** Package fmt ownership is resolved in locked Slice 6 (C-7).
- **Actual:** Slice 5 does not rescope fmt ownership; package check/test/tokens and DS gates passed.
- **Severity:** minor
- **Action:** defer to Slice 6.
- **Evidence:** `worklog.md` Slice 5 package fmt probe row.

## 2026-06-12 - repo-genesis root arch:check remains CLI-owned during Slice 6

- **What:** Framework root `arch:check` was promoted to a fresh-ui package architecture composite;
  repo-genesis root `arch:check` is a separate CLI fitness chain and does not include the fresh-ui
  DS scripts.
- **Source:** Outer `deno.json` carries CLI-specific architecture gates; outer `.llm/tools/fitness/`
  does not include the fresh-ui DS gate scripts.
- **Expected:** Copy-fidelity sync applies framework package changes to repo-genesis.
- **Actual:** Synced package fmt/token changes to repo-genesis and left the outer CLI root
  `arch:check` unchanged.
- **Severity:** minor
- **Action:** accept; scaffold/CLI gate ownership is handled by later locked scaffold slices.
- **Evidence:** repo-genesis commit `f0ac62694914fa90361752fa572f8888d5ef9037`.

## 2026-06-12 - repo-genesis package lock expanded during token-generator sync

- **What:** Running the outer fresh-ui token builder directly refreshed `packages/fresh-ui/deno.lock`
  with `style-dictionary` transitive dependencies.
- **Source:** The outer fresh-ui package predates the newer `tokens:build` task but has the same
  token builder script import.
- **Expected:** Package lock is tracked when package commands resolve dependencies.
- **Actual:** Package lock changed; root `deno.lock` remained untouched.
- **Severity:** minor
- **Action:** accept as package-lock sync drift for the outer copied package.
- **Evidence:** repo-genesis commit `f0ac62694914fa90361752fa572f8888d5ef9037`.

## 2026-06-12 - installed Git lacks `--strip-trailing-cr`

- **What:** The run instructions request `diff --strip-trailing-cr`, but the installed Git rejected
  that option for `git diff --no-index`.
- **Source:** Slice 8 copy-fidelity check returned "unknown option `strip-trailing-cr`".
- **Expected:** Copy-fidelity check ignores CRLF-only differences.
- **Actual:** Used Git's supported `--ignore-cr-at-eol` option for equivalent CRLF-tolerant
  package/app copy comparisons.
- **Severity:** minor
- **Action:** accept; no content differences were found.
- **Evidence:** Slice 8 worklog copy-fidelity gate.

## 2026-06-12 - impeccable context helper absent

- **What:** The impeccable skill requested `node .agents/skills/impeccable/scripts/context.mjs`,
  but that helper script is absent in this checkout.
- **Source:** Node returned `MODULE_NOT_FOUND` for the helper path during Slice 8 setup.
- **Expected:** The helper summarizes design context before visual implementation.
- **Actual:** Continued with the local fresh-ui docs, tokens, gallery code, and browser screenshots.
- **Severity:** minor
- **Action:** accept; do not block implementation on a missing helper script.
- **Evidence:** Slice 8 worklog browser validation and package gates.

## 2026-06-12 - playground full check still blocked by unrelated CRLF fmt drift

- **What:** Slice 8 `deno task check` in `apps/playground` failed during `deno fmt --check .`.
- **Source:** The failing files were pre-existing copied UI files such as
  `assets/ui/choice-styles.css`, `assets/ui/checkbox.css`, `components/ui/checkbox.tsx`, and
  `components/ui/progress.tsx`.
- **Expected:** The visual route can be validated end to end.
- **Actual:** Focused fmt/lint/check for touched files passed, and Playwright browser validation on
  `/design/components` passed.
- **Severity:** minor
- **Action:** defer unrelated line-ending normalization; do not broaden Slice 8.
- **Evidence:** Slice 8 worklog gate table and `slice8-browser-report.json`.

## 2026-06-12 - standards-named fitness tool is not the removed skill shim

- **What:** Slice 10 reference checks still found `netscript-standards` in
  `.llm/tools/fitness/check-netscript-standards.ts`, `release-readiness.ts`, and a
  `packages/contracts/README.md` command.
- **Source:** Focused framework reference scan after deleting `.agents/skills/netscript-standards`.
- **Expected:** Remove the legacy skill shim and active guidance references to that shim.
- **Actual:** The remaining matches are a separate fitness evaluator filename and docs that invoke
  it; no active skill shim files or live instruction-file references remain.
- **Severity:** minor
- **Action:** defer any fitness-tool rename to a dedicated tooling slice; keep release-readiness
  stable for this cleanup.
- **Evidence:** Slice 10 worklog reference-check rows.

## 2026-06-12 - Deno publish dry-run sees pre-existing untracked Playwright directory

- **What:** Slice 11 `deno publish --dry-run` refused to run because the framework worktree had a
  pre-existing untracked `.playwright-mcp/` directory.
- **Source:** Deno dry-run error listed `?? .playwright-mcp/`.
- **Expected:** Run `deno publish --dry-run` without `--allow-dirty` from a clean tree.
- **Actual:** Added `.playwright-mcp/` to local Git exclude metadata only; did not delete, edit, or
  commit anything for that directory. Final dry-run passed with clean tracked status.
- **Severity:** minor
- **Action:** accept local exclude for this worktree; keep source tree unchanged.
- **Evidence:** Slice 11 worklog dry-run gate.

## 2026-06-12 - JSR audit parser preserves Deno slow-type banner as WARN

- **What:** `audit-jsr-package.ts` reports a WARN gate containing Deno's informational
  "Checking for slow types in the public API..." line.
- **Source:** `slice11-jsr-audit.json` has `slowTypes.ok=true` and 0 FAIL gates, but one WARN with
  the banner text.
- **Expected:** JSR audit passes when dry-run reports no slow types and public docs are complete.
- **Actual:** Treated as pass with a parser warning; the authoritative `deno publish --dry-run`
  succeeded without `--allow-dirty`.
- **Severity:** minor
- **Action:** defer parser cleanup; no package change needed.
- **Evidence:** `slice11-jsr-audit.json` and Slice 11 dry-run gate.

## 2026-06-12 - scaffold design routes need floating styles outside default install

- **What:** Slice 12 audit found that `floating-styles` is used by the playground design component
  demo but is not included by `DEFAULT_UI_INIT_ITEMS` or the `foundation` collection.
- **Source:** `packages/fresh-ui/registry.manifest.ts`, `packages/cli/src/public/features/ui/registry.ts`,
  and `apps/playground/routes/(design)/design/components.tsx`.
- **Expected:** A generated app that ships `/design/components` installs every CSS item required by
  that route through the registry installer.
- **Actual:** `floating-styles` must be installed explicitly or the collection/default install set
  must be expanded in a later locked scaffold slice.
- **Severity:** minor
- **Action:** defer to Slice 13/14; Slice 12 is audit-only.
- **Evidence:** `slice12-scaffold-fresh-ui-gap-report.md`.

## 2026-06-12 - generated app check can pass vacuously from the wrong cwd

- **What:** A Slice 13 generated-app `deno check --unstable-kv .llm/tmp/.../apps/dashboard`
  invocation from the repository root emitted "No matching files found" while returning exit 0.
- **Source:** Deno interpreted the root-relative generated app path as a non-matching target.
- **Expected:** Generated app checks must prove the scaffolded workspace type-checks.
- **Actual:** The no-match run was discarded; the command was re-run from the generated workspace
  as `deno check --unstable-kv apps/dashboard` and passed.
- **Severity:** minor
- **Action:** for scaffold smoke checks, run Deno from the generated project root or check for
  actual file targets in the output.
- **Evidence:** `slice13-scaffold-ui-init-smoke.md`.

## 2026-06-12 - impeccable product register reference absent

- **What:** The Impeccable skill requested `reference/product.md` for app/dashboard surfaces, but
  the reference file is absent in this checkout.
- **Source:** `Get-Content .agents/skills/impeccable/reference/product.md` failed during Slice 14
  setup.
- **Expected:** Load the product-register reference before visual/frontend implementation.
- **Actual:** Continued with the loaded general Impeccable guidance, frontend-design skill,
  fresh-ui conventions, existing playground implementation, and live browser route checks.
- **Severity:** minor
- **Action:** accept for this run; do not block Slice 14 on a missing skill reference file.
- **Evidence:** Slice 14 worklog and `slice14-design-routes-browser-report.md`.

## 2026-06-12 - reduced-motion browser emulation unavailable in local MCP

- **What:** Slice 14 local browser validation could not emulate `prefers-reduced-motion: reduce`.
- **Source:** The available local Playwright MCP exposed navigation, resize, click, evaluate,
  screenshots, snapshots, and console logs, but no media-emulation tool.
- **Expected:** Browser gate runs the generated design routes under reduced-motion media.
- **Actual:** Reduced-motion coverage used static CSS evidence (`@media (prefers-reduced-motion:
  reduce)` disabling transitions/transforms) plus successful route rendering; full media emulation
  remains for Slice 16 if a scriptable Playwright path is available.
- **Severity:** minor
- **Action:** record limitation; do not broaden Slice 14 into browser infrastructure repair.
- **Evidence:** `slice14-design-routes-browser-report.md`.

## 2026-06-12 - Playwright automation fallbacks for local generated app

- **What:** Deno Playwright and Firecrawl were not usable as the authoritative Slice 14 generated
  app browser gate.
- **Source:** `deno run -A npm:playwright` lacked the bundled Chromium executable; launching
  installed Chrome through Deno's npm shim failed with `The handle is invalid. (os error 6)`;
  Firecrawl's remote browser did not observe local app content at `127.0.0.1`.
- **Expected:** Use a Playwright route gate against the generated localhost app.
- **Actual:** Used the local Playwright MCP after clearing only its stale MCP Chrome profile
  processes; route title/content, console, theme flip, mobile overflow, and screenshots passed.
- **Severity:** minor
- **Action:** keep the local MCP evidence; revisit a pure-script Playwright harness in Slice 16 if
  needed.
- **Evidence:** `slice14-design-routes-browser-report.md`.

## 2026-06-12 - Slice 15 MCP theme-click limitation

- **What:** The generated app route screenshots and console checks passed through the Playwright MCP,
  but the click-capable MCP namespace could not attach to the same browser profile for the theme
  toggle interaction.
- **Source:** `mcp__mcp_server_playwright.browser_click` returned `Browser is already in use for
  C:\Users\chaut\AppData\Local\ms-playwright-mcp\mcp-chrome-a7ac91e`.
- **Expected:** Automated theme-toggle click on the generated `/design/composition` route.
- **Actual:** Captured route/mobile screenshots and console evidence through `mcp__playwright`;
  user manually verified the theme flip and route rendering.
- **Severity:** minor
- **Action:** Carry a scriptable isolated browser proof into Slice 16 e2e if the MCP profile remains
  locked.
- **Evidence:** `slice15-scaffold-pages-browser-report.md`.
