# Doc-Audit — PR #803 `docs/ns-plugin-shorthand-context`

- **Profile:** docs_audit (single-pass changeset audit), first run of the owner-ratified profile (2026-06-17 ratification)
- **Auditor:** Claude Fable 5 · low — separate session from the Opus generator
- **Subject:** PR #803 (`rickylabs/netscript`), worktree `/home/codex/repos/b10-nsdocs`, branch `docs/ns-plugin-shorthand-context` @ `3ae276c8` vs `origin/main` @ `4d438ce1`
- **Scope:** 11 changed files under `docs/site/` (+113 lines, callouts only), audited as one changeset
- **Date:** 2026-07-17

## Verdict

**PASS**

The changeset does exactly what the PR body claims, every accuracy claim reproduced under my own execution, and the callouts are cross-page consistent. Coverage is complete: no page in `docs/site/` uses an `ns-*` shorthand outside this changeset.

## Findings

1. **(info, upstream CLI bug — not a docs defect)** All three plugin CLIs' `--dry-run` still **writes** the scaffold output. Running `add job/saga/scheduled ... --dry-run` in a clean dir produced `workers/jobs/*.ts`, `sagas/*.ts`, `triggers/*.ts`, and `.netscript/generated/*` registries. This also explains the stray untracked `workers/ sagas/ triggers/ .netscript/` dirs the generator left in the worktree (untracked, not committed — clean before merge, but not a changeset defect). Recommend filing a CLI issue: dry-run is not dry.
2. **(info, accepted)** `tutorials/erp-sync/05-deploy.md` places the callout *after* its only `ns-workers` command (line 171 cmd, line 174 callout) — the "immediately accompanied" form. The callout wording is self-consistently adjusted ("the `ns-workers` command **above**"), so the reader-context rule is satisfied.
3. **(info, deliberate variance)** Single-use pages say "the `ns-workers` command below/above works as written"; multi-use pages say "every `ns-workers` command on this page". This is accurate per page, not drift.
4. **No blocking findings.** No false claims (no `--help`/help-verb claim anywhere — the workers CLI has no `help` verb, confirmed in `plugins/workers/src/cli/command-types.ts`), no internal wording, no untemplated specifiers.

## Gate log

| # | Gate | Command(s) executed (from `/home/codex/repos/b10-nsdocs` unless noted) | Scope | Result | Findings / how proceeded |
|---|------|------------------------------------------------------------------------|-------|--------|--------------------------|
| 1 | links | `rtk proxy deno task docs:links` | whole docs tree | **PASS** — `docs=96 broken-links=0 broken-anchors=0 orphans=0` | none; proceeded |
| 2 | build | `cd docs/site && rtk proxy deno task build` (Lume 2.5.4); then grep `_site/` output: callout present once in `background-processing/workers/index.html`; `deno install -gArf -n ns-workers jsr:@netscript/plugin-workers@0.0.1-beta.9/cli` rendered; `deno x -A jsr:@netscript/plugin-workers@0.0.1-beta.9/cli` rendered in `tutorials/workspace/04-provision-job`; zero residual `releaseSpecifier` tokens in rendered HTML | full site (528 files, 7.3s) + rendered-output spot checks | **PASS** — callouts render, `{{ releaseSpecifier }}` expands to `@0.0.1-beta.9` in both forms | none; proceeded |
| 3 | internal-wording | `git diff origin/main...HEAD -U0 \| grep '^+' \| grep -inE 'eis-chat\|VIF\|CSB\|#[0-9]{3}\|internal\|harness\|evaluator\|codex\|openhands\|claude\|opus\|fable'` | added lines only | **PASS** — zero hits | none; proceeded |
| 4 | specifier scan | `git diff -U0 ... \| grep -oE 'jsr:@netscript/[^ <\`]+' \| sort \| uniq -c` and negative check `... \| grep jsr:@netscript \| grep -v releaseSpecifier` | added lines only | **PASS** — 25 specifiers (17 workers, 3 triggers, 2 sagas, 3 generic `plugin-<plugin>`), all templated with `{{ releaseSpecifier }}`; zero literal pins; the only unversioned-adjacent form is the generic fallback pattern inside the callout prose, which itself carries the template | none; proceeded |
| 5a | accuracy: install-line syntax | `grep '"./cli"' plugins/{workers,sagas,triggers,streams}/deno.json`; `grep '"name"' ...` | plugin manifests | **PASS** — all three referenced packages named exactly `@netscript/plugin-{workers,sagas,triggers}` and export `./cli` (workers/triggers → `src/cli/composition/main.ts`, sagas → `src/cli/mod.ts`) | none; proceeded |
| 5b | accuracy: executed shorthand-family commands | In scratch dir: `deno run -A <worktree>/plugins/workers/src/cli/composition/main.ts add job audit-test --dry-run`; `.../sagas/src/cli/mod.ts add saga audit-test --dry-run`; `.../triggers/src/cli/composition/main.ts add scheduled audit-test --dry-run` | one command per family, in-tree entrypoints, executed by me | **PASS** — all three exit clean with structured JSON scaffold plans | Finding 1: `--dry-run` wrote real files (`workers/jobs/audit-test.ts`, `sagas/audit-test-saga.ts` + config, `triggers/audit-test-trigger.ts`, `.netscript/generated/*` registries). Logged as upstream CLI bug + explains generator's stray worktree dirs; not a docs defect. Proceeded |
| 5c | accuracy: `deno x` fallback matches framework form | `sed -n 80,130p packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts`; `rtk grep 'deno x' packages/cli ...` | CLI dispatch source | **PASS** — `dispatchPluginVerb` execs exactly `deno x -A <jsr-spec>/cli <verb ...>`, identical shape to the callout fallback | none; proceeded |
| 5d | accuracy: no false claims | Read all 11 callout diffs; `rtk grep "'help'" plugins/workers/src/cli` + verb registry `command-types.ts`; cross-checked page verbs (`trigger`, `executions`, `run-task`, `add job/task/saga/scheduled`) against `plugins/workers/src/cli/commands.ts` and 5b runs | changed lines + CLI verb surface | **PASS** — no `--help` claim anywhere; all verbs the "works as written" claim covers exist on the CLI surface | none; proceeded |
| 6 | cross-page consistency | Scripted loop over all 11 files: count `deno install -gArf -n` lines, extract families used, compare callout title/voice from the full diff | all 11 changed pages | **PASS** — identical install-line shape (`deno install -gArf -n ns-<fam> jsr:@netscript/plugin-<fam>{{ releaseSpecifier }}/cli`) on every page; 3 dual-family pages (erp-sync/02, erp-sync/04, storefront/05) list each family exactly once and share the generic `ns-<plugin>` fallback sentence; same callout type/title pattern throughout | Finding 3 (deliberate below/above/every-on-this-page variance, accurate per page). Proceeded |
| 7 | reader-context rule | Same scripted loop: first `ns-*` occurrence line vs callout line per page; plus coverage sweep `grep -rlE '\bns-(workers\|sagas\|triggers\|streams)\b' docs/site --include='*.md'` `comm`-ed against changed files | all 11 pages + whole `docs/site` | **PASS** — on 10/11 pages the callout IS the first shorthand occurrence; on erp-sync/05-deploy it immediately follows the single command with "above" wording (accompanied form, allowed). Coverage sweep: zero shorthand-using pages outside the changeset | Finding 2 recorded; accepted. Done |

## Notes for future `.llm/tools/docs/` automation

- Gates 3/4/6/7 were pure changed-line greps + a per-page position script — fully mechanizable (inputs: diff, family list, callout marker string).
- Gate 5b needs a scratch-cwd sandbox because `--dry-run` is not dry (see Finding 1); automation must run it outside the worktree or the audit itself dirties the tree.
- Gate 2's render assertion reduces to: grep `_site/**` for the callout title, the expanded pin `@<version>/cli`, and assert zero `releaseSpecifier` literals.
