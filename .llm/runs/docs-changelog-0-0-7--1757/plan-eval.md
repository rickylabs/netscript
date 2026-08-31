# PLAN-EVAL cycle 2 — docs-changelog-0-0-7--1757

- Plan evaluator session: Claude Code — `https://claude.ai/code/session_016e5ph9mxGW4izgBPPzjXgU`, 2026-08-30
- Evaluator identity: Anthropic · Claude Fable 5 (`claude-fable-5`) · effort medium (requested via
  `formal_plan_evaluation`, `supervisor.md` routes table / `lane-policy.md`; effort is not observable from
  inside the session and is recorded as requested). Fresh native opposite-family session, distinct from
  the cycle-1 evaluator session (`session_01Qccb4kNXWBMY2Z2KiCadfj`) and from the generator (OpenAI
  GPT-5.6 Sol medium, Codex thread `01a0522a-8eb8-7912-8dbb-526db23d711b`). Generator ≠ evaluator holds.
- Run: `docs-changelog-0-0-7--1757` (cycle 2 of 2)
- Evaluated head: worktree `/home/agent/projects/netscript/worktrees/007-leaf-1757`, branch
  `docs/changelog-0-0-7` @ `13878a80a50c55b9662099fed64555f2310ae4a3` (= `origin/main` = merge-base);
  `git status --porcelain` shows only the untracked run dir; no product file modified;
  `packages/cli/CHANGELOG.md` still has only `## 0.0.6`; `packages/cli/deno.json` still `0.0.6`.
- Surface / archetype: `packages/cli/CHANGELOG.md` — docs artifact, no package archetype (agreed)
- Scope overlays: `SCOPE-docs.md`
- Mutations by this session: this file only. No plan/worklog/changelog/lockfile/label/issue/GitHub change.

## Method

Every claim below was re-derived from the tree and from `git diff <sha>^ <sha>`, not from the repair
summary. Specifically: per-commit shipped-path scan for all 33 commits (`packages/`+`plugins/` minus
tests/e2e/fixtures, plus a separate `agent-tools.generated.ts` axis); full diffs of
`consumer-tools.json`, `scan-code-quality.ts`, `run-deno-check.ts`, `run-deno-lint.ts` at
`473e8d75`/`f7ad44dc`/`cf648f1f`/`3b32d162`/`01e09604`; `quality-runner.ts` at `01e09604`;
`prisma-adapter-mysql/src/{mod,adapter,types}.ts` at `3561bb64`; `sdk/src/client/errors.ts`,
`sdk/src/ports/service-client.ts`, `contracts/src/application/contract-primitives.ts`, the commit
body, and the two `docs/site/services-sdk` pages at `c73d361e`; commit bodies + key diffs for the
remaining includes; `init-agent.ts` imports; generator/boundary greps.

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselines against `origin/main` `13878a80`; re-derived this session: `HEAD == origin/main == merge-base`, `rev-list --count v0.0.6..origin/main` = 33, no baseline drift since cycle 1. Finding 9 (five barrel-regenerating commits ship through `agent init`) spot-checked: `init-agent.ts:8-12` imports `EMBEDDED_AGENT_TOOL_FILES` from `agent-tools.generated.ts`; barrel axis touched by exactly `f7ad44dc`, `01e09604`, `473e8d75`, `cf648f1f`, `3b32d162` (per-commit scan). Findings 5–8 unchanged from cycle 1 (`grep -rln CHANGELOG .llm/tools .github/workflows deno.json` → none; `github-release.ts:18-23` "MANUAL BY DESIGN"). |
| Decisions locked                        | FAIL   | D1–D5 are stated with rationale and the cycle-1 F1/F2 structure is repaired (17/16 split, eleven-row map with commit→bullet traceability, all 17 includes covered by the map, all clauses I checked trace to a listed commit — see Notes §A). One locked bullet is factually incomplete against the commit it traces to: **B11 omits two of the five breaking changes that `c73d361e` itself declares in its `BREAKING CHANGE:` footers and documents in `docs/site/services-sdk/sdk.md`** — the `baseContract` error-code key-space tightening (`@netscript/contracts`) and the `SafeFailure` literal defined/non-defined arms. Under the plan's own D3 ("omitting them would hide a published API break") and the cycle-1 standard applied to `3561bb64` ("tighter public types alone hides a removal"), this is a hidden published-API break in the locked contract (F1). Secondary: B1 drops the installed scanner's new `env`/`net` permission requirement that the worklog triage row for `473e8d75` itself records (F2). |
| Open-decision sweep                     | PASS   | `plan.md ## Open-Decision Sweep`: "Final bullet wording — resolved now" (map exists), "Additional 0.0.7 work — safe to defer" (provisional PR statement), "Changelog enforcement gate — safe to defer" (issue #1757 explicitly excludes it). Evaluator sweep found no new *decision* left open; F1/F2 are content defects in a locked decision, not undeclared decisions, and are charged to the box above rather than double-counted here. |
| Commit slices (< 30, gate + files each) | PASS   | One slice in `worklog.md ## Design › Commit Slices`: names what it proves, its gates (five required tasks + diff/lock review), and files. Cycle-1 advisory (single canonical copy) still stands; not blocking. |
| Risk register                           | PASS   | `plan.md ## Risk Register` — five risks with mitigations; the "misleading subject" mitigation was applied this time (all five barrel commits diff-inspected and re-triaged). |
| Gate set selected                       | PASS   | `plan.md ## Validation Plan` rows 1–7; `SCOPE-docs.md` gates covered (source alignment = row 1 traceability, link integrity = row 2, drift log = `drift.md` three entries). Archetype gate matrix N/A. Gate scope claim (none of the five tasks reads the changelog) re-verified. |
| Deferred scope explicit                 | PASS   | `plan.md ## Non-Scope` + `## Deferred Scope`; release-introduction boundary verified again at `github-release.ts:18-23`; derived-asset boundary verified (no generator reads `CHANGELOG`; `build-agent-docs-bundle.ts` rebuilds from rendered `docs/site/_site`; `generate-publish-assets.ts` output list is closed). D4 sound. |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `research.md ## jsr-audit surface scan`: docs-only; no `packages/`/`plugins/` source, manifest, export, or dependency change. Reason accepted. |

## Open-decision sweep (evaluator-run)

No undeclared open decision found. Both cycle-1 findings are structurally closed:

- **Cycle-1 F1 (shipped `agent init` tool bundle) — closed.** Triage rows for `f7ad44dc`, `01e09604`,
  `473e8d75`, `cf648f1f`, `3b32d162` now give reasons that are true of the shipped tool sources
  (verified: `run-deno-check.ts` reports and exits 1 on parse-less batch failures in every source
  mode; `run-deno-check/lint/fmt.ts` gain `--output` atomic report writing and the scanner skips
  `.deno`/`_site`/`node_modules`; scanner gains `public-any`/`public-export-unresolved` rules and
  fail-closed allowance-owner verification; `run-deno-lint.ts` honours `.deno-fmt-lint-ignore` and
  batches by nearest `deno.json(c)`; `run-deno-lint.ts` fails closed with a `coverage` report on
  `partial-exclusion`/`processed-count-unavailable`/`processed-count-inconsistent`). The barrel at
  `3b32d162` does not embed `run-deno-fmt.ts`, so B1's "fails closed when Deno processes fewer files"
  is correctly scoped to lint. 17 include / 16 exclude counts re-verified from the table.
- **Cycle-1 F2 (bullet map) — closed.** Eleven rows, every included commit appears in at least one
  row, `01e09604` legitimately appears in B1 (bundle) and B2 (`--skip-apphost`).

The two remaining defects are wording completeness inside the locked map:

**F1 — B11 hides two declared breaking changes in `c73d361e` (must fix before implementation).**

The commit's two `BREAKING CHANGE:` footers and the shipped SDK page (`docs/site/services-sdk/sdk.md`,
"0.0.7 is an intentional pre-1.0 breaking change") declare five facts. B11 carries three
(`null → undefined`, default `TError` `unknown → Error`, `safe()` rejects non-Promise thenables — all
verified in `errors.ts`: `SafeFailure<TError = Error>`, `data: undefined`, `safe(promise: Promise<TOutput> & {...})`).
It omits:

1. `baseContract` error-code key space is now exactly `NOT_FOUND | VALIDATION_ERROR | UNAUTHORIZED |
   FORBIDDEN | RATE_LIMITED | SERVICE_UNAVAILABLE` (`contract-primitives.ts`: `OrpcErrorMap =
   Parameters<typeof oc.errors>[0]` replaced by the closed `CommonErrorMap`); comparing `error.code`
   with any other code becomes a type error. This is a `@netscript/contracts` published-surface break
   in a package the plan otherwise covers, and it is not mentioned anywhere in the map.
2. `SafeFailure` now has literal defined (`[error, undefined, true, false]`) and non-defined
   (`[error, undefined, false, false]`) arms instead of a single `boolean` slot. Lower severity — it is
   arguably the mechanism behind "preserve exact contract errors" — but the commit lists it as breaking
   and consumers who typed the third tuple element as `boolean` observe it.

The brief inherited "all three breaking SDK facts" from cycle 1; cycle 1 named three as a floor, not
an exhaustive list. Independent inspection of the commit finds five.

**F2 — B1 omits the installed scanner's new permission requirement (fix in the same repair).**

`473e8d75` changes `consumer-tools.json` for `quality/scan-code-quality.ts` from `["read"]` to
`["read","env","net"]`, and the shipped scanner constructs `createGitHubAllowanceIssueResolver()`
unconditionally (`scan-code-quality.ts:968`), which reads `GITHUB_TOKEN`/`GH_TOKEN` eagerly
(`:770`) — so a consumer invoking the installed tool with the previously documented `--allow-read`
now hits an env-permission denial on every run, allowances or not, and allowance owners are resolved
against the fixed `rickylabs/netscript` tracker over the network. The worklog triage row records
"including its required env/network permission"; B1's draft ("audits public API quality") does not.
On its own this would have been a mandatory advisory rather than a FAIL; it is listed as a required
fix only because the plan is already returning for F1 and a cycle-3 pass should need one read.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **Decisions locked (F1)** — Amend `plan.md ## Locked Changelog Map` row B11 so it states all five
   declared breaks. Acceptable shape (wording is the generator's; facts are not negotiable): "…
   failures now carry `undefined` rather than `null`, `SafeFailure` splits into literal defined and
   non-defined arms, default `TError` changes from `unknown` to `Error`, `safe()` no longer accepts
   non-Promise thenables, and `baseContract` now rejects error codes outside its six declared
   literals (`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`,
   `SERVICE_UNAVAILABLE`)." If the generator prefers a separate contracts bullet for the key-space
   tightening, B12 with `c73d361e` as its traced commit is equally acceptable; update D2's bullet
   count accordingly. Update the `c73d361e` triage reason in `worklog.md` to name the contracts break.
2. **Decisions locked (F2)** — Amend B1 so the scanner clause discloses the operational change, e.g.
   "… audits public API quality and verifies `quality-allow` owners against GitHub (the installed
   scanner now needs `--allow-env --allow-net`) …". No other row changes.

Everything else is verified and may be carried into cycle 3 unchanged. Per `plan-gate.md` this is
the second `FAIL_PLAN`; the loop limit is reached and the unresolved items above are escalated to the
owner, who may authorize a bounded cycle-3 evaluation (precedent: `cf648f1f` PR #1663) or waive in
writing. The repair itself is two clauses in two map rows plus one triage reason.

## Notes

### A. Bullet-by-bullet traceability (diff-inspected)

| Bullet | Verdict | Evidence |
| --- | --- | --- |
| B1 | upheld, F2 wording gap | Six commits verified on the barrel/`agent init` axis (see sweep). `13878a80`: skills installed to `.agents/skills`, guidance from embedded template. "honors subtree/config lint exclusions" = `cf648f1f` marker + nearest-config batching. |
| B2 | upheld | `quality-runner.ts` diff: `Deno.args.includes('--skip-apphost')` filters `isAppHostSource` for all modes; usage string updated; `templates/workspace/deno-json.ts` untouched (0 files) — B2 correctly describes an argument accepted by the generated flows, not a new task. E2E gate calls `deno task check --skip-apphost`. |
| B3 | upheld | `auth-plugin-command.ts`: `--stream-url` default `http://localhost:4437/auth/sessions` removed; help text and error message point to `aspire describe streams --format Json` + `/auth/sessions`. |
| B4 | upheld | `scaffolder.ts`/`database-generators.ts` emit selected-provider helpers; `generate-database-seed.ts` uses generated Prisma client; `routers/v1.ts.template` imports `notFound` and the e2e gate asserts `get/patch/delete` by-id project `404 NOT_FOUND` in OpenAPI and live responses. |
| B5 | upheld | Registry 50 → 66 items, eight collections (commit body + cycle-1 spot check). |
| B6 | upheld | `generate-register-background.ts` emits `getEndpoint('http')` preflight per service/plugin ref and `throw new Error("Background processor configuration error: … could not resolve … HTTP endpoint.")` before processor registration. |
| B7 | upheld | `3fc0f2f9`: `PrismaMySqlAdapter`, `getCapabilities`, `isConnectionError`, `MYSQL_CONNECTION_ERROR_CODES`, `onConnectionError` hook. `3561bb64`: `mod.ts` root export list drops `DenoMySqlClient`, `DenoMySqlConnection`, `ExecuteResult` (verified at current `mod.ts:50`); `columnTypes: number[]` → closed literal union; `verify_identity` `@deprecated` with runtime branch retained; `examples/basic-usage.ts` rewritten (23+/48−). `toMysql2PoolOptions` exported from `adapter.ts` only — B7 correctly does not call it public. |
| B8 | upheld | `pool.ts`/`base-transport.ts`: `combineSignals`, `settleOperation`/`settleConnection` on `callTool`, `readResource`, `listTools`, `close(options)`; `mcp.ts` public entrypoint touched. |
| B9 | upheld | Commit body + `contracts/context.ts`, `ports/tool-registry.ts`, `agent/loop.ts`. |
| B10 | upheld | `3e8e146a`: `cache-query.ts` catch on persist path, `cache-telemetry.ts` `CacheNamespaceAdmission` overflow bounding with offending-id evidence; `0ef48c2e` body: "dedupe stale refresh persistence", "honor stale-only fresh preference". |
| B11 | F1 | See sweep. |

### B. Excluded commits touching shipped paths (all upheld)

`e090f894`, `729386c5` — only `agent-docs.generated.ts` + `publish-assets.generated.ts` corpus cascade.
`2dd1a75e` — corpus cascade plus four JSDoc `@example` import-specifier edits in `packages/contracts`
(comment-only, verified line by line). `61bfd858` — `export-surface-corpus.generated.ts` only. All
other excludes touch no `packages/`/`plugins/` path and no barrel. `473e8d75`'s
`public-api.ts`/`public-command-dependencies.ts`/`producer.ts` edits are `quality-allow:` comment
re-tagging only — the include reason correctly rests on the shipped scanner, not on these.

### C. Advisories (non-blocking)

- `context-pack.md` now says "eleven" (cycle-1 advisory closed). Commit-slice table still lives only
  in `worklog.md`; keep it the single copy.
- B7 reads as one long sentence covering two commits; splitting into an adapter-contract bullet and a
  types/example bullet would aid readers, but grouping is the generator's call and traceability holds.
- Loop status: cycle 2 of 2 — escalation point reached.
