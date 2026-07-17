# IMPL-EVAL — PR #715 at `f41e33b9`

## Metadata and review coverage

| Field | Value |
| --- | --- |
| Run | `beta10-non-dashboard--claude` |
| Worktree | `/home/codex/repos/b10-715-eval` |
| Evaluated branch / HEAD | `eval/715-impl-eval` / `f41e33b91e3faab3ab0d9a50e438159153063ff7` |
| Evaluator | Separate Codex / GPT-family session, 2026-07-13 |
| Archetype / overlay | Archetype 6 — CLI / Tooling; docs overlay |

This verdict covers only the Claude-authored PR #715 follow-up surface named in the evaluation
brief: `.llm/tools/run-deno-lint.ts`, `.llm/tools/run-deno-fmt.ts`, their tests, the related
`deno.json` task/exclusion changes, `packages/cli/README.md`, `packages/mcp/README.md`, and
`docs/site/reference/mcp/index.md`. It also records the unexpected tagline tool/task/lock delta that
is physically present in the evaluated range and contradicts the run worklog. The Codex-authored
framework slices #762 and #763 are on other branches and are not evaluated here.

The earlier umbrella implementation and its cycle-2 IMPL-EVAL remain background evidence, not a
substitute for this opposite-family review of the later Claude-authored commits.

## Findings

### F1 — high — fmt still hides a crashed batch when another batch has a parseable finding

- **File / line:** `.llm/tools/run-deno-fmt.ts:387`
- **Evidence:** `failedWithoutParsedFindings` is computed globally as
  `failedBatches > 0 && allFindings.length === 0`. If batch A has an ordinary formatting finding and
  batch B crashes without a parseable finding, `allFindings.length > 0`, so line 414 never prints
  batch B's output. The failure is still silent even though this change promises per-batch
  crash-vs-finding classification. Worse, if batch A's only finding is ignored by
  `--ignore-line-endings`, `findings.length === 0` and the crashed batch can be reduced to
  `effectiveFailedBatches: 0`, allowing exit 0 at line 416.
- **Test gap:** `.llm/tools/run-deno-fmt_test.ts:12-53` tests only the standalone renderer with
  hand-built `BatchResult[]`. It never drives the classification in `main()`, never supplies one
  finding batch plus one crash batch, and therefore restates rendering behavior without pinning the
  gate invariant. The lint tests do exercise the actual injected runner and per-batch
  classification; the fmt tests do not.
- **Why it matters:** a repository formatting gate can still discard a real config/parse/permission
  failure, and in the line-ending-ignore case can return a false green. This is the exact class the
  change is intended to eliminate.

### F2 — high — the CLI README's quick-start command does not exist

- **File / line:** `packages/cli/README.md:42`
- **Evidence:** the README tells users to run `netscript plugin add workers`; the live command tree
  has `plugin install <kind>` and no `plugin add`. Independent execution returned exit 2:
  `Unknown command "add"`. The same invented verb appears in the command map at line 62 and in the
  `FRAMEWORK_VERBS` description at line 84. The source constant at
  `packages/cli/src/public/features/plugins/dispatch/dispatch-plugin-verb.ts:13-23` contains
  `install`, `remove`, `enable`, `disable`, `sync`, `setup`, `update`, `doctor`, and `info`, but no
  `add`.
- **Additional command typo:** `packages/cli/README.md:86` says dispatch uses `deno dx`; the
  implementation and JSDoc at `dispatch-plugin-verb.ts:88-98` use `deno x -A`.
- **Why it matters:** the primary quick-start path fails when copied, and the claimed live-help-derived
  command map is demonstrably stale/inaccurate.

### F3 — high — the MCP troubleshooting recipes promise outputs the contracts do not return

- **File / line:** `packages/mcp/README.md:145`
- **Evidence:** the recipe says `get_last_job_result` returns a correlation id that can be fed to
  `get_run`. The actual result type and output schema expose `traceId`, not a correlation id
  (`telemetry-summaries.ts:65-78`, `tool-contracts.ts:106-118`), while `get_run` searches
  `executionId(span) === id` and does not accept a trace id
  (`get-run-flow.ts:7-18`). Feeding the documented value to the documented next call therefore does
  not implement the recipe. Lines 248-250 repeat the false claim that these lookups key off
  `netscript.correlation.id`; `executionId()` instead checks execution, job, saga-instance, and
  trigger identifiers (`telemetry-aggregation.ts:55-68`).
- **File / line:** `packages/mcp/README.md:148`
- **Evidence:** the service-performance recipe promises p50/p95/**p99**. The public schema and
  `ServicePerformanceSummary` contain p50 and p95 only (`tool-contracts.ts:119-141`,
  `telemetry-summaries.ts:87-99`), and the aggregation implementation computes no p99
  (`telemetry-aggregation.ts:287-300`).
- **Why it matters:** these are operational recipes, not background prose. Agents following them
  request nonexistent data and chain incompatible identifiers.

### F4 — high — “version-locked” and “real installed binary” claims are false on the prerelease path

- **File / line:** `packages/cli/README.md:107`
- **File / line:** `packages/mcp/README.md:33`
- **Evidence:** both READMEs describe CLI × skills × MCP as version-locked and say
  `execute_command` shells the real installed binary. `netscript agent init` instead writes the
  unversioned specifier `jsr:@netscript/cli` into host configuration
  (`packages/cli/src/public/features/agent/init/init-agent.ts:117-123`). The MCP default executor
  independently spawns that same unversioned registry specifier
  (`packages/mcp/src/infrastructure/spawn-command-executor.ts:7-13`), including when composed by
  `netscript agent mcp`.
- **Corroborating run evidence:** this run's own `worklog.md:220-228` establishes that an unversioned
  JSR specifier resolves to semver `*`, which does not select prereleases when `latest` is null. The
  packages in this PR are `0.0.1-beta.*`. Thus the first-publish/prerelease path is neither
  version-locked nor reliably runnable through the generated config/default executor.
- **Why it matters:** this is a public installation and mutation-path guarantee. It is especially
  material for a first publish, where the unversioned prerelease specifier can fail to resolve at
  all.

### F5 — medium — source/config/lock changes landed as “harness bookkeeping” contrary to the worklog

- **File / line:** `.llm/runs/beta10-non-dashboard--claude/worklog.md:287-289`
- **Evidence:** the worklog says `check-jsr-tagline-length.ts` and `docs:tagline:check` are committed
  on `docs/jsr-tagline-byte-cap`, “not on #715.” In the evaluated range, commit `06051b38`
  (subject `chore(harness): record blocked evaluator launch`) adds
  `.llm/tools/validation/check-jsr-tagline-length.ts`, adds the task at `deno.json:116`, and changes
  `deno.lock:58,77`. Those are executable tooling/config/lock changes, not run-artifact bookkeeping.
  The current gate also reports `checked=36 over=16`, not the recorded `checked=35 over=16`.
- **Why it matters:** executable and lockfile scope bypassed the stated review/trackability boundary,
  and the resume artifact tells the next reviewer the opposite of the Git history. Either remove
  this separate-slice work from #715 or explicitly bring it into scope with accurate evidence and
  review.

### F6 — medium — the later Claude stream has no Plan-Gate or Design checkpoint for its new scope

- **File / line:** `.llm/runs/beta10-non-dashboard--claude/worklog.md:3`
- **Evidence:** implementation evidence begins immediately with “Slice 1.” The run directory has no
  `research.md`, `plan.md`, `plan-eval.md`, or `context-pack.md`, and its worklog has no `## Design`
  section. The earlier S9 Plan-Gate passed before the original docs/stdio-polish work, but it did not
  plan the later lint/fmt wrapper fixes, root exclusions, or tagline gate/lock delta.
- **Why it matters:** the harness requires PLAN-EVAL PASS and a Design checkpoint before an
  implementation slice. The missing evidence also explains why the fmt mixed-batch invariant and
  the extra tagline scope were not captured before implementation.

### F7 — low — the fixture exclusion is broader than the failure source

- **File / line:** `deno.json:94`
- **File / line:** `deno.json:105`
- **Evidence:** the three excluded TypeScript files are
  `doctor/broken/netscript.config.ts`, `doctor/healthy/netscript.config.ts`, and the generated
  `doctor/healthy/.netscript/generated/plugins.ts`. Inspection confirmed they are synthetic project
  inputs used by `doctor-families_test.ts`; no current lint/format debt is being hidden, and the
  broken nested `deno.json` genuinely makes direct lint/fmt config discovery abort. However the
  regex excludes all future TypeScript beneath `packages/mcp/tests/fixtures/`, including fixture
  families unrelated to the malformed doctor project.
- **Why it matters:** `packages/mcp/tests/fixtures/doctor/` states the actual exception and avoids
  silently exempting future ordinary fixtures. This is not a current debt finding, but the narrower
  path is the honest selection boundary.

### F8 — low — the new reference page says it is generated when it is hand-authored

- **File / line:** `docs/site/reference/mcp/index.md:8`
- **Evidence:** it states that the page “is generated from the package's public surface with
  `deno doc`.” The generator worklog explicitly says reference pages are hand-authored and that no
  generator exists for this page (`worklog.md:137-142`). The checked-in file is prose/tables with no
  generation marker or generation task.
- **Why it matters:** readers and maintainers are told source changes will automatically refresh a
  page that must actually be maintained by hand.

## Four requested high-risk areas

### 1. Lint/fmt wrappers and regression tests

**Checked:** full diffs and current implementations; direct import through the test suite;
script execution through `deno task lint` and `deno task fmt:check`; direct reproduction against
`packages/mcp/tests/fixtures/doctor/broken/netscript.config.ts`; seven regression tests.

**Found:**

- `import.meta.main` is correct. Imports do not execute the CLI, while both Deno tasks execute the
  guarded `main()` and produce nonempty selection reports.
- The lint implementation classifies each batch independently. A crash is captured with file set,
  exit code, stdout/stderr, and is rendered; an ordinary parseable lint finding is not mislabeled.
  The injected-runner tests genuinely pin this distinction.
- The fmt implementation works for the reproduced single-crash case, but not for a mixed
  finding+crash run. Its global classification and renderer-only tests leave the silent/false-green
  path in F1.
- Independent results: wrapper tests **7 passed, 0 failed**; lint **exit 0, 1,682 files, 9
  batches**; fmt **exit 0, 1,811 files, 10 batches**.

### 2. `packages/mcp/tests/fixtures/` exclusion

**Checked:** tracked and hidden files under the tree, the two nested `deno.json` files, all three
TypeScript files, their consumer test, and direct lint/fmt execution of the broken fixture.

**Found:** the three dropped TypeScript files are synthetic doctor-project inputs, one generated;
there is no present lint/format debt concealed. Direct execution reproduces the malformed workspace
configuration abort and the wrappers now surface it. The current broad exclusion should still be
narrowed to the doctor fixture tree for future coverage (F7).

### 3. README/reference factual accuracy

**Checked:** live `netscript --help` plus every documented top-level group; `TOOL_NAMES`;
`TOOL_INPUT_SCHEMAS` and `TOOL_OUTPUT_SCHEMAS`; `DEFAULT_TRUNCATION_POLICY`;
`DEFAULT_COMMAND_POLICY`; `MCP_PROTOCOL_VERSION`; `McpCliOptions` versus `McpServerOptions`;
endpoint discovery; plugin dispatch; installation config; command executor; published entrypoints.

**Found:** the 13-name catalog, 50-item/2,000-code-unit policy, default allow/deny lists, protocol
version `2025-11-25`, option-seam split, endpoint order, and Deno-only MCP compatibility are aligned
with source. Findings F2-F4 and F8 are false public claims that remain: nonexistent `plugin add`,
`deno dx`, nonexistent p99/correlation chaining, false prerelease version-locking, and false
generation provenance.

### 4. JSR first-publish readiness

**Checked:** tagline extraction/byte measurement, member discovery, package metadata,
`jsr-provision-packages.ts`, `jsr-set-package-settings.ts`, `jsr-package-settings.json`, publish
workflow ordering, JSR fitness audit, doc lint, and package dry-run.

**Found:**

- CLI tagline: **213 bytes**; MCP tagline: **239 bytes**. Both are complete sentences and pass
  unchanged under the release extractor's 250-byte cap.
- `discoverWorkspaceMembers()` returns both `{path:"packages/cli", name:"@netscript/cli"}` and
  `{path:"packages/mcp", name:"@netscript/mcp"}` among 35 publishable members. It scans the
  publish parent directories and accepts any named member not marked `publish:false`.
- The publish workflow provisions every discovered package before publish. The provisioning tool
  creates a 404 package and links it to the repository; no package-name registry is required.
  `jsr-package-settings.json` has defaults (`readmeSource: readme`, `runtimeCompat.deno: true`) and
  no `mcp` override; the settings tool derives the description from the README automatically.
- `deno task doc:lint --root packages/mcp --pretty`: combined total **0**.
- JSR audit: dry-run OK; its one warning is the known banner-counting false positive.
- `deno publish --dry-run --allow-dirty` in `packages/mcp`: **Success**, intended package-only file
  list, no actual slow-type diagnostic.
- Provisioning/settings readiness passes. The generated runtime invocation is nevertheless not
  first-prerelease-ready because of the unversioned CLI specifier in F4; that is separate from JSR
  package discovery/provisioning.

## Process, debt, and claim reproduction

- Earlier umbrella S9 `plan-eval.md` is `PASS`, and the umbrella cycle-2 IMPL-EVAL closed its prior
  layering finding. That evidence does not cover the later wrapper/tagline scope (F6).
- Existing `MCP-A6-V2-SHAPE` debt is recorded with owner, target, linked plan, status, and closing
  gate. This diff introduces no new architecture-debt delta; no `FAIL_DEBT` condition was found.
- Close-gated issues #725-#733 have checked acceptance boxes and per-slice evidence comments; the PR
  Definition-of-Done is checked. The live PR currently carries both `status:impl-eval` and
  `status:ready-merge`, violating the exactly-one-status convention, and should not be treated as
  merge-ready while this verdict is failing.
- Snapshot CI claim reproduced for `f41e33b9`: `ci`, `e2e-cli`, `Code quality`, and
  `public-surface-diff` workflow runs all completed successfully. The remote PR head advanced after
  the requested snapshot; that later head is not part of this verdict.

Claims independently reproduced: root lint; root fmt check; seven wrapper tests; docs links (96
docs, zero broken links/anchors); MCP doc lint; MCP JSR audit; MCP publish dry-run; f41 snapshot CI.

Claims not reproduced / contradicted:

1. `worklog.md:289` says the tagline gate is not on #715; Git history shows it, its task, and lock
   entries in #715 commit `06051b38`.
2. The recorded tagline census is `checked=35 over=16`; current evaluated tree reports
   `checked=36 over=16`.
3. The README slice says its command map was generated from the live help tree; `plugin add` is not
   in that tree and exits 2.
4. The fmt worklog says the same silent-failure class is fixed; mixed batches remain uncovered and
   can be silent/false-green (F1).

## Verdict

The implementation needs focused corrections, not a new architecture or debt entry: make fmt
classification per-batch and test the mixed case; correct the CLI/MCP public claims and copyable
commands; remove or explicitly scope/review the tagline tool/task/lock delta; and reconcile the
missing harness evidence. Green gates do not compensate for a gate that can false-green or public
recipes that do not match the executable contracts.

FAIL_FIX
