# Inventory — non-agentic `.llm/tools/`

Baseline: `b13ca0fa` (`main`, 2026-07-11). Survey: 59 files / 55 TypeScript files / 12,988 TypeScript LOC. Full basename-to-reference evidence was captured in `.llm/tmp/llm-tools-cleanup/reference-matrix.tsv`; the maintained disposition is below.

## Disposition rules

- KEEP when a file has a task, import, workflow, hook, AGENTS, harness, skill, or maintained-doc consumer.
- DELETE only when it has no import/task/workflow/dynamic-path consumer and no owner-authority mention. Under the owner heuristic, absence from harness + AGENTS + skills makes a whole surface a legacy candidate.
- MOVE only when concern grouping materially improves navigation; preserve basename and update every whole-repo importer.
- Ambiguity resolves to KEEP and is listed for owner review.

## Per-folder inventory

| Folder / files | Initial disposition | Evidence and rationale |
| --- | --- | --- |
| `deps/`: `audit-file-link.ts`, `audit.ts`, `bump-version.ts`, `bump-version_test.ts`, `census.ts`, `latest.ts`, `outdated.ts`, `prod-install.ts`, `prod-install_test.ts`, `scan-jsr-centralization.ts`, `scan-npm-catalog-compliance.ts`, `why.ts`, `workspace.ts` | KEEP; consider concern subfolders only after import audit | AGENTS and both tooling skills make `deps:*` the mandatory dependency evidence surface; every entry is task-, test-, workflow-, or internal-import reachable. `workspace.ts` is also imported by release tooling. |
| `docs/`: `check-caveat-refs.ts`, `check-internal-links.ts` | KEEP (ambiguous owner keep) | Live `docs/site/deno.json` tasks. No harness/AGENTS/skill mention, but deleting would break a maintained consumer; similarly named root validation is not equivalent because roots/output contracts differ. |
| `e2e/`: `scaffold-e2e-test.ts` | DELETE candidate | Zero task/import/workflow/AGENTS/harness/skill reference. Only self-index/old package README mentions. The canonical maintained path is `deno task e2e:cli` and `packages/cli/e2e`; this 1,583-LOC predecessor is superseded. Final exact path/basename scan required immediately before delete. |
| `fitness/`: `audit-jsr-package.ts`, `check-doctrine.ts`, `check-ds-color-utilities.ts`, `check-ds-gates_test.ts`, `check-ds-no-raw-hex.ts` | KEEP | Explicitly owned by `netscript-tools`, harness gate docs, doctrine, Fresh UI skill, and/or `deno.json`; tests pin real negative-gate behavior. |
| `git/`: `git-commit-paths.ts`, `git-verify.ts` | KEEP (first file ambiguous) | Harness platform lesson explicitly names `git-verify.ts`; it imports `git-commit-paths.ts`. Preserve the helper because it is in a live consumer chain despite lacking direct owner prose. |
| `harness/`: `watch-run.ts` | KEEP | Explicit AGENTS, harness tooling, and `codex-wsl-remote` token-free supervision contract. |
| `release/`: `cut.ts`, `cut_test.ts`, `github-release.ts`, `github-release_test.ts`, `jsr-provision-packages.ts`, `jsr-set-package-settings.ts`, `preflight-text-imports.ts`, `preflight-text-imports_test.ts`, `publish-workspace.ts`, `run-publish-dry-run.ts`, `run-publish.ts`, five TS fixtures and `sample.txt` | KEEP; regroup only if importer-safe | All production files are task/workflow/import reachable. Tests cover release parsing, guarded file reads, and publish behavior. Fixtures are dynamically located by those tests. `netscript-release` owns workflow semantics. |
| `reporting/`: `report-function-coverage.ts` | KEEP | Root `coverage:functions` task is a live contract. No evidence of a replacement. |
| `search/`: `compare-export-surface.ts`, `find-import-patterns.ts`, `find-lines.ts`, `find-symbol-usages.ts`, `list-exports.ts` | DELETE candidate (whole folder) | Zero imports, tasks, workflows, AGENTS, harness, or skill mentions for every file. Only `.llm/tools/README.md` and `.llm/tools/entry.md` self-document them. Owner heuristic classifies the entire surface as legacy/superseded. Final exact path/basename scan required immediately before delete. |
| `validation/`: `check-close-gate.ts`, `check-internal-doc-links.ts`, `check-readme-standard.ts`, `check-scaffold-versions.ts` | KEEP | Root tasks, CI workflow, PR skill, and README standard docs anchor these scripts. Similar link-check filenames have distinct invocation contracts. |
| Root: `run-deno-check.ts`, `run-deno-doc-lint.ts`, `run-deno-fmt.ts`, `run-deno-lint.ts` | KEEP in place | Stable paths are named throughout AGENTS, doctrine, skills, deno tasks, and harness gates. Moving them would violate the external path contract and create no concern gain. |
| Root: `generate-cli-assets-barrel.ts` | KEEP in place | Root task plus generated provenance in four artifacts. Harness tooling explicitly says it stays at root for that reason. |
| Root docs: `README.md`, `entry.md`, `CLEANUP-PLAYBOOK.md` | KEEP; rewrite README/entry | `entry.md` is skill/harness referenced; playbook is the user-mandated operational spec; README is the maintained suite map. Consolidate duplicated navigation without breaking inbound anchors. |

## Deletion evidence checklist

| Candidate | Imports | Tasks/workflows | AGENTS/harness/skills | Dynamic/string load | Decision |
| --- | --- | --- | --- | --- | --- |
| `search/*.ts` | none | none | none | none found | DELETE after final scan |
| `e2e/scaffold-e2e-test.ts` | none | none | none | none found | DELETE after final scan; canonical e2e suite supersedes it |

## Ambiguous keeps for owner

1. `docs/*.ts`: kept because `docs/site/deno.json` invokes them, although the three named owner authorities do not mention them.
2. `git/git-commit-paths.ts`: kept because the harness-referenced `git-verify.ts` imports it.
3. `reporting/report-function-coverage.ts`: kept because a root task invokes it; no owner prose currently explains the task.
4. Test files without prose references: kept when colocated with and importing a live implementation; tests assert behavior rather than constant tautologies.

## Baseline gates

| Gate | Result |
| --- | --- |
| Scoped check | 55 selected, 0 findings |
| Scoped lint | 55 selected, 0 findings |
| Scoped format | 55 selected, 7 pre-existing findings |
| Tests | 23 passed, 0 failed |
| Lock | Baseline invocation briefly added two wildcard resolution rows; surgically restored to zero delta |

This file is a running log. Final moved/deleted paths, reference rewrites, test counts, and gate evidence will be appended as slices land.
