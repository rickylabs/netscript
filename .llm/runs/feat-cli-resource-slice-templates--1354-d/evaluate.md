# Evaluation: Slice D neutral resource template family — formal IMPL-EVAL

Filled from `.llm/harness/templates/evaluate.md`. Allowed result values: `PASS`, `FAIL`, `N/A`,
`PENDING_SCRIPT`, `DEBT_ACCEPTED`, `NOT_RUN`. Anti-pattern status values: `CLEAR`, `VIOLATION`,
`DEBT_ACCEPTED`, `N/A`.

## Metadata

| Field          | Value                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| Run ID         | `feat-cli-resource-slice-templates--1354-d`                                               |
| Attested head  | `5fd40ef1368bce264ec2aa5f8ab66bd301f8e340` (verified `git rev-parse HEAD`; tree clean)    |
| Stacked base   | `f2696ea88700b7f8e9db3a77a307719e802bc7f9` (`origin/feat/cli-resource-slice-contract`; verified as sole parent of HEAD) |
| PR             | none yet — owner-directed lifecycle (drift.md) opens the non-draft PR after this eval     |
| Target         | `packages/cli` internal assets, typed carrier, and application renderer (Slice D of #1354) |
| Archetype      | `6 — CLI / Tooling`                                                                       |
| Scope overlays | Fresh 2.x generated route/island/form/partial/stream shapes; static/consumer validation only |
| Evaluator      | Separate native Claude Fable 5 session, 2026-09-02                                        |

### Evaluator identity (requested vs observed)

| Field  | Requested                                                            | Observed                                                                                  |
| ------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Route  | fresh native opposite-family formal IMPL-EVAL session (`supervisor.md`: Native Claude Fable 5 / medium) | Claude Code session `session_01RzoTEujrWaZjRysSYzSk8T`, model `claude-fable-5`             |
| Author | Codex / GPT-5 family implementation session (`supervisor.md`)        | no product byte authored by this session; only this `evaluate.md` written                  |
| Effort | per `lane-policy.md`                                                 | session default; no explicit effort attestation surface in this transport                  |

Generator ≠ evaluator holds. `rtk` is absent in this environment (exit 127), matching the run's
recorded drift; wrapper-sourced structured commands were used for all verdict evidence.

## Authority read

- Master plan: `git show origin/feat/cli-resource-slice-plan:.llm/runs/feat-cli-resource-slice--1354/plan.md`
  — D3 (selection → render → conflict → write order, marker format, prior-canonical transition
  comparison), D4 (one neutral family + one planner, no extension point, no service-query copy,
  convergence deferred to F), D7 (emitted file contract, directory-role headers, cache path), Slice D
  section (18-file expected touch set, required gates, carrier exemption), and the Slice C 14-child
  observation.
- Run artifacts: `plan.md`, `research.md`, `implement.md`, `worklog.md` (§ Design present),
  `drift.md` (4 entries), `context-pack.md`, `supervisor.md`.
- Protocol: `.llm/harness/evaluator/protocol.md`, `verdict-definitions.md`, `netscript-harness`,
  `netscript-cli`, `deno-fresh`, `netscript-doctrine`, `jsr-audit` skills.

## Process Verification

| Check                                  | Result | Evidence                                                                                                                                      |
| -------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Plan-Gate passed before implementation | `PASS` | `PLAN-EVAL: N/A` recorded in leaf `plan.md` § Locked scope and `worklog.md` bootstrap; the master plan carries its own evaluated PLAN-EVAL and the owner forbids re-planning for this leaf. |
| Design section exists in worklog       | `PASS` | `worklog.md` § Design: public surface (none), vocabulary, ports (`TemplatePort` only), constants (eleven keys, form→partial→stream order), one commit slice, deferred scope, contributor path. |
| Commit slices match design plan        | `PASS` | Exactly one implementation commit `5fd40ef13` on parent `f2696ea88`; `git diff --name-status` = 18 product paths + 7 run artifacts; `deno.lock` untouched. |
| Each slice has a passing gate          | `PASS` | All required Slice D gates independently re-run green at the attested head (Gate Results below), including the post-commit freshness set the worklog left pending. |
| No speculative seams (unused files)    | `PASS` | Every added template is mapped by the closed renderer roster and loaded by the typed carrier; grep for `loadResourceSliceTemplateAssets`/`ResourceSliceTemplateAssets` outside the carrier finds only `render-resource-slice.ts` and its test — no premature consumer, no dead file. |
| Constants used for finite vocabularies | `PASS` | Eleven `TEMPLATE_KEYS.resourceSlice*` manifest constants; closed `TEMPLATE_ASSET_NAMES` map with a throw on any unregistered name (`render-resource-slice.ts:97-101`); no string-literal template dispatch. |
| Brief carries `## SKILL` chapter       | `PASS` (see LOW-1) | The evaluator brief (this session's prompt) carries `## SKILL`. `implement.md` as recorded lacks one — LOW-1, non-blocking; `worklog.md` bootstrap documents the skills/doctrine actually read. |
| Close-gate                             | `N/A`  | No PR yet; slice is `Refs #1354` partial work with no closing keyword planned; close-gate applies at ready-merge, owned by the supervisor.       |
| Release-gate class                     | `N/A`  | Not a cut or release-gating run.                                                                                                                |

## Judgement against the caller's specific criteria

### 1. Exact 18 product paths — `PASS`

`git diff --name-status f2696ea88..5fd40ef13` minus the 7 `.llm/runs/feat-cli-resource-slice-templates--1354-d/`
artifacts is exactly the master plan's Slice D enumeration, item for item: the eleven
`assets/resource-slice/**.template` files (numbered 1–11), `assets/manifest.ts` (12, additive keys
only), `adapters/templates/scaffold-template-assets.ts` (13, additive carrier), new
`render-resource-slice.ts` (14) and `render-resource-slice_test.ts` (15), `assets/resource-slice/README.md`
(16), modified `plan-resource-slice_test.ts` (17), and regenerated `embedded.generated.ts` (18).
Nothing outside this set. Note the planned path `resource-slice/(_components)/resource-summary.tsx.template`
lands exactly as enumerated; the partial route template is `resource-slice/partials/summary.tsx.template`
as planned. `deno.lock` is untouched.

### 2. Carrier generation provenance — `PASS`

`deno task check:assets-barrel` at the attested head regenerates via `gen:assets-barrel` and
`git diff --exit-code` over all seven generated carriers exits 0 — `embedded.generated.ts` is a true
regeneration of the manifest, not hand-edited. `check:publish-assets` (gen with `--check`) exits 0,
so the new template family is inside the publish asset surface. `check:mcp-export-corpus` exits 0
with `{packageCount:35, subpathCount:273, symbolCount:7816}` — byte-consistent with the worklog's
recorded cascade output, confirming no public-surface movement.

### 3. Slice C read-only except the named test — `PASS`

Within `application/resource-slice/`, the diff contains only the modification of
`plan-resource-slice_test.ts` (one additive roster-parity test importing `TEMPLATE_KEYS`) plus the
two new Slice-D render files. `resource-slice-contract.ts`, `plan-resource-slice.ts`, all three
reconcilers, and their tests are byte-identical to the base (absent from `--name-status`).

### 4. No command or init activation — `PASS`

No file under `src/public/` is touched (`generate-group.ts`, `public-command-dependencies.ts`,
command tree all unchanged); no scaffold writer or init template is touched. Grep confirms the only
consumers of the new carrier are the renderer and its test. The family is inert until Slice E/F, as
D4 requires; init keeps its old copies.

### 5. D3 prior canonical page/view transitions — `PASS`

`renderResourceSlice` attaches `previousCanonicalContents` to page and view leaves only, rendering
every strict subset of the selected options that contains `core` (`strictOptionSubsets`,
`render-resource-slice.ts:231-245`). Independently re-run tests prove: a full
`--form --partial --stream` render records exactly 7 strict predecessors per page/view leaf with
marker option sets `core`, `core+form`, `core+partial`, `core+form+partial`, `core+stream`,
`core+form+stream`, `core+partial+stream`; each single-option render records `[core]` and changes
only the `page` and `view` roles versus core while adding exactly its declared leaves
(form: form-component + form-contract; partial: partial-route + summary-component; stream:
stream-island). Every candidate content passes `parseOwnedResourceSliceLeaf` — the byte-canonical
schema-1 marker from Slice C — so the reconciler's `isCanonicalAdditiveTransition` has exactly the
prior renderings D3 step 2 requires. Golden SHA-256 hashes pin all four selections' full content.

### 6. D4 neutrality — `PASS`

- Grep over the family for `viewer`, `withPolicy`, `withTelemetry`, `\bhero\b`, `notes-card`,
  `JSON.parse`, `fetch(`, `: any`/`as any`, and handwritten `queryKey: [` arrays: zero matches
  (the form's neutral `note` field is a plain string field, not the retired notes layer). The render
  test enforces the same forbidden-pattern set on rendered output.
- The cache path is exactly D7's contract: selected factory `queryOptions` + `clientKey` through
  `createNetScriptQueryClient().fetchQuery`, `dehydrateQueryClient`, `cachedAt`, `QueryIsland` +
  `useIslandQuery` with `initialData`/`initialDataUpdatedAt: props.cachedAt` (the #1664 behavior).
- No extension point: the renderer's template roster is a closed typed map that throws on an
  unregistered name; the README states "there is no neutral-template extension registry" and admits
  variables only when derived from `ResourceSlicePlan`.
- `service-query.ts.template` is not copied — no such key or file exists in the family, and #1664's
  template and add-ui surface are untouched.
- Directory-role headers land once per helper directory in the always-present first file
  (`(_components)` on view, `(_islands)` on island, `(_shared)` on loaders, `(_lib)` on the form
  contract — a form-only selection still renders core, so each header's carrier always exists);
  sibling optional leaves do not repeat them, matching D7 and the README contract.
- Route sidecar is Fresh Form B (`defineRouteContract` sidecar; page uses
  `.withRoute(appRoutes.{{routeAlias}})`, never `withRouteContract`); the partial uses
  `definePartial` with the derived `{{partialName}}`/`{{partialRoute}}`; the stream island is an
  isolated `@netscript/fresh/streams` consumer. Templates contain no IO and no command parsing.

### 7. Actual resource-slice child count — `PASS` (12, drift-recorded)

`ls application/resource-slice/` = 12 direct children. The master plan predicts 14 after A+C+D, but
the mandated stacked base contains Slice C's ten files and not Slice A's selector pair; drift.md
records this sequencing observation with the correct instruction not to manufacture the count.
`arch:check` output contains zero `resource-slice` findings — 12 is at, not above, the F-16 cap of
12, so no WARN exists to record yet; the 14-child WARN materializes when A is assembled.

## Gate Results (independently re-run at `5fd40ef13`)

| Gate                        | Command                                                                                             | Result | Evidence                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| Focused planner/render tests | `run-deno-test.ts -- --allow-all …/plan-resource-slice_test.ts …/render-resource-slice_test.ts`     | `PASS` | exit 0; 12 passed / 0 failed / 0 ignored — includes golden hashes, option deltas, strict-predecessor proof, and roster parity |
| Consumer-shaped typecheck    | inside `render-resource-slice_test.ts` (`full render type-checks as a consumer without starting a server`) | `PASS` | temp fixture writes all 11 rendered leaves + `createQueryFactories` consumer stubs; subprocess `deno check` exit 0; no server started |
| Structured check             | `run-deno-check.ts --root packages/cli --ext ts,tsx`                                                | `PASS` | exit 0; 928 files, 8 batches, 0 failed batches, 0 diagnostics                                                      |
| Scoped lint                  | `deno lint --config <task-local: recommended tags>` on the 5 changed hand-authored TS files          | `PASS` | exit 0, "Checked 5 files". Root `deno.json` excludes `packages/cli` so the wrapper refuses `all-excluded` — the pre-existing repo config fact recorded in this run's worklog and the Slice C eval (LOW-3 carryover), not a slice defect. |
| Scoped fmt                   | `deno fmt --check --config <task-local>` on the same 5 files                                        | `PASS` | exit 0, "Checked 5 files"                                                                                          |
| `check:assets-barrel`        |                                                                                                      | `PASS` | exit 0; regeneration byte-identical across all seven generated carriers                                            |
| `check:publish-assets`       |                                                                                                      | `PASS` | exit 0                                                                                                             |
| `check:emitted-samples`      |                                                                                                      | `PASS` | exit 0; 48 emitted TypeScript samples from 38 artifact paths checked                                               |
| `check:mcp-export-corpus`    |                                                                                                      | `PASS` | exit 0; 35 packages / 273 subpaths / 7,816 symbols — matches worklog cascade record                                 |
| `deno task arch:check`       |                                                                                                      | `PASS` | exit 0; zero `resource-slice` occurrences; only pre-existing WARNs in unrelated packages                            |
| `deno task quality:scan`     | (with `arch:check` = `quality:gate`)                                                                 | `PASS` | exit 0; `findings: []`; allowance census unchanged at 7 (all pre-existing #1276 entries)                            |
| `deno task publish:dry-run`  |                                                                                                      | `PASS` | exit 0; "Success: Dry run complete" across the workspace — JSR publishability of `packages/cli` with the new assets holds |
| `docs:readme-fences`         |                                                                                                      | `PASS` | exit 0; `type_errors=7` = held baseline (new `assets/resource-slice/README.md` introduces no fence regression)      |
| `docs:jsdoc-examples`        |                                                                                                      | `PASS` | exit 0; deferred census `unboundName=116` = held baseline                                                           |
| jsr-audit rubric             | publish surface spot-check                                                                           | `PASS` | no new public export from `packages/cli` (manifest/carrier/renderer are internal); templates ship via the regenerated embedded carrier and publish-assets surface; publish dry-run green; no slow-type risk added |
| Server / browser / Aspire / Docker / `e2e:cli` |                                                                                    | `N/A`  | prohibited for this slice (D11); none started                                                                       |

## Anti-pattern / doctrine status

| Item                                  | Status  | Evidence                                                                                                      |
| ------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| AP-1 / F-1 file size                  | `CLEAR` | largest new file `render-resource-slice_test.ts` 445 lines; renderer 249 lines                                  |
| Layering (application ↔ IO, F-3)      | `CLEAR` | renderer imports only the carrier type, `TemplatePort`, and the Slice C contract; zero `Deno.*`/fs/network in application code (test IO is test-local fixture plumbing) |
| Folder cardinality (F-16)             | `CLEAR` | 12 children = cap; zero `resource-slice` output in `arch:check`                                                 |
| Template asset hygiene                | `CLEAR` | templates contain no IO, no command parsing, no `any`, no raw fetch, no manual JSON parsing                     |
| Console / `any` / casting             | `CLEAR` | `quality:scan` findings empty; no new `deno-lint-ignore` or `as unknown as` in the diff                         |
| Architecture debt delta               | `CLEAR` | `debt/arch-debt.md` untouched; new entries 0, resolved 0, deepened 0, unrecorded 0                              |

## Findings (severity-ranked)

### LOW-1 — `implement.md` lacks a `## SKILL` chapter

Protocol rule 13 requires every recorded agent brief/prompt to carry a `## SKILL` chapter.
`implement.md` in this run dir has none. Non-blocking: the worklog bootstrap explicitly records the
skills, harness references, doctrine, and Fresh surfaces read before implementation, and the
evaluator brief in scope (this session's) carries its chapter. Recommend adding the chapter when the
supervisor commits this evaluation, so the recorded prompt matches the rule for future audits.

### Observation (not a finding) — worklog gate table is labeled pre-commit

`worklog.md` records its gate evidence as pre-commit and leaves the post-commit freshness/quality
boxes unchecked. This evaluation independently supplies all of them green at the attested head; the
supervisor should tick the carrier-cascade/full-gates progress boxes and append the post-commit
results when recording this verdict, keeping the run resumable.

## Lessons for Promotion

| Lesson | Pattern | Applies to | Confidence |
| ------ | ------- | ---------- | ---------- |
| Strict-subset predecessor rendering | Recording every strict prior option subset at render time gives the reconciler exact canonical bytes for additive transitions without a migration engine | Archetype 6 template families | medium |

## Verdict

| Field     | Value  |
| --------- | ------ |
| Verdict   | `PASS` |
| Rationale | The commit at `5fd40ef13` lands exactly the master plan's 18 Slice D product paths on the mandated stacked base with nothing else touched and `deno.lock` unchanged. The eleven-template family is neutral by grep and by test (no viewer/policy/telemetry/hero/notes, no raw fetch, `any`, handwritten query keys, or manual JSON parsing), has no extension point (closed typed roster, throw on unregistered), does not copy the service-query template, and is consumed by no command or init path. The renderer satisfies D3 by attaching byte-canonical strict-subset predecessors to page/view leaves — proven by the 7-predecessor combined-render test and the single-option delta tests — with schema-1 markers parseable by the Slice C contract. Carrier provenance is proven by regeneration (`check:assets-barrel` byte-identical). All required gates were independently re-run green at the attested head: focused tests 12/12 with the no-server consumer typecheck, package check 928/0, scoped lint/fmt clean, all four freshness checks, `arch:check`/`quality:scan` exit 0 with no new findings, publish dry-run success, and both doc baselines held. The 12-child count (vs the plan's assembled 14) is a correctly drift-recorded stacking fact, not a deviation. The two LOW items are bookkeeping and do not block. |
| Next step | Supervisor records this verdict (ticking the worklog progress boxes and ideally adding the `## SKILL` chapter to `implement.md`), pushes, and opens the owner-mandated non-draft stacked PR (`Refs #1354`, base `feat/cli-resource-slice-contract`, `status:impl`) per drift.md. |

[PHASE: IMPL-EVAL] [VERDICT: PASS]
