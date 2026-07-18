# IMPL-EVAL: PR #812 — mandatory canary publish gate (#811)

## Metadata

| Field     | Value |
| --------- | ----- |
| Subject   | `feat/811-release-canary` @ `ddd4242e`, worktree `/home/codex/repos/b10-canary` |
| Base      | PR base `main` @ `a5adb706`; **origin/main has moved to `aa14e452`** (includes #810 merge `8a8a9537` and #817) |
| Evaluator | Claude · Fable 5 · medium (supervisor-dispatched, `review_codex_complex` route), session separate from generator |
| Date      | 2026-07-17 |
| Verdict   | **FAIL_FIX** |

## Verdict rationale

The plan and design are sound and almost everything is independently verified green. Two coupled
defects block a pass, both caused by base drift against `origin/main`:

1. **Acceptance item "seeded import attribute — proven-to-fail" is NOT met on the evaluated head.**
   `publish-readiness.ts` correctly delegates to the canonical `release:preflight` (no duplication,
   per design), but #810's actual `import-attributes` detector (regex `\bwith\s*\{\s*type\s*:` with
   the denoland/deno#35546 sunset message in `preflight-text-imports.ts`) landed on `origin/main`
   in `8a8a9537` — **after** this branch's base. On this branch, that file has no import-attribute
   check. Live probes on the branch head: a seeded `with { type: "text" }` import and a seeded
   `with { type: "json" }` import in `packages/config/mod.ts` **both PASS** `deno task
   publish:readiness` (`import-attribute-preflight: PASS`, `ok: true`, exit 0). The generator's
   unit test ("calls canonical preflight for a seeded text import and carries #810 sunset") mocks
   `runCanonicalPreflight` to throw, so it proves error-message composition only — not detection.
2. **The branch does not merge cleanly with current main.** A throwaway `git merge aa14e452`
   produced content conflicts in `.llm/tools/release/cut.ts`,
   `.agents/skills/netscript-release/SKILL.md`, and `.claude/skills/netscript-release/SKILL.md`.
   The merged tree *does* contain the detector (branch never touches
   `preflight-text-imports.ts`), so the delegation design heals itself post-rebase — but the
   conflicts mean the rebase is manual and the seeded-attribute probe must be re-proven live on
   the rebased head.

Required fix (narrow; plan remains valid): rebase onto current `origin/main`, resolve the three
conflicts, then re-run (a) the seeded `with { type: "text" }` live probe expecting
`import-attribute-preflight: FAIL` with the #35546 sunset message, and (b) the release + agentic
test suites.

## Numbered findings

**F1 (blocking).** Seeded import-attribute violation passes `publish:readiness` on the evaluated
head. Evidence: two live probes (text and json attribute in `packages/config/mod.ts`) →
`{"id":"import-attribute-preflight","status":"PASS"}`, `{"ok":true}`. Root cause: base drift —
#810's `import-attributes` check exists only on `origin/main` (`aa14e452:
.llm/tools/release/preflight-text-imports.ts` lines 88–97), not on this branch. Issue #811
acceptance box "a seeded import attribute … proven-to-fail" is unmet.

**F2 (blocking).** Merge conflicts with current `origin/main` in `cut.ts` and both
`netscript-release/SKILL.md` copies (verified in a disposable worktree; merge aborted, worktree
removed). Rebase required before `status:ready-merge`; the close-gate on #811 cannot be checked
off until F1 is re-proven on the rebased head.

**F3 (note, non-authorizing artifacts).** The PR body and run dir carry a generator-arranged
IMPL-EVAL PASS (OpenRouter/Qwen session `a06700df-…`, `evaluate.md` in
`.llm/runs/feat-811-release-canary--canary-readiness/`). Per supervisor policy
(supervisor-triggered eval is the only authorizing verdict), these are noted and not relied on.
Credit where due: the run's `drift.md` honestly records two discarded invalid evaluator launches
and a rejected closed-model delegation attempt.

**F4 (verified green — canary derivation, probe 1).** `release:canary` exists
(`.llm/tools/release/canary.ts`, task in `deno.json`). `deriveCanaryVersion` takes the maximum
`-canary.N` across **all** workspace members' JSR metadata (yanked included, since `meta.json`
keys retain yanked versions) plus git tags as collision guard, and fails closed on non-404
registry errors. Unit-verified: max-across-members (`…canary.9` → `.10`), tag guard
(`v0.0.2-canary.4` → `.5`), new-package `null` tolerance, fail-closed lookup. Stable-target
validation rejects prerelease/build-suffix targets. Gate logic is shared via
`prepareRelease()` (`prepare-release.ts`) — `cut.ts` was refactored onto the same helper, no
copy-paste drift; version-ordering validation is preserved inside
`coordinateVersionBump → validateNewerVersion`.

**F5 (verified green — workflow, probe 2).** `release-canary.yml`: contract tests pass
(`release-canary-workflow_test.ts`, 3/3). Same OIDC publish path as production — identical
`run-publish.ts --dry-run / --preflight / real` sequence as `publish.yml`; no reimplementation.
Never creates a GitHub Release, so `make_latest` cannot occur. Auto-dispatches `e2e-cli-prod.yml`
at the canary tag with `inputs[published-version]=<canary>`, captures the run id via
`return_run_details=true` (real API parameter, GitHub changelog 2026-02-19; gh ≥ 2.87.0 on
runners), awaits it with `gh run watch --exit-status`, posts the `release/canary-pair` commit
status (pending → success/failure, fail-closed) on the pre-bump content SHA, and writes a
green-pair verdict block to `$GITHUB_STEP_SUMMARY`.

**F6 (verified green — readiness, probe 3, except F1).** Clean tree: `deno task
publish:readiness` → 9 structured checks, all PASS, exit 0 (35 effective members). Seeded
versionless specifier (`jsr:@netscript/config` without version) → `versionless-specifiers: FAIL`,
exit 1. Seeded new workspace package without README → `new-packages` detects it from JSR metadata,
`first-publish: FAIL` (`readme-missing`, `docs-reference`), exit 1; README-section/tagline/
license/exports rules additionally unit-proven (`publish-readiness_test.ts`). Import-attribute
delegation carries the #35546 sunset message verbatim; detection itself is F1.

**F7 (verified green — stable-side enforcement, probe 4).** `release:publish`
(`github-release.ts::verifyGreenCanaryPair`) fails closed without a green `release/canary-pair`
status: exact-SHA match, or inheritance by a version-only child whose every changed file is a
byte-exact coordinated version replacement of its parent (parent must hold the status); any other
delta throws. `publish.yml` independently runs `release:verify-canary-pair` plus
`publish:readiness` before publishing (fetch-depth 0 for the HEAD^ inspection; `statuses: read`
added). Skill source and generated mirror are byte-identical (`diff` exit 0) and carry the
mandated language: "no `release:publish` without a green canary pair", ad-hoc publishing
prohibited, canary immutability + yank policy.

**F8 (verified green — c772b50e regression, probe 5).** GitHub response-body narrowing: agentic
lib suite 63/63 PASS; full release suite 59/59 PASS (122/122 combined, independently witnessed —
matches the PR claim).

**F9 (verified — owner actions, probe 6).** The PR-body owner items are real requirements, not
hand-waving: the workflow needs `actions: write` (dispatch), `statuses: write` (commit status),
`contents: write` (push canary branch/tag) effective at runtime (org/repo policy can cap the
workflow-level `permissions:` block); `JSR_API_TOKEN` package-edit scope is required by
`jsr-provision-packages.ts` for first publishes; JSR package↔repo linking is a hard OIDC publish
precondition; the first live canary pair has genuinely not run (correctly not claimed as run).

**F10 (minor, non-blocking).** New endpoint constants live in
`.llm/tools/release/config/endpoints.ts` rather than the `.llm/tools/agentic/config/` volatile-
values home. Defensible for the release toolbelt (single maintenance point, documented header),
but worth confirming the hardcoding guard test covers the release tree, or consolidating later.

## Gate evidence summary

| Gate | Result | Evidence |
| ---- | ------ | -------- |
| Release test suite | PASS 59/59 | `deno test .llm/tools/release/` witnessed this session |
| Agentic lib suite | PASS 63/63 | `deno test .llm/tools/agentic/lib/` witnessed this session |
| `publish:readiness` clean tree | PASS exit 0 | 9/9 checks PASS, live run |
| Seeded versionless specifier | FAIL as required | live probe, exit 1 |
| Seeded new package w/o README | FAIL as required | live probe, exit 1 |
| Seeded import attribute | **PASS — must FAIL** | live probes ×2 → **F1 blocking** |
| Mergeability vs origin/main | **CONFLICT** | cut.ts + 2× SKILL.md → **F2 blocking** |
| Skill mirror sync | PASS | byte-identical diff |
| Workflow contract tests | PASS 3/3 | `release-canary-workflow_test.ts` |
| Working tree after probes | clean | `git status --porcelain` empty |

## Verdict

**FAIL_FIX** — plan valid; rebase onto current `origin/main` (resolve `cut.ts` + skill-doc
conflicts), then re-prove the seeded import-attribute probe live (expect
`import-attribute-preflight: FAIL` with the #35546 sunset message) and re-run the 122-test suite.
No rescope and no debt action required. Eval-loop count for this slice: 1.

## Cycle 2

| Field     | Value |
| --------- | ----- |
| Subject   | `feat/811-release-canary` @ `64184deb` (merge commit "integrate main for canary preflight repair"), worktree `/home/codex/repos/b10-canary` |
| Evaluator | Claude · Fable 5 · medium (`review_codex_complex`), separate session, supervisor-dispatched |
| Date      | 2026-07-17 |
| Verdict   | **PASS** |

Scope: verify cycle-1 blocking findings F1/F2 are cured plus regression sweep. All probes run
live by this evaluator in the worktree; tree restored clean after every seed.

**C2-1 (F1 CURED — seeded import attribute now proven-to-fail live).** Seeded
`import seededProbe from "./deno.json" with { type: "text" };` into `packages/config/mod.ts` →
`deno task publish:readiness` exits 1 with
`{"id":"import-attribute-preflight","status":"FAIL"}` and the failure detail carries both the
denoland/deno#35546 sunset criterion ("fixed, merged, and released, and an authenticated canary
publish of a text-import probe is green") and the "generated TypeScript constant" guidance,
verbatim from the branch's own `preflight-text-imports.ts` (lines 89–97, present via the main
merge). Unit test `publish-readiness_test.ts:211` ("exercises the real preflight for a seeded
text import") now spawns the REAL `preflight-text-imports.ts --file <seeded>` subprocess — the
cycle-1 mocked-throw is gone. Companion probes: seeded versionless `jsr:@netscript/telemetry`
specifier → `versionless-specifiers: FAIL`, exit 1; seeded new workspace package
(`packages/probe-seed`) with a nonconforming README → `new-packages: PASS` (detected),
`first-publish: FAIL` with `readme-docs-section` / `readme-install-section` /
`readme-quick-section` / `readme-h*` rules, exit 1. All seeds removed; clean-tree
`publish:readiness` back to green (8/8 PASS, 0 FAIL, exit 0; `git status --porcelain` empty).

**C2-2 (F2 CURED — main integrated, both content streams kept).** `git fetch origin main` then
`git merge-base --is-ancestor origin/main HEAD` → true (origin/main `aa14e452` is an ancestor of
`64184deb`). `.agents/skills/netscript-release/SKILL.md` retains BOTH streams: canary-first
workflow (mandatory canary pair, `release/canary-pair` status, immutability/yank policy) AND
main's same-semver recovery (§"Exact-version resolution and same-semver recovery"),
`--minimum-dependency-age=0` guidance, and the #810 canonical-preflight sunset. Mirror
`.claude/skills/netscript-release/SKILL.md` is byte-identical (`diff -r -q` clean);
`validate-claude-surface.ts` → `{"gate":"agentic:check-claude","ok":true}` incl.
"agentic:sync-claude OK: 17 skill(s), 21 mirrored file(s)". `cut.ts` conflict resolution
verified: refactor onto shared `prepareRelease()` preserves every main-side gate — coordinated
bump, `gen:publish-assets`, version-residue check, canonical `release:preflight` (now reached
via the `publish:readiness` `import-attribute-preflight` check, single owner per design),
`publish:dry-run`, `deno ci --prod`, plus main's `githubField` response-body narrowing.

**C2-3 (regression sweep green).** Release-tools suite: `deno test .llm/tools/release/` →
61 passed / 0 failed (up from 59; the two additions are the real-preflight test and canary-pair
coverage). Clean-tree `publish:readiness` exit 0. Skim of `64184deb` merge diff and of
`git diff aa14e452..HEAD --stat` (55 files, +3575/−177): branch delta is exactly the canary
feature set (canary.ts, prepare-release.ts, publish-readiness.*, verify-canary-pair.*,
release-canary workflow + tests, skills, run artifacts); nothing from main dropped.

### Cycle 2 verdict

**PASS.** Both cycle-1 blocking findings are cured with live evidence on the merged head; no
regressions found. F10 (endpoints constants home) remains a non-blocking note. Close-gate
reminder for the merger: check the #811 acceptance/gate boxes with links to this evidence before
`status:ready-merge`. Eval-loop count for this slice: 2.
