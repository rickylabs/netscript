# PLAN-EVAL cycle 1 — docs-changelog-0-0-7--1757

- Plan evaluator session: Claude Code — `https://claude.ai/code/session_01Qccb4kNXWBMY2Z2KiCadfj`, 2026-08-30
- Evaluator identity: Anthropic · Claude Fable 5 (`claude-fable-5`) · effort medium (requested via
  `formal_plan_evaluation`, `lane-policy.md:45`; effort is not observable from inside the session and is
  recorded as requested). Fresh native opposite-family session; generator was OpenAI GPT-5.6 Sol
  medium (`supervisor.md`, Codex thread `01a0522a-8eb8-7912-8dbb-526db23d711b`). Generator ≠ evaluator holds.
- Run: `docs-changelog-0-0-7--1757`
- Evaluated head: worktree `/home/agent/projects/netscript/worktrees/007-leaf-1757`, branch
  `docs/changelog-0-0-7` @ `13878a80a50c55b9662099fed64555f2310ae4a3` (= `origin/main`); run dir untracked, no
  product file modified.
- Surface / archetype: `packages/cli/CHANGELOG.md` — docs artifact, no package archetype (agreed)
- Scope overlays: `SCOPE-docs.md`
- Mutations by this session: this file only. No plan/worklog/changelog/lockfile/label/issue/GitHub change.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselines against `origin/main` `13878a80`; re-derived: `HEAD == origin/main`, `git rev-list --count v0.0.6..origin/main` = 33, `CHANGELOG.md` has only `## 0.0.6`, `v0.0.7-canary.{1,2,3}` tags are not ancestors of `main` (no effect on the range). Load-bearing findings 5–8 spot-checked against the tree (see Notes §B). |
| Decisions locked                        | FAIL   | D1/D3/D4/D5 are stated with rationale. D2 locks a *count* ("eight plain bullets") but neither `plan.md` nor `worklog.md ## Design` contains the eight bullets or a commit→bullet map. A count without content is not a locked editorial decision (F2). D1's rule is also applied inconsistently to the shipped agent-tool bundle (F1). |
| Open-decision sweep                     | FAIL   | `plan.md` Open-Decision Sweep marks "Final bullet wording — must resolve now" and then defers it to PLAN-EVAL without resolving it. A must-resolve-now item left open is an unchecked box by `plan-gate.md` ("If any open decision would force rework when deferred → FAIL_PLAN"). Evaluator sweep found one further unflagged decision (F1). |
| Commit slices (< 30, gate + files each) | PASS   | One slice, ordered, names proving gates (five required tasks + diff/lock review) and files — `worklog.md ## Design › Commit Slices`. Note the slice table lives in `worklog.md`, not `plan.md`; acceptable, but the same table should not diverge between the two. |
| Risk register                           | PASS   | `plan.md ## Risk Register` — five risks with mitigations. The realised risk "misleading subject causes an omission" (F1) is listed; its mitigation ("read actual diffs for ambiguous commits") was not applied to the barrel-regenerating commits. |
| Gate set selected                       | PASS   | `plan.md ## Validation Plan` rows 1–7; `SCOPE-docs.md` gates (source alignment, scope separation, link integrity, terminology, drift log) are covered by rows 1, 7 and `drift.md`. Archetype gate matrix N/A (no archetype). Research finding 7 correctly records that `docs:links`/`docs:readme:check` do not validate the changelog — verified (`check-internal-doc-links.ts:18-28,102-114`; `check-readme-standard.ts:179`). |
| Deferred scope explicit                 | PASS   | `plan.md ## Non-Scope` and `## Deferred Scope`; release-introduction boundary verified at `.llm/tools/release/github-release.ts:18-23`. |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `research.md ## jsr-audit surface scan` — docs-only; no `packages/`/`plugins/` source, manifest, export, or dependency change. Reason accepted. |

## Open-decision sweep (evaluator-run)

Two decisions would force rework if deferred. Both are unresolved in the plan.

**F1 — The triage does not account for the shipped `agent init` tool bundle (unflagged; must resolve now).**

`packages/cli/src/kernel/assets/agent-tools.generated.ts` is a published CLI asset. Its only consumer is
`packages/cli/src/public/features/agent/init/init-agent.ts:9-12,76-78`, i.e. `netscript agent init`
installs the embedded files under a consumer project's `.llm/tools/` (`consumer-tools.json`
`installRoot: ".llm/tools"`). The embedded sources are `run-deno-check.ts`, `run-deno-lint.ts`,
`run-deno-doc-lint.ts`, `quality/scan-code-quality.ts`, `validation/check-aspire-host-ports.ts`,
`deps/outdated.ts`, `deps/why.ts`, `docs/snippet-extractor.ts`, `e2e/scaffold-e2e-test.ts`. Five commits
in the range regenerate that barrel with real behaviour deltas in the embedded tools, and the plan
excludes four of them as "internal/harness tooling" while including the fifth for a different reason:

| Commit | Plan decision | What actually ships through `agent init` (diff-inspected) |
| --- | --- | --- |
| `f7ad44dc` | Exclude ("harness orchestration") | `run-deno-check.ts`: batches that fail without parseable diagnostics are now reported and exit 1 in every source mode (previously only in `selection` mode). |
| `01e09604` | Include (only for `--skip-apphost`) | `run-deno-check/lint/fmt/test.ts` gain `--output <path>` atomic JSON report writing; `scan-code-quality.ts` skips generated/vendor dirs (`.deno`, `_site`, `node_modules`, …). Not mentioned by the plan. |
| `473e8d75` | Exclude ("comments only") | `packages/`/`plugins/` edits are indeed comment-only, **but** `scan-code-quality.ts` gains `public-any` / `public-export-unresolved` rules and fail-closed allowance-owner verification against GitHub; `consumer-tools.json` permissions change from `["read"]` to `["read","env","net"]`. |
| `cf648f1f` | Exclude ("no consumer behavior") | `run-deno-lint.ts` honours `.deno-fmt-lint-ignore` subtree markers and batches by nearest `deno.json(c)`. |
| `3b32d162` | Exclude ("not published product behavior") | `run-deno-lint.ts` fails closed with a `coverage` report when Deno processes fewer files than selected (`partial-exclusion`, `processed-count-unavailable`, …). Its own PLAN-EVAL history (`cf648f1f` cycle 2) states the lint wrapper "is embedded in the published CLI agent-tools barrel … a CLI publish delta". |

By the plan's own D1 rule (consumer observability, not prefix) and the plan's own `01e09604` exemplar
("a `ci:` subject that is consumer-visible"), these are the same false-negative class the plan says it
guards against. The generator cannot proceed until it locks one of:

- (a) **Include** — add a bullet for the `agent init` tool bundle (recommended: the 0.0.6 precedent
  records observable CLI behaviour, and `agent init` is a CLI command whose installed tools changed
  materially, including a new `net` permission requirement); or
- (b) **Exclude by rule** — lock an explicit editorial decision that the embedded agent-tool bundle is
  out of the CLI changelog's remit, with rationale, and apply it consistently (which then also
  requires re-justifying why `01e09604` is included only for `--skip-apphost`).

Either is acceptable; leaving it implicit is not, because it changes the bullet set (and the count D2 locks).

**F2 — The eight bullets and the commit→bullet mapping do not exist (flagged by the plan as must-resolve-now, left open).**

The brief asks this evaluator to "independently challenge … the planned grouping into eight
user-facing bullets" and the plan asks PLAN-EVAL to "challenge traceability, grouping, and consumer
vocabulary before implementation". There is no grouping to challenge: `plan.md`, `worklog.md`,
`context-pack.md`, `research.md` and `drift.md` contain no draft bullets and no table saying which of
the 13 included commits fold into which bullet. Traceability (issue #1757 acceptance: "every bullet
corresponds to a real merged change") is a plan-level property of the grouping; if it is first
decided during implementation, a wrong grouping is discovered by IMPL-EVAL and forces a rewrite — the
exact rework the Plan-Gate exists to prevent. Required: add to `plan.md` (or `worklog.md ## Design`)
a table `bullet # → included commits → draft wording`, one row per bullet, with every clause
traceable to a listed commit. The count may legitimately change after F1 is resolved.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **Decisions locked / open-decision sweep (F1)** — Re-triage `f7ad44dc`, `01e09604`, `473e8d75`,
   `cf648f1f`, `3b32d162` under the shipped-agent-tool-bundle lens (diff
   `packages/cli/src/kernel/assets/agent-tools.generated.ts` and the embedded sources, not the
   `packages/` comment edits). Record the decision (include-with-bullet, or exclude-by-locked-rule) in
   `plan.md` Locked Decisions and update the corresponding worklog triage rows and reasons so the reasons
   are true (e.g. `473e8d75` "source edits change comments" is true of `packages/` but not of the shipped scanner).
2. **Open-decision sweep (F2)** — Resolve "Final bullet wording" in the plan: enumerate the bullets
   with draft wording and a commit→bullet map covering all included commits. Do not leave it "for
   PLAN-EVAL"; PLAN-EVAL judges the mapping, it does not author it.
3. **Traceability constraints for the mapping** (so the next cycle can PASS in one pass):
   - `3561bb64` bullet must state plainly that the package root **stops exporting** the
     `DenoMySqlClient`, `DenoMySqlConnection`, `ExecuteResult` types (`src/mod.ts` diff) and narrows
     `PrismaMySqlResultSet.columnTypes` — "tighter public types" alone hides a removal, contrary to D3's
     honesty standard. `toMysql2PoolOptions` is exported from `src/adapter.ts` only, not the root; do not describe it as public.
   - `01e09604` bullet must describe `--skip-apphost` as an argument forwarded through the generated
     `check|lint|fmt-check` tasks (`quality-runner.ts`; the e2e gate calls `deno task check --skip-apphost`);
     it is not a new task and is not wired into the scaffolded `deno.json` tasks (`templates/workspace/deno-json.ts` unchanged by that commit).
   - `c73d361e` bullet must carry all three breaking facts verified in the commit body: failure payload
     `null → undefined`, default `TError` `unknown → Error`, `safe()` rejects non-Promise thenables.

## Notes

### A. Contested-commit verdicts (diff-inspected)

- `01e09604` **include — upheld**, with the F1 caveat that the plan understates it.
- `3561bb64` **include — upheld**; it is not prose-only (see fix 3). The `@deprecated verify_identity`
  TLS selector with unchanged runtime is correctly characterised.
- `2dd1a75e` **exclude — upheld.** `packages/contracts` changes are four JSDoc example import
  specifiers (`@netscript/contracts` → `/query`, `/transform`) in comments; the rest is the
  reference-drift gate (`.llm/tools`), the Fresh UI reference page rewrite (`docs/site`), corpus
  regeneration, and 70+ run-artifact files. No shipped behaviour.
- Harness commits touching `.agents/skills/` / `.claude/skills/` (`f7ad44dc`, `dd472102`, `01e09604`,
  `211e8257`) — **exclude upheld on the skills axis**: shipped skills come from
  `packages/cli/src/kernel/assets/skills.generated.ts` (generator source `.llm/tools/../skills/`, not
  `.agents/skills/`), and that file is untouched in `v0.0.6..origin/main` (0 commits). The barrel
  axis of `f7ad44dc`/`01e09604` is F1.
- `473e8d75`, `cf648f1f`, `3b32d162` — see F1. The `packages/`/`plugins/` and `packages/mcp`
  edits in these commits are comment/test/fixture-only as the plan says; the shipped tool sources are not.
- `e090f894`, `729386c5` — exclude upheld: `docs/site` comparison content plus corpus regeneration; the plan's
  "corpus-only refresh" vocabulary covers the `agent-docs.generated.ts` cascade consistently.
- `cd720529` — exclude upheld: `packages/cli/e2e/*` and Redis test tweaks are test infrastructure.
- Remaining 9 includes (`0b3ed5d5`, `da574111`, `6917c656`, `3fc0f2f9`, `baf1cdf6`, `3e8e146a`,
  `0ef48c2e`, `21d51622`, `8b1e42f7`, `13878a80`) — spot-checked `0b3ed5d5`, `6917c656` (registry
  total 50 → 66, collections type), `8b1e42f7` (declared-reference preflight throws before processor
  registration), `13878a80` (skills installed to `.agents/skills`, guidance from embedded template);
  each is a shipped CLI/package behaviour change. Upheld.

### B. Boundary verifications

- **Changelog is not a generator input — confirmed.** `grep -rln CHANGELOG .llm/tools .github/workflows deno.json`
  returns nothing; `build-agent-docs-bundle.ts:254-310` rebuilds site-owned corpus entries from rendered
  `docs/site/_site` `index.md`/`llms*.txt` only; `generate-publish-assets.ts` `PUBLISH_ASSET_OUTPUTS` is a
  closed list (lines 34-54) that does not include the changelog. D4 (no regeneration) is sound.
- **Release-introduction boundary — confirmed** (`github-release.ts:18-23`, "MANUAL BY DESIGN"). Plan
  Non-Scope, drift entry and issue #1757 agree; no intro prose is planned.
- **Gate scope — confirmed** as research finding 7 states: none of `docs:links`, `docs:readme:check`,
  `check:publish-assets`, `check:assets-barrel`, `check:agent-docs-prose` reads the changelog; they are
  regression/no-churn gates only. Validation row 1 (manual traceability) is therefore the only gate on
  the deliverable's content, which is why F2 must be settled at plan time.
- **Baseline drift** — none: `origin/main` still `13878a80`.

### C. Advisories (non-blocking)

- The Commit Slices table exists only in `worklog.md ## Design`; `plan.md` has no slice table. Keep one canonical copy.
- `context-pack.md` step 2 says "Add the eight consumer-facing changelog bullets" — update when the count is re-derived.
- Loop status: cycle 1 of 2.
