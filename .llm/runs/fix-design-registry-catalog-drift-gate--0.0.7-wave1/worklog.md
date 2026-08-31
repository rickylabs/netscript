# Worklog: generated design registry catalog drift gate

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-design-registry-catalog-drift-gate--0.0.7-wave1` |
| Branch | `fix/design-registry-catalog-drift-gate` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `frontend` |

## Design

### Public Surface

- No package export or CLI command changes.
- Generated consumer surface: `registryMeta`, `registryCatalog`, and the new
  `registryCollections` constant in the app-owned `(_shared)/registry.ts` asset.
- Authoritative package surface remains `freshUiRegistryManifest` from
  `@netscript/fresh-ui/registry`.

### Domain Vocabulary

- `RegistryCatalogItem` — generated gallery projection of manifest name/kind/layer/description.
- `RegistryCatalogCollection` — generated gallery projection of manifest collection name/item
  membership.
- `RegistryCatalogSnapshot` — test-only parsed projection containing meta, items, and collections.
- `RegistryCatalogDrift` — test-only named missing/extra/changed differences.

### Ports

- No new runtime port. The test-only filesystem read consumes Deno's declared test permission and
  is excluded from both package publish graphs.
- Existing CLI spine remains unchanged: `CliCommand<Input, Result>`, `CliCommandGroup`, `CliRoot`,
  `UseCase<Input, Result>`, and `Registry<TKey, TValue>`.

### Constants

- `registryMeta` — `name`, `version`, `packageName`, and exact item `total`.
- `registryCatalog` — ordered 66-item static projection.
- `registryCollections` — ordered eight-collection static membership projection.
- No new command-name, exit-code, output-format, adapter, permission, or layer-2 abstract constant.

### Archetype-6 Design Checkpoint

- Command surface/public flow APIs: unchanged; `ui:add`, `ui:list`, and `ui:update` keep consuming
  the live `freshUiRegistryManifest` through `kernel/application/ui/registry.ts`.
- Extension axis: Fresh UI registry item name → manifest item. Population remains in
  `packages/fresh-ui/registry.manifest.ts`; CLI flows consume the live map and the generated route
  consumes its checked static projection.
- Generated output: only `routes/(design)/design/(_shared)/registry.ts` content changes.
- Adapters/ports/permissions: unchanged; no new runtime IO.
- Composition declarativity and vertical feature catalog: unchanged.
- Semantic test strategy: parse the generated TypeScript constants and compare exact domain values
  to the manifest, including symmetric negative fixtures.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| S0 | Bootstrap red research and locked design. | Red probe exit 0 with 66/50/16; artifact review. | Run dir only. |
| S1 | Complete item and collection projections. | Focused catalog inventory/check/fmt. | CLI registry template + run bookkeeping. |
| S2 | Enforce semantic bidirectional drift gate. | Structured focused/package tests + static/fitness/JSR gates. | Fresh-ui drift test + run bookkeeping. |

### Deferred Scope

- `fresh-browser` route validation — explicitly lease-gated by the coordinator.
- Tier-A review/sign-off and opposite-family IMPL-EVAL — separate sessions owned by the
  orchestrator/coordinator.

### Contributor Path

Add or change a registry item once in `packages/fresh-ui/registry.manifest.ts`; the focused
`registry-doc-drift.test.ts` gate then names exactly what must be regenerated in the CLI catalog
template, including collection/meta drift. A contributor updates that one template projection and
reruns the focused test.

## PLAN-EVAL Decision

`PLAN-EVAL: N/A` — justified before implementation. This is a small mechanical repair with a
complete frozen contract, exact authoritative/source and consumer files, measured symmetric diff,
explicit acceptance criteria, and predetermined gates. No architecture, sequencing, scope, risk,
or trade-off decision remains that would benefit from a separate plan evaluator. IMPL-EVAL remains
mandatory and separate after implementation.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-15T07:46:21+02:00 | S0 | research | Reproduced 66 manifest items versus 50 catalog items; named all 16 missing and confirmed 0 extra. |
| 2026-08-15T07:46:21+02:00 | S0 | root cause | Confirmed renderer covers all kinds; independent incomplete static snapshot is the defect. |
| 2026-08-15T07:46:21+02:00 | S0 | plan | Locked static projection + semantic symmetric test; recorded `PLAN-EVAL: N/A`. |
| 2026-08-15T07:52:00+02:00 | S1 | implement | Added the 16 omitted items at their authoritative manifest positions, changed the declared total to 66, and added all eight ordered collection memberships. |
| 2026-08-15T07:52:00+02:00 | S1 | gate | Semantic data-URL import probe returned exact item/meta/collection projections, 0 missing, 0 extra, raw exit 0. |
| 2026-08-15T07:52:00+02:00 | S1 | reconcile | Issue #1358 remains open; draft PR #1657 carries `Closes #1358`, milestone 0.0.7, required type/area/priority/gate labels, and exactly one `status:plan` pending the S1 phase transition. No new reviewer comments existed before this slice. |
| 2026-08-15T08:00:11+02:00 | S2 | implement | Added an exact semantic manifest/catalog comparator, the live positive gate, and named symmetric/field negative fixtures. The test imports the authoritative manifest directly and reads the CLI template only in the test process. |
| 2026-08-15T08:00:11+02:00 | S2 | iterate | The first focused test run failed because it imported the simplified public registry projection rather than the authoritative manifest; corrected that one import. Early broad wrapper selections also included excluded nested workspace/E2E files, and a check invocation duplicated the wrapper's automatic `--unstable-kv`; all are retained below as non-verdict command-selection failures. |
| 2026-08-15T08:00:11+02:00 | S2 | gate | Corrected focused/package structured check, test, lint, and format gates pass. `quality:scan`, `arch:check`, both JSR package audits, and both publish dry-runs pass with raw exit 0. Exact internal `@netscript/*` imports remain pinned to `0.0.6`. |
| 2026-08-15T08:00:11+02:00 | S2 | boundary | All authorized non-browser implementation gates are complete. `fresh-browser` is now the exact next gate and requires a fresh coordinator lease; Aspire, Docker, CLI E2E, and browser suites remain untouched. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| Preserve a static app-owned catalog projection | Maintains copy ownership and avoids published runtime asset/import-meta reads. | plan LD-1; fresh-ui copy-fidelity contract; JSR audit |
| Add collection projection | Issue acceptance requires exact membership, absent from current catalog. | issue #1358; plan LD-2 |
| Use semantic fixtures, not source mutation | Proves both failure directions without destructive edits or giant snapshots. | AP-18; plan LD-5 |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Frontend overlay references absent `.claude/05-frontend.md`. | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| Red inventory | `deno eval` command recorded in `research.md` | PASS (exit 0) | Reproduced 66/50/16 before edits. |
| S1 semantic catalog inventory | data-URL import of the generated TypeScript template compared to `freshUiRegistryManifest` | PASS (exit 0) | 66/66 items, 0 missing, 0 extra, exact ordered item/meta and eight-collection membership projections. |
| Template format-wrapper probe | `run-deno-fmt.ts --file <registry.ts.template> --ext template --pretty` | NOT_RUN (wrapper exit 2) | Wrapper correctly refused false green because Deno excludes `.template`; it is not claimed as formatting evidence. Scoped TypeScript formatting remains an S2 gate. |
| First focused drift test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read packages/fresh-ui/tests/registry-doc-drift.test.ts` | FAIL (exit 1) | Honest implementation iteration: the test initially imported the simplified public registry projection; corrected to `registry.manifest.ts`. |
| Early broad check selection | root `run-deno-check.ts` selection with explicit `--unstable-kv` | NOT A VERDICT (exit 1) | The wrapper already supplies `--unstable-kv`, so the duplicated flag was rejected; the selection also reached nested CLI E2E files. |
| Early broad lint selection | root `run-deno-lint.ts` broad selection | NOT A VERDICT (exit 2) | Selection included excluded nested/workspace files; wrapper refused a false green. |
| Early broad format selection | root `run-deno-fmt.ts` broad selection | NOT A VERDICT (exit 2) | Selection included excluded nested/workspace files; wrapper refused a false green. |
| Focused drift test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read packages/fresh-ui/tests/registry-doc-drift.test.ts` | PASS (exit 0) | 5 passed, 0 failed, including live equality and named negative fixtures. |
| CLI structured check | `(cd packages/cli && deno run --allow-read --allow-run ../../.llm/tools/run-deno-check.ts --cwd . --file bin/netscript.ts --file bin/netscript-dev.ts --file mod.ts --file maintainer.ts --file scaffolding.ts --file testing.ts)` | PASS (exit 0) | Six public CLI entry points selected; wrapper supplies `--unstable-kv`; 0 failed batches. |
| Fresh UI structured check | `(cd packages/fresh-ui && deno task check)` | PASS (exit 0) | Package task invokes the structured wrapper; 150 files selected, 0 failed batches, frozen lock. |
| Focused lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file packages/fresh-ui/tests/registry-doc-drift.test.ts` | PASS (exit 0) | One file selected; no findings. |
| Focused format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/fresh-ui/tests/registry-doc-drift.test.ts` | PASS (exit 0) | One file selected; no findings. |
| Fresh UI package tests | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --lock=packages/fresh-ui/deno.lock --frozen packages/fresh-ui/tests` | PASS (exit 0) | 172 passed, 0 failed. No browser/server/E2E suite ran. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| `quality:scan` | PASS (exit 0) | `deno task quality:scan` | No findings; seven existing reviewed allowances. |
| `arch:check` | PASS (exit 0) | `deno task arch:check` | No failures; existing repository warnings remain informational/non-blocking. |
| CLI JSR audit | PASS (exit 0) | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text` | Public exports audited; dry-run OK. Existing doctrine/slow-type warnings only. |
| Fresh UI JSR audit | PASS (exit 0) | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/fresh-ui --text` | Public exports audited; dry-run OK. Existing doctrine/slow-type warnings only. |
| Exact internal pins | PASS (exit 0) | `rtk grep -n 'publish:dry-run|@netscript/' packages/cli/deno.json packages/fresh-ui/deno.json` | Every touched package's `@netscript/*` import is exactly pinned to `0.0.6`; no dependency files changed. |
| CLI publish dry-run | PASS (exit 0) | `(cd packages/cli && deno task publish:dry-run)` | Isolated-declaration checks and publish simulation completed. Existing analyzability warnings include pre-existing runtime dynamic/import-meta sites; this slice introduced none. |
| Fresh UI publish dry-run | PASS (exit 0) | `(cd packages/fresh-ui && deno publish --dry-run --allow-dirty)` | Isolated-declaration checks and publish simulation completed without runtime asset/import-meta warnings. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Aspire/Docker/E2E | NOT_RUN | coordinator prohibition | No lease; must remain untouched. |
| `fresh-browser` | NOT_RUN | coordinator lease boundary | Stop when this is the remaining gate. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Generated `/design/components` route | STATIC PASS; BROWSER NOT_RUN | Semantic catalog gate exit 0 | Static catalog now contains all 66 manifest items and eight collections; browser proof is lease-gated. |

### S1 Gate Detail

| Assertion | Observed |
| --- | --- |
| Manifest/catalog items | 66 / 66 |
| Missing / extra | 0 / 0 |
| Ordered name/kind/layer/description projection | exact |
| Manifest/catalog collections | 8 / 8 |
| Ordered collection membership projection | exact |
| Meta name/version/package/total | exact |

## Handoff Notes

- First inspect the semantic comparator and its named symmetric diagnostics.
- Verify the template contains all 66 items and eight collections and that no published runtime
  asset/import-meta read was introduced.
- Do not treat green automated gates as Tier-A sign-off.
- Exact blocker: obtain a fresh coordinator lease for `fresh-browser`; after that gate, the topic
  orchestrator owns substantive Tier-A review/sign-off and a separate opposite-family IMPL-EVAL.

## Leased `fresh-browser` Gate — 2026-08-15

The coordinator granted exactly one pass for PR #1657 at immutable product head
`4a3c40321ac1e58aa337e02afeaa95fbc553ce7f`. The gate was invoked once, reached a terminal verdict,
and was not retried.

### Preflight

| Check | Raw exit | Evidence |
| --- | --- | --- |
| Local tree/head | 0 | Clean; HEAD `4a3c40321ac1e58aa337e02afeaa95fbc553ce7f`. |
| Remote branch | 0 | `origin` branch resolved to the same immutable head. |
| Draft PR #1657 | 0 | PR head matched the immutable head; PR remained draft. |
| Browser runtime cache | 0 | `chromium-1232`, `chromium-1234`, and matching headless-shell caches already present; no installation needed. |
| Chromium/Playwright processes | 0 | Actual-process match count `0`. |
| Receipt uniqueness | 0 | `receipts/fresh-browser.json` did not exist before invocation. |

### Terminal Verdict

Exact command:

```text
deno run --allow-read --allow-write --allow-run --allow-env \
  .llm/tools/gates/run-gate.ts --gate fresh-browser --id fresh-browser-1657 \
  --cwd packages/fresh \
  --output .llm/runs/fix-design-registry-catalog-drift-gate--0.0.7-wave1/receipts/fresh-browser.json
```

| Field | Value |
| --- | --- |
| Raw exit code | `0` |
| Receipt outcome | `PASS` |
| Receipt path | `.llm/runs/fix-design-registry-catalog-drift-gate--0.0.7-wave1/receipts/fresh-browser.json` |
| Receipt `gitHead` / `actualGitHead` | `4a3c40321ac1e58aa337e02afeaa95fbc553ce7f` / same |
| Attempt | `1` |
| Duration | `33292ms` |
| Child verdict | 2 passed, 0 failed |
| Playwright installation | Not needed; existing cached Chromium was used. |

### Post-gate Cleanup Proof

| Check | Raw exit | Output |
| --- | --- | --- |
| Chromium/Playwright processes | 0 | Actual-process match count `0`; no survivor attributable to the gate. |
| `aspire ps` | 0 | `No running AppHost found.` |
| `docker ps -a` | 0 | Header only; zero containers. |
| Lock diff from leased head | 0 | `deno.lock`, CLI lock, and Fresh UI lock unchanged. |

No product source changed during the leased gate. Automated evidence is not Tier-A review or
IMPL-EVAL; this implementation thread stops after committing/pushing the receipt and bookkeeping.

## Bounded Tier-A T-3 Repair — 2026-08-15

Coordinator amendment head: `c5e06661b1b957f64f86b8bd6aec8da7c3dd2064`. This section is
append-only; every earlier review, receipt, and gate row remains unchanged.

N1 clarification: `registryMeta.total` and `registryMeta.version` remain static template literals;
their equality with the manifest is enforced by the semantic drift gate rather than computed during
generation.

### Ownership Repair

- Both `pull_request.paths` and `push.paths` in `fresh-ui-quality.yml` now own
  `packages/cli/src/kernel/assets/app/routes/(design)/**`.
- `ci-classify-changes.ts` mirrors that exact ownership through the normalized prefix
  `packages/cli/src/kernel/assets/app/routes/(design)/`, setting `freshUi: true` only for that
  design-asset subtree in addition to `packages/fresh-ui/**`.
- The positive test verifies a catalog-template-only diff requests Fresh UI and that the workflow
  contains the same filter twice; the negative test verifies an unrelated CLI file does not request
  Fresh UI.

### Repair Gate Evidence

| Gate | Exact command | Raw exit | Result |
| --- | --- | ---: | --- |
| Red positive fixture | `run-deno-test.ts -- --allow-read .github/scripts/ci-classify-changes.test.ts` | 1 | Expected pre-fix failure: `POSITIVE: CLI design assets request the Fresh UI gate` observed `needsFreshUi=false`; 61 passed, 1 failed. |
| Classifier/workflow suite | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read .github/scripts/ci-classify-changes.test.ts` | 0 | 62 passed, 0 failed, including workflow structure. |
| Positive ownership test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read --filter 'POSITIVE: CLI design assets request the Fresh UI gate' .github/scripts/ci-classify-changes.test.ts` | 0 | 1 passed, 0 failed. |
| Negative scope test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read --filter 'NEGATIVE: unrelated CLI changes do not request the Fresh UI gate' .github/scripts/ci-classify-changes.test.ts` | 0 | 1 passed, 0 failed. |
| Existing registry drift test | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-read packages/fresh-ui/tests/registry-doc-drift.test.ts` | 0 | 5 passed, 0 failed. |
| Structured check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file .github/scripts/ci-classify-changes.ts --file .github/scripts/ci-classify-changes.test.ts` | 0 | 2 files, 0 failed batches; wrapper supplied `--unstable-kv`. |
| Scoped lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --file .github/scripts/ci-classify-changes.ts --file .github/scripts/ci-classify-changes.test.ts` | 0 | 2 files, no findings. |
| Initial scoped format verdict | `run-deno-fmt.ts` over the touched workflow + classifier files | 1 | Two TypeScript formatting findings; corrected with targeted `deno fmt`. YAML was not selected by the TypeScript wrapper. |
| Corrected scoped format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file .github/scripts/ci-classify-changes.ts --file .github/scripts/ci-classify-changes.test.ts` | 0 | 2 files, no findings. |
| Code quality | `deno task quality:scan` | 0 | `ok: true`, no findings; seven pre-existing reviewed allowances. |
| Architecture | `deno task arch:check` | 0 | No failures; existing warnings only. |

### Repair Boundaries

- The original four product files are byte-unchanged from amendment head `c5e06661b`.
- `deno.lock`, `packages/cli/deno.lock`, and `packages/fresh-ui/deno.lock` are unchanged.
- `review-tier-a.md`, `receipts/fresh-browser.json`, and `drift.md` are unchanged.
- No `fresh-browser`, Aspire, Docker, CLI E2E, or other expensive gate ran.
- Automated repair gates are not Tier-A sign-off; stop after commit, explicit-refspec push, and one
  structured PR comment for a fresh T-3/N1/N2 review.

## IMPL-EVAL — formal, separate session (2026-08-15)

Fresh separate formal IMPL-EVAL, first and only cycle. Artifact: `evaluate.md`.

| Field | Value |
| --- | --- |
| Evaluated head | `939e7311317365db7681de5e3c7c56a73412424e` (local == `origin` == PR `headRefOid`) |
| Verdict | **`FAIL_FIX`** |
| Transport | Native first-party Claude Code, background session, `/remote-control` enabled |
| Requested route | `claude-opus-5` · effort `medium` (owner-route amendment over lane-policy `Fable 5 · medium`) |
| Observed route | `claude-opus-5` · effort `medium` · `--remote-control` — **matched** |
| Session ID | `04897102-bcd6-4918-8b72-dc0151035883` |
| Bridge / Remote Control | `session_01GbqPgckdxHEZzXzNu7DKNp` |
| PID / job / cwd | `202494` / `04897102` / `/home/codex/repos/netscript-007-leaf-design-registry-drift` |

### Blocking findings

- **E-1** — `packages/cli/src/kernel/assets/embedded.generated.ts` was not regenerated. It is the
  only template source `TemplateRegistry`/`netscript init` reads, and it still carries the 50-item
  catalog with `total: 50` and no `registryCollections`. A scaffolded `/design/components` gallery
  therefore still lists 50 of 66 and still hides the AI collection, so #1358 acceptance boxes 1–3
  are false in generated output. `deno task check:assets-barrel` is **red at the evaluated head**
  (raw exit **1**; exactly one file, one line; regenerated barrel carries `total: 66`), executed in
  a detached scratch worktree so this tree was never mutated. `embedded.generated.ts` is outside the
  contract surface, so the repair needs a coordinator amendment.
- **E-2** — the `assets-barrel` gate appears in no plan validation row, no slice comment, and no run
  artifact; the freshness gate for the changed artifact class was never run by any lane.

### Non-blocking, recorded for the coordinator

- **N-3** — `registryCollections` is exported by the template but consumed by no generated route.
- **R-1** — concurred non-blocking; corrected Tier-A's disposition: this PR also touches four other
  paths already in the same `paths:` filter, so its trigger cannot prove the `(design)` glob.
- **C-1** — all seven #1358 acceptance boxes remain unchecked; boxes 1–3 must not be checked until
  E-1 is repaired.

### Gates re-executed by the evaluator

| Gate | Raw exit | Result |
| --- | ---: | --- |
| `packages/fresh-ui` drift test (frozen lock) | 0 | 5 passed, 0 failed |
| `.github/scripts/ci-classify-changes.test.ts` | 0 | 62 passed, 0 failed |
| `deno task quality:scan` | 0 | `ok: true`, 0 findings, 7 pre-existing allowances |
| `deno task arch:check` | 0 | No failures; existing warnings only |
| `deno task check:publish-assets` | 0 | Fresh |
| `deno task check:assets-barrel` | **1** | **RED** — see E-1 |

Independent catalog recomputation (own probe, not the run's comparator): manifest 66 / catalog 66 /
`registryMeta.total` 66; 0 missing, 0 extra, 0 duplicates; ordered name equality true; 0
`kind`/`layer`/`description` mismatches; 8/8 collections ordered-equal by membership. T-3 classifier
ownership re-derived by executing `classifyPath`, including near-miss prefixes: correctly scoped.

### Evaluator boundaries

- Read-only over source; nothing implemented, nothing fixed. Only `evaluate.md` plus this
  bookkeeping committed.
- No `fresh-browser`, lease, Aspire, Docker, or `e2e:cli`. Post-evaluation `docker ps -a` empty,
  `aspire ps` reports no AppHost.
- PR left `OPEN`, draft, exactly one `status:impl`; `Closes #1358` untouched; no issue mutated; no
  next leaf begun. Single bounded cycle — no evaluator loop, no PLAN-EVAL.

## Bounded E-1 Embedded-Barrel Repair — 2026-08-15

Coordinator amendment head: `c3ccceeb13cd71895ea4ac3229f03a15472dac86`. Prior evidence and
rows remain immutable; this section is append-only.

### Red and Deterministic Regeneration

| Check | Exact command | Raw exit | Evidence |
| --- | --- | ---: | --- |
| Red freshness verdict | `deno task check:assets-barrel` | 1 | Reproduced the evaluator finding; the task regenerated then found the stale CLI barrel. |
| Required regeneration | `deno task gen:assets-barrel` | 0 | Exact delta: `packages/cli/src/kernel/assets/embedded.generated.ts | 2 +-`; one insertion and one deletion on the single generated source line. |

No other generated target moved. The regenerated barrel contains `registryMeta.total: 66` and the
complete catalog content including `citation-chip`. The repair retains no hand edit and adds
`check:assets-barrel` to the bound validation plan. Post-fix gate evidence follows in an append-only
entry after the generated product commit so the durable receipt records that exact Git head.

### Post-Fix Gate Evidence

Product commit: `4ca76fa751608ec1f0e2eab248fcd603f855272b`.

| Gate | Exact command | Raw exit | Result |
| --- | --- | ---: | --- |
| Asset-barrel freshness | `deno task check:assets-barrel` | 0 | Generated outputs are committed and fresh. |
| Durable asset-barrel receipt | `deno run --allow-read --allow-write --allow-run --allow-env .llm/tools/gates/run-gate.ts --gate assets-barrel --id assets-barrel-1657-e1 --cwd . --output .llm/runs/fix-design-registry-catalog-drift-gate--0.0.7-wave1/receipts/assets-barrel.json` | 0 | `PASS`; receipt Git head and actual Git head both `4ca76fa751608ec1f0e2eab248fcd603f855272b`. |
| Structured generated-file check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file packages/cli/src/kernel/assets/embedded.generated.ts` | 0 | One file, one batch, zero failed batches; wrapper supplied `--unstable-kv`. |
| Initial structured generated-file fmt selection | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/cli/src/kernel/assets/embedded.generated.ts` | 2 | Correctly refused false-green because the root fmt config excludes `packages/cli`. No file changed. |
| Package-root structured fmt selection | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli --ext ts,tsx` | 2 | Same intentional root-config exclusion; preserved as command-selection evidence. No file changed. |
| Structured generated-file fmt verdict | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --file packages/cli/src/kernel/assets/embedded.generated.ts --config /tmp/netscript-e1-fmt.json` | 0 | One file, one batch, zero findings using a temporary equivalent formatting config; the config was deleted immediately afterwards. |
| Quality and architecture | `deno task quality:gate` | 0 | `quality:scan` returned `ok: true`; `arch:check` had no failures and only existing warnings. |
| CLI JSR audit | `deno run --allow-read --allow-run --allow-env .llm/tools/fitness/audit-jsr-package.ts --root packages/cli --text` | 0 | Dry-run OK; existing doctrine/slow-type warnings only; no new export, runtime asset-read, or `import.meta` finding from this generated constant. |
| CLI publish dry-run | `cd packages/cli && deno task publish:dry-run` | 0 | `@netscript/cli@0.0.6` simulation succeeded; existing dynamic-import/import-meta analysis warnings only. |

### E-1 Repair Boundaries

- Diff from amendment head contains one product file only:
  `packages/cli/src/kernel/assets/embedded.generated.ts`; all other changed paths are append-only run
  artifacts and the durable receipt.
- The four original product files and all three T-3 CI files are byte-unchanged from amendment head
  `c3ccceeb13cd71895ea4ac3229f03a15472dac86`.
- `deno.lock`, `packages/cli/deno.lock`, and `packages/fresh-ui/deno.lock` are unchanged.
- No `// deno-lint-ignore`, `// quality-allow`, `as any`, or `as unknown as` was added.
- No browser, `fresh-browser`, Aspire, Docker, scaffold runtime, or `e2e:cli` gate ran.
- Automated gate evidence is not self-certification. The terminal blocker is fresh opposite-family
  Tier-A review limited to this repair delta.

## Fresh Tier-A Review of the E-1 Repair Delta — 2026-08-15

Review head `acfb2d2064c057c6d805a2d36fcb09201ca247e5`, resolved three ways (local `HEAD`,
`origin`, PR #1657 `headRefOid`) — all match. Fresh opposite-family reviewer, session
`f7b48b24-96b6-4e62-b1c6-37d6a9ac45e9`, bridge `session_011pmnHd9xRTLDJFJuNL3kEw`, PID `266646`,
route `claude-opus-5` (Anthropic native, high effort). No prior conclusion inherited.

| Check | Exact command | Raw exit | Result |
| --- | --- | ---: | --- |
| Asset-barrel freshness, re-executed | `deno task check:assets-barrel` | 0 | Committed barrel is the generator's fixed point; worktree clean before and after. |
| Structured check, CLI assets | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/src/kernel/assets --ext ts` | 0 | 7 files, 1 batch, 0 findings. |
| Template registry unit tests | `deno test --allow-all --unstable-kv packages/cli/src/kernel/application/registries/template-registry_test.ts packages/cli/src/kernel/adapters/templates/template-asset_test.ts` | 0 | 6 passed, 0 failed. |
| Fresh UI drift gate | `deno test --allow-all --unstable-kv packages/fresh-ui/tests/registry-doc-drift.test.ts` | 0 | 5 passed, 0 failed. |

Barrel decoded directly (not inferred from `total: 66`): the design-catalog value is byte-identical
to the on-disk template (15404 bytes, strict equality), `registryMeta` holds **66** structurally
counted entries, `registryCollections` exports **8** collections including `ai` with 15 items.

Verdict **`PASS_TO_IMPL_EVAL`**, bounded to the repair delta. No blocking findings; three
non-blocking observations (receipt head vs review head, E-2 binding placement, pre-existing
`packages/cli` fmt exclusion) recorded in `review-tier-a.md`. No source modified; no browser,
Aspire, Docker, scaffold-runtime, or `e2e:cli` gate run — `docker ps -a` empty throughout. PR left
`OPEN`, draft, exactly one `status:impl`; `Closes #1358` untouched; no issue mutated.
## IMPL-EVAL — cycle 2, final (2026-08-15)

Fresh separate session `1df19d27-ce81-4027-99ac-49f3b9ec26bc` (PID `299511`,
bridge `session_018WYHfqzFKKve37TL7hsPQD`), native Claude Code `claude-opus-5` ·
effort `medium` · `--remote-control` — owner-route amendment over
`lane-policy.md`'s Fable 5 rendering, recorded in `evaluate.md`. Independent of
the Codex author, the topic orchestrator, the cycle-1 evaluator, and the fresh
Tier-A reviewer.

**Verdict: `PASS`** at head `3d7819203f59e68eb5b45f6871a03c41ca43cd2f` (local ==
`origin` == PR `headRefOid`). Full artifact: `evaluate.md` § "IMPL-EVAL — Cycle
2".

- **E-1 CLOSED** — the design catalog decoded out of the committed
  `embedded.generated.ts` carries 66 ordered field-exact items, the `ai`
  collection, `registryCollections` (8, ordered-equal), and exact
  `registryMeta`. All 66 items land in a rendered gallery section (0 orphan
  kinds).
- **E-2 CLOSED** — `check:assets-barrel` bound in `plan.md`, structured `PASS`
  receipt, wired into `ci.yml`, re-executed here at raw exit 0 with a clean tree
  afterwards (the barrel is the generator's fixed point; no other generated
  target moved).
- Scope is exactly the twice-amended surface (17 paths); zero lock/config churn;
  no suppression escape hatches. Ten gates re-executed, all green except the
  pre-existing O-3 `fmt` exclusion.
- New non-blocking findings: **G-1** (the T-3 amendment's recorded root cause is
  false — fresh-ui _is_ a root workspace member and the drift gate already ran
  via `check-test`; `fresh-ui-quality` runs no test step) and **G-2** (the
  inherited `fresh-browser` receipt is legitimate but never covered this leaf's
  changed workflow).
- Concurred non-blocking: R-1, N-3, O-1, O-2, O-3, C-1.
- No expensive gate run or requested. Nothing implemented, nothing fixed. PR
  left `OPEN`, draft, exactly one `status:impl`. The run stops for coordinator
  readiness disposition.

## Post-Evaluation Cleanup — Revert Redundant T-3 CI Expansion (2026-08-15)

Formal IMPL-EVAL cycle 2 remains final **`PASS`** at
`3d7819203f59e68eb5b45f6871a03c41ca43cd2f`; this cleanup is not cycle 3 and
does not revise that verdict. `PLAN-EVAL: N/A`: the coordinator prescribed an exact three-path
restore to current `origin/main` bytes with predetermined proofs and no design decision.

### T-3 / G-1 correction

The T-3 implementation was correct and correctly scoped to its then-authorized contract, but its
root-cause rationale was false. Root `workspace: ["packages/*", …]` includes `packages/fresh-ui`.
Both the Fresh UI manifest and the CLI design-asset template classify with `needsDeno: true`, so
the required `ci.yml` `check-test` lane already runs the root test gate for either surface.
`fresh-ui-quality.yml` has no test step; the T-3 wiring therefore added no drift-test coverage and
only duplicated check/lint work. The three T-3 CI paths are restored to current `origin/main` bytes.

### G-2 correction

The inherited `fresh-browser` receipt proves the Fresh **form-navigation** regression only. It did
not render the generated `/design/components` gallery and is not consumer proof for #1358.
Accepted consumer proof is static: the decoded embedded barrel plus the symmetric manifest/catalog
drift gate. Earlier wording that paired the leased browser receipt with gallery consumer proof is
superseded by this correction; the receipt itself remains immutable and valid for its actual gate.

### Cleanup proof table

| Proof | Exact command | Raw exit | Result |
| --- | --- | ---: | --- |
| Restore authorized paths | `git checkout origin/main -- .github/workflows/fresh-ui-quality.yml .github/scripts/ci-classify-changes.ts .github/scripts/ci-classify-changes.test.ts` | 0 | Exactly three paths restored. |
| Classifier ownership | `deno eval "import { decide } from './.github/scripts/ci-classify-changes.ts'; …"` for each required one-file PR diff | 0 | `needsDeno=true` for both `packages/fresh-ui/registry.manifest.ts` and the CLI `(design)` registry template. |
| Root-discovery drift test | `deno test --allow-all --no-check --filter 'generated design catalog matches the Fresh UI registry manifest'` | 0 | 1 passed, 0 failed, 3523 filtered out. |
| Structured root-discovery drift verdict | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --no-check --filter 'generated design catalog matches the Fresh UI registry manifest'` | 0 | 1 passed, 0 failed. |
| Scoped structured check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --file .github/scripts/ci-classify-changes.ts --file .github/scripts/ci-classify-changes.test.ts` | 0 | 2 files, 1 batch, 0 failed batches; wrapper supplied `--unstable-kv`. |
| Cheap quality/architecture | `deno task quality:gate` | 0 | `quality:scan` returned `ok: true`; `arch:check` had no failures, only existing warnings. |
| Embedded barrel freshness | `deno task check:assets-barrel` | 0 | Generator fixed point retained; no generated target moved. |

The first root-test attempts yielded through the command transport and left three identical
processes attributable to this cleanup. Only those exact PIDs were stopped; the final managed
invocation produced the terminal exit-0 proof above. No unrelated process was touched.

### Boundaries

- Core #1358 product work, symmetric fixtures, generated CLI barrel, and all receipts are retained.
- All product paths outside the three restored CI paths are unchanged from cleanup start head
  `ab78faac5efcc7f050f6312b993197de137a9631`.
- `deno.lock`, `packages/cli/deno.lock`, and `packages/fresh-ui/deno.lock` are unchanged.
- No browser, `fresh-browser`, Aspire, Docker, scaffold runtime, or `e2e:cli` command ran.
- This is automated cleanup evidence, not self-certification. Stop after commit, explicit-refspec
  push, and one structured PR comment for fresh opposite-family Tier-A review of the cleanup delta.

### Committed-head revalidation

Cleanup product/CI head `695dd7b00` was revalidated after commit: the required three-path
`origin/main..HEAD` diff command produced no output (raw exit 0); the two classifier probes again
returned `needsDeno=true` (raw exit 0); scoped structured check, `quality:gate`, and
`check:assets-barrel` each returned raw exit 0; and the structured root-discovery drift wrapper
returned raw exit 0 with 1 passed and 0 failed. `check:assets-barrel` left no generated delta.

## Fresh Opposite-Family Tier-A — T-3 Cleanup Delta (2026-08-15)

Reviewer session `b4e0f2a9-ead2-4e25-a157-b562852db914`, bridge `session_0126UWXkosw4JB5soLwAfLjV`,
PID `363768`, route `claude-opus-5` · effort `medium` (observed from `respawnFlags`). Review head
`a891c65203301ec96467f11d9fe3dcb77a09d5c8`, confirmed identical across local `HEAD`,
`git ls-remote origin`, and PR `headRefOid`.

**Verdict: `CHANGES_REQUESTED`.** Artifact: `review-tier-a.md` § "Fresh opposite-family Tier-A —
bounded to the T-3 revert cleanup delta".

| Scope item                           | Result             | Evidence executed                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Revert complete and exact            | PASS               | Empty `git diff origin/main..HEAD` over the three paths; identical blob ids at `origin/main`/`HEAD`/worktree; no `.github/**` in the base-relative leaf diff                                                                                                                                               |
| Core #1358 work retained             | PASS               | `git diff --name-status da574111a..HEAD` = exactly the template, `embedded.generated.ts`, `registry-doc-drift.test.ts`; `merge-base(origin/main, HEAD) == da574111a` separates main-side movement                                                                                                          |
| Coverage claim justifying the revert | PASS               | Classifier probe raw exit 0, `needsDeno=true` for both owned surfaces; root workspace/exclude config shows no Fresh UI test exclusion; `deno test --allow-all packages/fresh-ui/tests/registry-doc-drift.test.ts` from repo root → 5 passed, 0 failed, raw exit 0; `fresh-ui-quality.yml` has no test step |
| Barrel remains fixed                 | PASS               | `deno task check:assets-barrel` raw exit 0, `git status --porcelain` empty before and after, `docker ps -a` empty before and after                                                                                                                                                                         |
| Journals truthful                    | **FAIL (PR body)** | Run artifacts accurate and correctly superseded; PR #1657 body still checks off reverted slice S3, lists T-3 suite evidence as current validation, and carries the uncorrected G-2 `fresh-browser` DoD claim                                                                                               |

Blocking findings T-1/T-2/T-3 are PR-body text only — no source change and no gate rerun is owed.
Non-blocking: T-4 (stale Drift/Debt entry), N-1 (draft-gated CI means the drift gate does not run
while #1657 is draft — pre-existing policy, not this delta), N-2 (manifest→template and
template→barrel are two distinct gates, both `needs_deno`-guarded; both green).

Boundaries: read-only over source; no browser, `fresh-browser`, Aspire, Docker, scaffold runtime, or
`e2e:cli`; no lease requested; locks untouched; PR left draft with exactly one `status:impl`; no
acceptance box, label, milestone, readiness, merge, or issue state changed.

## Fresh body recheck of T-1…T-5 (2026-08-15)

Fresh opposite-family reviewer (Claude Opus 5, effort medium; session
`96d469bb-709e-4a44-ab34-c75bf849e0c9`, bridge `session_01NbxH4k3reZ5dPJaADA9qCj`, PID `418737`) ran
a body-only recheck at head `21403902b`. Verdict **`PASS`** — all five corrections truthfully
resolved in the live PR body, plus an independent sweep of the remainder finding no further false or
stale statement. Full ledger in `review-tier-a.md` (appendix). Read-only: no body edit, no label
change, no acceptance box ticked, no gate rerun; `docker ps -a` empty throughout. The `PASS`
authorizes only handing #1657 to the coordinator for readiness disposition.
