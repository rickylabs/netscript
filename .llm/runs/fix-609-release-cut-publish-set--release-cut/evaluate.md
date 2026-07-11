# Evaluation: fix-609-release-cut-publish-set (release-cut gap audit)

Result values: `PASS`, `FAIL`, `N/A`. Verdict is a single terminal value.

## Metadata

| Field          | Value                                                    |
| -------------- | -------------------------------------------------------- |
| Run ID         | `fix-609-release-cut-publish-set--release-cut`           |
| Target         | PR #612 — commits `43ef2e61`, `e6d8b713`, `ff5383a8`     |
| Archetype      | 6 — CLI / Tooling (harness release tooling, nominal)     |
| Scope overlays | none (markdown is inspected input, not docs-content)     |
| Evaluator      | Claude Opus 4.8, separate opposite-family IMPL-EVAL — 2026-07-11 |

## Process Verification

| Check                                  | Result | Evidence |
| -------------------------------------- | ------ | -------- |
| Plan-Gate passed before implementation | PASS   | `plan-eval.md:2` `PASS` (cycle 2, separate Claude session); impl commits `e6d8b713`/`ff5383a8` post-date the plan commit `43ef2e61`. |
| Design section exists in worklog       | PASS   | `worklog.md:3-41` — public surface, domain vocabulary, ports (filesystem-only), constants, commit slices, contributor path. |
| Commit slices match design plan        | PASS   | 3 commits map to the 3 planned slices: plan (`43ef2e61`) → publish+markdown audit (`e6d8b713`) → cut gating (`ff5383a8`). Order matches `plan.md:20-25`. |
| Each slice has a passing gate          | PASS   | Reproduced below (release suite 23/23, scoped check/lint/fmt clean, safe audit CLI, lock unchanged). |
| No speculative seams (unused files)    | PASS   | `preflight-release.ts` exported functions all consumed by `runReleasePreflight` + tests; `cut.ts` imports and calls `runReleasePreflight`. No dead files. |
| Constants used for finite vocabularies | PASS   | `PUBLISH_PARENT_DIRS`, `JSR_SCOPE`, `DEFERRED_MARKDOWN_PREFIX`, `MARKDOWN_PIN_PATTERN`, `INTENTIONAL_PUBLISH_EXCLUSIONS` (`preflight-release.ts:38-51`). |

## Static Gates

| Gate            | Command | Result | Evidence |
| --------------- | ------- | ------ | -------- |
| Typecheck       | `deno check --unstable-kv preflight-release.ts preflight-release_test.ts cut.ts` | PASS | 3 files checked, 0 errors. |
| Format          | `deno fmt --check` (3 changed files) | PASS | "Checked 3 files", 0 diffs. |
| Lint            | `run-deno-lint.ts --root .llm/tools/release --ext ts` | PASS | 21 files, 0 occurrences (matches `worklog.md:53`). |
| Tests           | `deno test --no-lock -A .llm/tools/release/` | PASS | 23 passed / 0 failed (matches `worklog.md:51`). |
| Publish dry-run | n/a to this diff | N/A | Tooling-only; no `packages/**` `mod.ts`/exports/JSDoc touched. |

## Fitness Gates (Archetype-6)

F-CLI-* and universal package fitness gates target doctrine-governed `packages/**`/`plugins/**`
source. This diff is confined to `.llm/tools/release/**` harness scripts + run artifacts — **N/A**.
`console.log`/`console.warn` in `runReleasePreflight` is release-tool output, not a `packages/` CLI
surface, so F-CLI-26/F-14 do not apply. No package/plugin source changed (`git diff --name-only`).

## Release-Gate Class (protocol rule 14)

| Gate             | Result | Evidence |
| ---------------- | ------ | -------- |
| `scaffold.runtime` | N/A  | This run does not perform a cut, publish, tag, or Release, and changes no scaffold output or published CLI/plugin runtime shape (`.llm/tools/release/**` only). Rationale stated `plan.md:34`, confirmed by name-only diff. |
| `e2e-cli-prod`     | N/A  | Same — no published-CLI runtime shape change; nothing for the prod E2E to exercise. |

The tooling-only `n/a` disposition is sound: the diff cannot affect scaffold or published runtime
behavior, so these expensive gates have no surface to verify here. (This run *adds* the audit that
gates future cuts; it is not itself a cut.)

## Correctness Verification (independently reproduced)

| Property | Result | Evidence |
| -------- | ------ | -------- |
| Intended set discovered independent of `publish:false` | PASS | `discoverIntendedMembers` (`preflight-release.ts:145-162`) reads each `deno.json` `name` directly and never inspects `publish`; effective set (`discoverWorkspaceMembers`) drops `publish===false` (`publish-workspace.ts:267`). A silent opt-out therefore surfaces as `missing`. Unit test `preflight-release_test.ts:4-24` proves a `publish:false` member lands in `intended` but not `effective` → `missing`. |
| All three AI surfaces present in effective set | PASS | Safe beta.6 audit against real tree lists `@netscript/ai (packages/ai)`, `@netscript/plugin-ai-core (packages/plugin-ai-core)`, `@netscript/plugin-ai (plugins/ai)` among 34 members. All three carry object `publish:{…}` (not `false`), verified via `deno.json` grep. |
| Explicit bench exclusion | PASS | `packages/bench` `deno.json` has `"publish": false`; recorded in `INTENTIONAL_PUBLISH_EXCLUSIONS` with a durable reason (`preflight-release.ts:46-51`). Empty-reason exclusions rejected (`validateExclusions`; test `:26-33`). Audit shows `EXCLUDED packages/bench …` and 0 unexplained deltas. |
| Non-release workspaces excluded | PASS | `PUBLISH_PARENT_DIRS = [packages, plugins]` scans direct children only, so `examples/*`, `apps/*`, and nested `packages/cli/e2e` are outside both sets — matches `research.md:9`. |
| Markdown semver ordering (strictly-behind only) | PASS | `compareSemver >= 0 → skip` (`:96`); only strictly-behind pins are violations. Traced prerelease/prerelease (beta.4<beta.6), prerelease/stable (stable > prerelease → returns `1`), alpha<beta cases — all correct. Test `:50-72` confirms stale beta.4 flagged, neutral (no pin) ignored, alpha.0 under `docs/site/` deferred. |
| Markdown pattern + path behavior | PASS | Pattern restricts to `@netscript/<pkg>@^?0.0.1-<channel>.<n>` (deliberately narrow to avoid prose false positives — `plan.md:38`). `docs/site/` prefix → `deferred`, everything else → blocking `violations`. History/scratch/cache trees skipped (`:83-89`). Real audit: 1 deferred (`docs/site/reference/plugin-ai/index.md:86` @0.0.1-beta.1), 0 blocking. |
| Cut ordering | PASS | `cut.ts:343` calls `runReleasePreflight` **after** `coordinateVersionBump` (`:331`) and `findVersionResidue` (`:334`), and **before** the three expensive gates (`:345-347`) and `createReleasePr` git mutation (`:354`). Matches `worklog.md:68`. |
| Lock hygiene | PASS | `git diff --exit-code origin/main -- deno.lock` → exit 0. Name-only diff = run artifacts + 3 release-tool files; no `packages/**`/`plugins/**`/`deno.lock` churn. |

## Anti-Pattern Check

| AP | Status | Evidence |
| -- | ------ | -------- |
| AP-1 (monolith) | CLEAR | `preflight-release.ts` 239 LOC, single-purpose pure audits + a thin printer. |
| AP-2 (reuse) | CLEAR | Reuses `discoverWorkspaceMembers`/`PublishableMember` from `publish-workspace.ts` for the effective set rather than re-deriving. New `preflight-release.ts` is a distinct surface (publish-set + markdown pins) from `preflight-text-imports.ts` (TS text-import scan) — the plan-eval overlap advisory is resolved: no duplicated scan. |
| AP-11/AP-25 (edge IO) | CLEAR | `Deno.readDir`/`readTextFile`/`walk` confined to the tool module; no network/registry port, matching design (`worklog.md:16-17`). |
| AP-18 (string-snapshot tests) | CLEAR | Tests assert semantic deltas (`missing`, `violations` path/line), not output snapshots. |
| Others | N/A | Package/plugin doctrine surfaces untouched. |

## Arch-Debt Delta

| Metric | Count | Evidence |
| ------ | ----- | -------- |
| New / Resolved / Deepened / Unrecorded | 0 | No doctrine-governed source changed; no debt entry required or introduced. |

## Findings

| Severity | Finding | Evidence | Required action |
| -------- | ------- | -------- | --------------- |
| low (advisory) | Markdown matcher is intentionally narrow: only `@^?`/bare specifiers and a single-segment `0.0.1-<channel>.<n>` core. Stable pins and other range operators (`~`, `>=`) are not scanned. | `preflight-release.ts:41` | None — consistent with the false-positive risk mitigation (`plan.md:38`) and the beta.6 owned surface. Widen only if repo pin conventions change. |
| info | Merge close-gate is a pre-merge supervisor obligation. PR #612 carries `Closes #609` (`worklog.md:84`); before `status:ready-merge`, verify #609 acceptance criteria + each `gate:` box are checked with linked evidence. | protocol rule 12 | Supervisor action at merge; not an implementation defect. |

## Verdict

| Field | Value |
| ----- | ----- |
| Verdict | **PASS** |
| Rationale | Approved scope is complete and correct. Plan-Gate passed in a separate session before implementation; design checkpoint present; slices ordered per plan. Independently reproduced: 23/23 release tests, clean scoped check/lint/fmt, `deno.lock` unchanged, and the safe beta.6 audit enumerating 34 effective members with all three AI surfaces, an explicit reasoned `packages/bench` exclusion, 0 unexplained deltas, and 0 blocking / 1 deferred markdown pin. The intended set is genuinely computed independent of `publish:false`; semver, pattern, path, and cut ordering behave as specified. Fitness and release-gate classes are validly `n/a` for a tooling-only diff touching no `packages/**`/`plugins/**` source. No doctrine violation, no debt, no lock churn. Two non-blocking advisories recorded. |
