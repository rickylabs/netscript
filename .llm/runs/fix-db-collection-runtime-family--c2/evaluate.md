# Evaluation: fix-db-collection-runtime-family--c2 (IMPL-EVAL, issue #2039 / draft PR #2089)

## Metadata

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| Run ID         | `fix-db-collection-runtime-family--c2`                                      |
| Target         | Issue #2039 / draft PR #2089, branch `fix/db-collection-runtime-family`      |
| Archetype      | `ARCHETYPE-2-integration` (`packages/sdk` + `packages/fresh`)                |
| Scope overlays | `SCOPE-frontend` (Fresh live-query/stream surface)                           |
| Evaluator      | Independent IMPL-EVAL session, 2026-10-08. Generator: lane C2 (owner-assigned, OpenAI family per `supervisor.md`). Evaluator: owner-selected route `opencode run -m opencode-go/glm-5.3-flash --variant max` (Zhipu GLM family) recorded in `supervisor.md` as a lane-policy override; fallback (Gemini via agy) not invoked. Session and vendor-family separation satisfied. |

Exact evaluated HEAD, full hash:

```
51d074443efa241af0d24153a6de608f78ef429b
```

All tables below verify at that exact HEAD. Supporting identities:

- Source implementation commit: `60dbcd04823e3b9c146b78b014e26463c18544b8`
- Corpus refresh commits: `93fa1add` / `868a3586d`
- Baseline (= merge-base with `origin/main` at run start): `2f82548cf95a5841557b789d0713e04225e1c9da`
- Working tree at evaluation end: clean (`git status --porcelain` = 0 lines); no branch switch, no history/public writes.

## Process Verification

| Check                                         | Result | Evidence |
| ----------------------------------------------| ------ | -------- |
| Plan-Gate passed before implementation        | PASS   | `plan-eval.md` verdict `PASS`, evaluated at `3ecd0c25729c5cc98dee3ebca2b9daf24781caea` (docs-only HEAD, pre-source). Commit ordering (`b07e66c69`/`3ecd0c257` before `66f9d694`/`60dbcd048`) and the worklog hard-stop record confirm no source slice predates the verdict. |
| Design checkpoint exists and was followed     | PASS   | `worklog.md` `## Design` names public surface, domain vocabulary, ports (existing StreamDB factory port + SDK query client), constants, 4 ordered slices, deferred publication, contributor path. Implementation matches within stated file budgets (S2: 10 files ≤ 12; S3: 7 source files ≤ 10; S4: 1 generated file). |
| Commit slices match design plan               | PASS   | S2 `66f9d6940535af6c7c894a02ba739563f98aff72` (deps/guard/docs/lock/context/worklog), S3 `60dbcd048` (+ debt entry, run artifacts, real-boundary + browser fixture), S4 `93fa1add`, `868a3586d` (corpus), evidence close `51d074443`. |
| Each slice has a passing gate                 | PASS   | Gate ledger with raw structured receipts (exit code + full output) under sibling `<private task evidence>/`; spot-re-run live this session (table "Independent re-runs" below). |
| No speculative seams (unused files)           | PASS   | Diff fileset (25 files) contains only source, tests, README, manifests, lock, debt entry, run artifacts, one generated corpus file — every new file is reachable from the public surface or a test; no orphan template files. |
| Constants for finite vocabularies             | PASS (LOW, note F-5) | Only new finite vocabulary is the single-identity expectation message; consistent with manifest-declaration-driven guard. |
| SKILL chapter in agent briefs/prompts         | MEDIUM finding (see Findings) | `plan-eval-brief.md` and `evaluate-brief.md` (and the lane-level `BRIEF-C2.md`, an owner-file prompt outside sibling evidence but the C-lane implementation prompt) lack the `## SKILL` chapter required by the agent-briefing template for evaluation prompts; substantive intent nonetheless satisfied — both evaluator sessions named and read the harness/evaluator/doctrine/archetype files. |
| Trackability / commit trail                   | PASS   | Draft PR #2089 OPEN, `isDraft`, labels `status:plan-eval`/`type:fix`/`area:fresh`/`area:sdk`/`area:deps`/`priority:p1`; per-slice PR comments exist for S2 and S3 naming commit hash, gates, mutations, suite counts, and the `Refs #2039` position. Remote branch at origin points at evaluated HEAD `51d074443`. |
| Close-gate honored                            | PASS (vacuously n/a-blocking) | Issue #2039 body contains no markdown acceptance/gate checkboxes (verified from the private issue JSON), so no close-gated box can be left unchecked. PR body references `#2039` without a closing keyword — correct for partial work since the plan forbids a `Closes`/`Fixes`/`Resolves` claim before qualified publication. No `status:ready-merge` requested. |
| Release-gate class                            | n/a    | Plan locks "No release cut or merge"; `scaffold.runtime`/`e2e-cli-prod` pre-merge N/A per plan. |
| Evaluator separation / route                  | PASS   | As per Metadata: generator ≠ evaluator session and vendor family; owner override recorded in `supervisor.md` and `drift.md`; fallback not invoked; no paid-route expense decision triggered. |

## Static, Fitness, Runtime, and Consumer Gates — independent verdict

### Gate ledger (raw-exit-code receipts, sibling private task evidence `<private task evidence>/`)

| Gate (worklog name) | cmd | exit | receipt |
| --- | --- | --- | --- |
| `db-cold-guard` | `deno task deps:check:db` | 0 | identities exactly one `@tanstack/db@0.6.17_typescript@7.0.2` on both mixed and Fresh-only cold probes |
| `db-policy-final` | focused guard unit test (frozen) | 0 | 1 pass / 0 fail |
| `db-policy-mutation` / `db-policy-restored` | same test with guard identity-enforcement disabled / restored | 1 then 0 | mutation fails close-gate; restored passes |
| `db-lock` | `deno cache --unstable-kv <owning entrypoints>` | 0 | lock hydration family-consistent |
| `db-real-boundary-final` | `create-stream-db_test.ts` (frozen) | 0 | 2 pass / 0 fail |
| `db-scoped-check`, `db-final-check` | frozen structured check incl. SDK type fixture `query-collection_type.ts` and fixture package | 0 | 10 files, 0 diagnostics, 0 failed batches |
| `db-stream-types` | streams type fixture via dedicated no-lock consumer config | 0 | 1 file, 0 occurrences |
| `db-production-browser` … `db-final-production-boundary` | production build + Playwright SSR fixture lifecycle (7 iterations with real diagnostics) + final focused three | 0 (final) | 3 pass / 0 fail after mutation-restore cycle |
| `db-boundary-mutation` / `db-browser-mutation` / `db-boundary-browser-restored` | plain-object factory mutation / restored | 1 then 1 then 0 | mutation produces exactly `QueryBuilderError: Invalid source for live query… not a Collection` (the issue #2039 production failure class) in the actual-boundary test and a production SSR startup timeout in the browser fixture; restored three-suite run passes |
| `db-sdk-fresh-tests` | full SDK/Fresh suite (frozen, unstable-kv) | 0 | **524 pass / 0 fail / 0 ignored** |
| `db-quality-clean`, `db-final-quality` (initial) | `deno task quality:gate` (quality:scan + arch:check incl. deps:check chained `deps:check:db`) | 0 | initial red was transient generated bundle in scan scope, fixed by fixture cleanup in `finally`, not by suppression |
| `db-scoped-lint`, `db-final-fmt`, `db-fmt-cleanup` | scoped lint / fmt over changed surface | 0 | pass |
| `db-jsr-sdk`, `db-jsr-fresh` | JSR package audits (exit 0; WARN-only, pre-existing) | 0 | `F-DOCT-5` cardinality + `F-JSR-7` slow-types (1) — legacy, unchanged |
| `db-publish-sdk`, `db-publish-fresh` | raw publish dry-run | 0 | full real outputs end `Success Dry run complete` (10874 / 22758 bytes stderr incl. per-file simulation) |
| `db-carrier`, `db-corpus-fresh`, `db-corpus-tests(-corrected)` | carrier freshness; dry-run regression generation; exact-source freshness; corrected suite (nonexistent-path refusal retained, no skip) | 0 | corpus checksum `2d4f9e2863f7f6b939948e05ea18554d686faf1ac8fde6f620d49f0055bb0e10`; 35 packages / 275 subpaths / 7908 symbols |
| `db-doc-sdk`, `db-doc-fresh` (+ baseline pair) | `deno task doc:lint --root packages/sdk|/packages/fresh` | 1 (unchanged) | raw failing all-export doc lint retained as baseline; **byte-identical stdout between baseline and current for both packages** (`diff` of sibling `baseline-doc-*.stdout` vs run `db-doc-*.stdout` = empty); `db-doc-comparison.json` shows every unchanged flag true — SDK combined 3 (all private-type-ref, pre-existing), Fresh combined 45 (28 private-type-ref + 17 missing-JSDoc, pre-existing), per-entrypoint diagnostics and exit codes identical |

Placeholder/non-verdict check: every receipt is a real artifact — JSON receipts carry `schemaVersion` + `command` + `exitCode` + full output; the guard tool itself is real 89-LOC source with a 21-LOC regression test; `db-corpus-freshness` is a truthful red before regeneration. No unsigned echo, skeleton, or markdown-fabricated verdict was relied on anywhere.

### Independent re-runs executed live this session at exact HEAD (not copied from receipts)

| # | Command (abridged) | Result |
| --- | --- | --- |
| 1 | Focused three: `run-deno-test.ts -- --frozen --allow-all create-stream-db_test.ts + db-collection_browser.ts` | exit 0, **3 pass / 0 fail** (includes full real Vite production build + Fresh SSR + Playwright hydration/update/teardown cycle) |
| 2 | `deno task deps:check:db` (cold mixed + Fresh-only) | exit 0; both probes resolve exactly `@tanstack/db@0.6.17_typescript@7.0.2` |
| 3 | Full SDK/Fresh suite | exit 0; **524 pass / 0 fail / 0 ignored** (matches receipt) |
| 4 | `deno task check:mcp-export-corpus` | exit 0 (first attempt needed `LD_LIBRARY_PATH` unset — provisioned-shell quirk of this evaluator session, not a repo property); checksum identical to receipt |
| 5 | `deno task quality:gate` | exit 0; legacy WARNs only, unchanged scope |
| 6 | Scoped lint, scoped fmt, frozen structured check (streams + type fixtures + fixture package) | all exit 0 |
| 7 | Both JSR package audits | both exit 0, pre-existing WARNs only |
| 8 | Guard unit test frozen | exit 0, 1 pass |
| 9 | Byte-diff baseline-doc vs current-doc stdout | byte-identical for SDK and Fresh |
| 10 | `git status --porcelain \| wc -l` after all runs | 0 (checkout unmodified) |

### Manifests, catalog, lock (D1) — re-derived from HEAD diff

- `packages/sdk/deno.json`: `npm:@tanstack/db@0.6.17` and `npm:@tanstack/query-db-collection@1.2.1`, exact (no caret).
- `packages/fresh/deno.json`: `npm:@tanstack/react-db@0.1.95` and `npm:@durable-streams/state@0.3.1`, exact.
- Root `deno.json` catalog: all four mirrored exact entries (+ `deps:check` now chains `deps:check:db`, making the cold guard durable in the CI dependency-quality route, and `test:browser` gains the fixture).
- `deno.lock`: grep-filtered the raw diff — every non-header +/- line concerns only the four owning family specifiers (key and nested workspace forms); **zero unrelated jsr/npm specifier identity changes**, 0 added non-family lines. The lock retains all prior resolved package identities (`0.6.17_typescript@7.0.2`, `1.2.1_…`, `0.1.95_…`, `0.3.1_@tanstack+db@0.6.17…`). D1's identity-preservation demand is therefore satisfied at both specifier and resolved level.
- `deno ci --frozen` feasibility is corroborated by every `--frozen` run above passing with the committed lock.

### Source review of the implementation deltas

1. `create-stream-db.ts`: only additive optional documented members `preload?: () => Promise<void>` and `close?: () => void` on the existing owned `NetScriptStreamDB` handle; existing `stop?`/`dispose?` preserved; matches the resolved `@durable-streams/state@0.3.1` `StreamDBMethods` shape (PLAN-EVAL's type-surface verification, unchanged at HEAD). No public constructor/class/helper export or reexport introduced; no casts or lint ignores in changed runtime source.
2. Factory test (`create-stream-db_test.ts`): the new case uses real `workersStreamSchema` from `packages/plugin-workers-core/src/streams/schema.ts` normalized through native `createStateSchema`, the real unoverridden `createNetScriptStreamDB`, a real `Deno.serve` durable-stream endpoint, real adapter `BaseQueryBuilder.from`, constructor-equality witness against the real SDK `createQueryCollection` collection, native `preload()` consumption, teardown with `db.close?.()` + query `cleanup` + `client.clear()` proving `subscriberCount === 0` on **both** collections. No schema or query stand-in; cast-free (uses `Reflect.get` where necessity required).
3. Browser fixture (`db-collection_browser.ts`, `app.tsx`, `main.ts`, `vite.config.ts`): actual Fresh app/server with static files, real stream protocol responses, production Vite build via the locked resolver (`createLockedViteCommand`), SSR HTML assertion (`loading` state, no `InvalidSourceError`), real island reload + hydration, empty→data transition, two successive real stream updates (`revision-1`, `revision-2`), SDK query data (`sdk-item`), both representative widths (390/1280) overflow-free, actual unmount with `data-subscriptions="0"` (interval-polled combined subscriber count rather than a one-shot sample), and zero browser errors. `_fresh` output removed in `finally` (with `NotFound` tolerance), so checkout stays clean — verified live.
4. Guard `check-db-alignment.ts` + test: complete npm identities (with peer suffix), fail closed on missing/multiple/unresolved/multi-resolved graphs, rejects loader errors through module-error inspection; two probes (mixed and Fresh-only) run declared-import cold consumers on task-scoped temp dirs with isolated `DENO_DIR`; Fresh-only path leaves no persistent workspace graph anchor (plan D1 contingency exercised cleanly).
5. Corpus: `export-surface-corpus.generated.ts` regenerated with only the typed delta of the two new optional members; inventory counts otherwise unchanged, verified by exact-source check with matching sha256.
6. Debt entry `db-doc-baseline-2039`: audited below.

## Anti-Pattern Check (run scope: `packages/sdk`, `packages/fresh`, guard tool, fixture, lock/catalog)

| AP | Status | Notes |
| --- | --- | --- |
| AP-11 (module-load side effects) | `CLEAR` | env/stream URL resolution occurs inside factory call, not module load; guard does env-free temp-dir probe with explicit cleanup in `finally`. |
| AP-3 / AP-8 / AP-9 / AP-17 / AP-22 / AP-23 / AP-24 | `CLEAR` | no new port, no DI, no invented `interfaces/`, no upstream reexport, no submod-barrel re-export, no registry regression; pre-existing Keep shape retained per plan. |
| AP-19 (permissions undocumented) | `CLEAR` | README additions document the supported family, exact pins rationale, and the `deno task deps:check:db` cold-resolution check for both packages. |
| AP-25 (side effects outside adapter/edge) | `CLEAR` | new side effects limited to edge/test files (browser test, temp-dir guard process subtree); consistent with existing `_browser.ts` harness. |
| AP-16 | `WARN` unchanged (pre-existing `F-DOCT-5` in untouched directories; no new) | audit receipts |
| others | `N/A` | outside touched surface (verified by diff fileset). |

## Arch-Debt Delta

| Metric | Count | Evidence |
| --- | --- | --- |
| New entries | 1 (`db-doc-baseline-2039`) | proposed with owner, target, reason, linked plan/issue, gate, evidence |
| Resolved | 0 | none |
| Deepened | 0 | per-entrypoint doc diagnostics byte-identical to baseline (independent diff) |
| Unrecorded | 0 | full file audit above |

### Explicit adjudication of proposed `db-doc-baseline-2039` (required by the evaluation brief; not hidden behind combined-sweep counts)

Fact pattern verified independently: all-export doc lint remains raw failing (`exit 1`) for both packages at HEAD, and at **baseline too**; the byte-level comparison between the baseline receipt pair and the current receipt pair is empty (no changed byte), and `db-doc-comparison.json` confirms per-entrypoint counts, categories, and combined totals/exit codes (`sdk` 3 = 3; `fresh` 45 = 45; exits 1 = 1). The debt row carries all required fields (ID, reason, owner `SDK/Fresh maintainers`, target `2026-10-15`, linked plan + issue, created 2026-10-08, explicit gate `All-export doc lint must reach zero with existing types preserved` and the release-lever wording `Release requires qualified published consumer resolution; source qualification does not fulfill publication`, plus evidence pointers). It does not claim the baseline as fixed and does not miscount combined sweeps.

**Adjudication: the entry is a valid `DEBT_ACCEPTED`** — pre-existing residue, provably not deepened by this wave (per-entrypoint identity proof), with a bounded owner, target date, and correct release-lever linkage. It therefore does **not** block a PASS under `verdict-definitions.md` (a `FAIL_DEBT` requires malformed/unrecorded/unhandled debt, which is not the case). No other debt is created or deepened.

## Findings

| Severity | Finding | Evidence | Required action |
| --- | --- | --- | --- |
| MEDIUM | Missing `## SKILL` chapter in the run's evaluation briefs (`plan-eval-brief.md`, `evaluate-brief.md`) and lane-level implementation brief `BRIEF-C2.md`, contrary to the agent-briefing template's opening contract | template `templates/agent-briefing.md`; brief contents inspected | **fix at close-out by the generator** (append the chapter naming `netscript-harness` + relevant lane skills). Verdict weighed: a FAIL_FIX would mandate a full evaluator cycle to append template text; the substantive rule intent (sessions knowing governing skills) was demonstrably satisfied by both evaluator sessions and implementation lane evidence; no gate, evidence, or doctrine state is affected. Recorded rather than silently waived; owner may overrule by requesting a re-evaluation after the doc append. |
| LOW | `analyzeDbGraph` tests enumerate two-identity rejections but not a three-cardinality case | `.llm/tools/deps/check-db-alignment_test.ts` | no action (structural `length !== 1` check covers ≥2 by construction); optional hardening |
| LOW | Pre-existing legacy WARNs in quality receipts (F-5/F-6 `export default`, A13 `Deno.exit`, F-DOCT-5 cardinality) are unrelated to this wave | receipts at baseline; diff fileset shows no touched files there | none (registered pre-existing baseline WARNs; not new violation) |
| LOW | Fixture plumbing uses existing-baseline-style convenience casts (`Deno.NetAddr`, vite-config JSON parse) | above scan covers the plan's "no casts" scoped to the Collection/boundary/public path — clean there | none |
| INFO | `origin/main` has moved past the baseline (`4ef93c2532e4aeabdbd26874cd36cd7d37e593fd` is current; merge-base with this branch is still the recorded baseline) so a pre-merge rebase/refresh is owner-side standard practice | git | none for evaluation |
| INFO | One `check:mcp-export-corpus` re-run required `LD_LIBRARY_PATH` unset | evaluator session environment, not a property of the repo | none |

## Runtime / Consumer Gates (protocol "required when touched")

| Gate | Validation | Result | Evidence |
| --- | --- | --- | --- |
| Cold consumer identity (mixed + Fresh-only) | bundled cold `deno info` graphs, complete-identity counting | PASS (0) | receipt + live re-run |
| Guard regression + mutation/re-restore | policy unit test red/green | PASS | receipts + live re-run |
| Actual stream→query adapter boundary | real worker Collection into real BaseQueryBuilder; constructor equality with real SDK query collection | PASS | receipts + live re-run |
| Native stream lifecycle (preload/close) | real endpoint snapshot consumption; native close; zero subscriptions afterward | PASS | receipts + live re-run |
| Production Fresh SSR + bundling | locked-toolchain Vite production build + `deno serve --frozen --cached-only` + Playwright | PASS (reached independently within the focused three) | receipts + live re-run |
| Loading/empty/data/repeated-updates/SDK data/responsive widths/unmount subscriber-zero/zero browser errors | full Playwright script | PASS | receipts + live re-run |
| Fixture mutation (plain-object factory) on actual-boundary and production SSR | red on both, restored pass | PASS | mutation receipts + restored receipts |
| Full SDK/Fresh suite | 524 pass / 0 fail / 0 ignored | PASS | receipts + live re-run |
| Corpus exact-source freshness + corpus regressions | `check:mcp-export-corpus` + suite | PASS | receipts + live re-run |
| Carrier freshness | `check:assets-barrel` | PASS | receipt |
| JSR audits + raw publish dry-runs (both packages) | audit + dry-run | PASS | receipts; `Success Dry run complete` both |
| Scoped/type-fixture frozen checks, scoped lint/fmt | structured wrappers | PASS | receipts + live re-run |
| quality:gate (quality:scan + arch:check incl. new DB dependency-quality route) | exit 0 | PASS | receipts + live re-run |
| Doc lint (all-export, raw) | remains `exit 1`, unchanged from baseline per entrypoint | DEBT_ACCEPTED | row `db-doc-baseline-2039` adjudicated above |

## Verdict

| Field     | Value |
| --------- | ----- |
| Verdict   | `PASS` |
| Rationale | Approved plan contract (D1–D4, S2–S5) implemented and jointly proven by raw receipts and this session's independent re-runs at exact HEAD `51d074443efa241af0d24153a6de608f78ef429b`: exact qualified family pinned in manifests/catalog/lock with zero unrelated identity drift; durable cold complete-identity guard wired into dependency quality with mutation-then-restore discipline; additive native optional lifecycle members matching the upstream type surface (no casts/ignores/reexports); actual worker-schema Collection crossing the actual adapter boundary with constructor identity vs the actual SDK query collection; production Fresh SSR/hydration/update/teardown with zero browser errors and fixture output cleanup; all static/fitness/runtime/consumer gates green (or already-debted baseline); proposed `db-doc-baseline-2039` explicitly adjudicated DEBT_ACCEPTED with unchanged per-entry baseline; no unrecorded doctrine violation introduced or deepened. The single non-trivial finding (missing SKILL chapters in run briefs) is a run-artifact hygiene item: recording it is the honest outcome, and failing the implementation over template text would be disproportionate; the owner may overrule. |

## Owning release follow-ups (explicit, per protocol and plan risk register — not claimed by this evaluation)

- Publication of qualified versions, the exact qualified published-consumer sweep, and EIS (downstream application) DB-pin / identity-workaround removal remain **owner follow-ups** after a coordinated release (PLAN-EVAL accepted this deferral); a source merge alone does not unblock removal of downstream pins.
- This evaluation authorizes no merge, no merge-readiness label, no release cut, no additional PR state change; commits and PR comments are the generator's subsequent close-out responsibility, including the `db-doc-baseline-2039` status flip to `open` (adjudicated PASS) and the SKILL-chapter append in the run briefs.
- Re-evaluation for any post-close-out text-only close-out change is not required by protocol since implementation is not altered.

*— End of IMPL-EVAL (fix-db-collection-runtime-family--c2) — evaluator session independent of the generator; no delegation, no source/branch/history/public-state mutation, no unrelated gates, no CI polling or sleeps.*
