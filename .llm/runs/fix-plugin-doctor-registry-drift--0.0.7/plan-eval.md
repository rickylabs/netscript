# PLAN-EVAL — fix-plugin-doctor-registry-drift--0.0.7 (cycle 1, post-ruling)

- Plan evaluator session: fresh native Claude Fable 5 session, opposite-family to the Codex
  GPT-5.6 Sol author, separate from the fixes topic supervisor; 2026-08-30.
- Evaluator branch / worktree: `eval/plan-eval-1673-cycle-1` at
  `/home/agent/projects/netscript/worktrees/007-planeval-1673` (read-only over source).
- Run: `fix-plugin-doctor-registry-drift--0.0.7` · PR #1739 (draft, `status:plan`, `Closes #1673`).
- **Plan commit evaluated:** `13402d3fbfba1c166fcf5c636a1b2ef59eb0b543` — re-verified in this session:
  local `HEAD` == `origin/fix/plugin-doctor-registry-drift` == PR #1739 `headRefOid`.
- Previous revision used as diff baseline: `349d5915` (pre-ruling, 24-path proposal).
- Immutable base: `origin/main` @ `13878a80a50c55b9662099fed64555f2310ae4a3`.
- Surface / archetypes: `6 — CLI / Tooling` (`packages/cli`) + `5 — Plugin Package` (`plugins/ai`).
- Scope overlay: optional manifest-advertised generator inspection protocol v1.

## Scope of this evaluation

Finding F1 is accepted and settled; the coordinator's design ruling is settled. Neither is
re-audited here. This pass judges one thing: whether `plan.md` @ `13402d3f` is a faithful, complete,
and implementable expression of the ruling, and whether its evidence obligations are real. I do not
dispute the ruling itself.

Cheap confirmations of the two supervisor-verified facts:

- Ceiling: `plan.md` §"Eleven coordinator-authorized product/test paths" (lines 212–222) is an exact
  11-path match to the authorization (six prior CLI paths + `installed-runtime-registry-generator_test.ts`
  + four `plugins/ai` paths). ✔
- `runtime-registry-source-report.ts` is not created; `rtk grep inspectionProtocol` over the tree hits
  only `.llm/runs/` — no product code exists yet, and `plan.md` line 137–139 / 239 folds the
  parser/validator into path 2, which already owns the `ProcessPort` call
  (`installed-runtime-registry-generator.ts:414–466`). ✔

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md` re-baselined at `13878a80`; S6 findings S6-1…S6-9 spot-checked against the tree (see "Spot-checks"). |
| Decisions locked | PASS | `plan.md` §Coordinator-Ruled Design + §Locked Contract: activation, exact argv, strict schema, fail-closed table, shared selector, three-layer no-write proof. |
| Open-decision sweep | PASS (two minor items found, both safe to defer with stated defaults — see sweep) | Neither forces rework. |
| Commit slices (< 30, gate + files each) | PASS | S7–S10 enumerated with paths, commit boundary, and proving evidence (`plan.md` lines 260–272). |
| Risk register | PASS | `plan.md` §Risk Register — 10 risks with stop conditions. |
| Gate set selected | PASS | 16 gates incl. required supervisor-coordinated `scaffold.runtime`; consistent with `gates/release-gates.md` line 36 (plugin scaffolding change ⇒ required) and Arch-5 runtime column. |
| Deferred scope explicit | PASS | F4/workers, sagas, triggers, streams, issue text, merge state — `plan.md` lines 237–256. |
| jsr-audit surface scan (pkg/plugin) | PASS (manual evidence) | `plugins/ai/deno.json` export map has no `src/cli` entry, so the new selector export is a published-file symbol, not a public export; `scaffold.runtime.json` is in `publish.include` so gate 14 is correctly measured; gates 11–12 cover `isolatedDeclarations`/doc lint on both packages. |

## Findings (each tied to the artifact it was derived from)

Severity vocabulary: **blocking** (would flip the verdict), **major** (binding amendment; IMPL-EVAL
should `FAIL_FIX` if absent), **minor** (record/decide, no redesign), **note**.

### PE-1 — Contract fidelity to the ruling: faithful. (note)

Derived from `plan.md` §Locked Contract vs. the ruling text.

- Optional advertisement `inspectionProtocol: 1`; presence tested separately from value; any present
  non-`1` value fails closed (lines 78–83). ✔
- Same external generator through the injected `ProcessPort` (`installed-runtime-registry-generator.ts:69,434`)
  in read-only mode: no `--allow-write`, no `--manifest`, no sidecar materialisation (lines 96–98);
  contrast with current `runGenerator`, which writes `.netscript/.runtime-manifests/<plugin>.json`
  and passes `--allow-write` (adapter lines 423–448). ✔
- CLI validates version/schema, declared registry paths, duplicates, source files (lines 116–135). ✔
- Declared-but-failing ⇒ fail closed with a named reason table and no fallback (lines 170–192). ✔
- Absent ⇒ legacy walk, no child process in dry-run (line 80). ✔
- Reported selection becomes the expected set via `sourceAuthority: 'generator'` (line 200). ✔

### PE-2 — Shared-pure-selector: real in the design, but the evidence is one-sided. (major)

Derived from `plan.md` lines 141–150 and gate 4 (line 286), against
`plugins/ai/src/cli/ai-registry-compiler.ts:95–128`.

The design is sound: extract the current `listResourceFiles → isRegistryInput → sort →
selectToolDefinitionModules` pipeline (compiler lines 99–105) into one pure function, have
`compileAiRegistry` and inspect mode both call it, and forbid any second predicate. But the only
concrete test obligation is "normal compile's returned `files` exactly equal the shared selector
result" (line 150). That proves *compile* did not diverge from the selector; nothing in the locked
contract proves *inspect* did not. An implementer could post-filter or re-order inside the report
serializer and every listed assertion would still pass — which is exactly the F1 divergence shape.

**Binding amendment (S8 evidence):** add one equivalence assertion, on the same fixture, that the
inspect report's `registries[i].sourceFiles` deep-equals `compileAiRegistry(files, target).files`
for every declared target (identical membership *and* order). To make this testable without a
subprocess, the report builder must be a plain function (e.g. an `inspectAiRegistries(files,
targets)` in path 10 returning the v1 document object) that `generate-runtime-registries.ts`
merely serialises; `main()` currently hard-codes `LocalProjectFiles` + `console.log`
(`generate-runtime-registries.ts:34–46`), so the equivalence cannot be asserted through `main` alone.
Gate 4's wording "shared selector used by inspect/compile" should be replaced by this concrete
assertion.

### PE-3 — No-writes proof: provable as planned. (note)

Derived from `plan.md` lines 152–168 against the three test seams.

- Layer 1: `ai-registry-compiler.test.ts` already has an in-test `MemoryProjectFiles` (line 33) whose
  write map can be snapshotted. ✔
- Layer 2: `installed-runtime-registry-generator_test.ts` has `MemoryFileSystem` with a public
  `files: Map` (lines 165–170) plus a `RecordingProcess` whose `calls[].args` can be asserted to
  lack `--allow-write`/`--manifest`. ✔
- Layer 3: a real temp-project byte snapshot around a real doctor run — feasible in path 6 (see PE-5).
  This is the layer that turns "no `--allow-write`" from a design statement into a demonstration,
  because it also catches parent-side writes (the sidecar) that the child permission set cannot. ✔

### PE-4 — Healthy regression exercises the F1 shape, not an existing assertion. (note)

Derived from S7 (`plan.md` line 264) against the two existing tests. The existing case
(`installed-runtime-registry-integration_test.ts:239–283`) asserts only that the *generated registry*
lacks `skill-loader`. S7's new assertion is that *doctor* reports healthy after real generation with a
discoverable `ai/tools/skill-loader.ts` factory present. At the current product head the dry-run
walk (`installed-runtime-registry-generator.ts:92–111,380–408`) includes `skill-loader.ts`, and
`checkRuntimeRegistryDrift` (`runtime-registry-drift.ts:53–68`) then reports `Missing generated
entry …` ⇒ error. So the assertion is red-before for the right reason and green only when the
generator's selection becomes the expected set. It uses only existing APIs, so it compiles against
the S6 head and gate 1's counts do not need `--no-check`. ✔

### PE-5 — Ruling on the `installed-runtime-registry-integration_test.ts` interpretation. (major — ruled)

Derived from `drift.md` §"Flagged integration-test scope interpretation", `plan.md` lines 224–235,
and `doctor-plugin-registry-drift_test.ts:1–241`.

**Ruling: REJECTED as unnecessary — S7 relocates into authorized path 6.** Rationale:

1. The supervisor's reading is textually admissible ("existing … test paths may be amended"), but
   an interpretation is only needed when no enumerated path can host the obligation. One can.
2. `doctor-plugin-registry-drift_test.ts` (path 6) already drives the **real** `doctorPlugin` through
   `createDoctorPluginCommand` with `DenoFileSystem` + `DenoProcess` over a temp project
   (`createDoctorHarness`, lines 159–190) and already runs real installed generation first
   (`createGenerator`, lines 151–157). The ruling's obligation is "assert **doctor** stays healthy";
   the integration test never touches doctor and would have to import the doctor feature across
   features to do so. Path 6 is the more faithful home, not merely an admissible one.
3. Keeping the ceiling at exactly the enumerated eleven removes the residual need for coordinator
   adjudication, at a cost of one project helper (a `writeScaffoldWorkspaceAiProject`-style helper:
   workspace `./plugins/*`, `copy(REPOSITORY_ROOT/plugins/ai)`, `appsettings` `plugin-ai` entry —
   ~25 lines modelled on the integration test's lines 398–418).

The plan itself pre-authorised this outcome ("PLAN-EVAL or the coordinator may overturn it before
S7", line 231; risk row line 323), so the relocation executes inside the plan's own provisions and
does not require an S6 re-lock cycle. Consequences, all binding:

- S7 and the layer-3 byte snapshot live in path 6; `installed-runtime-registry-integration_test.ts`
  is **not** amended in this leaf. Its existing `skill-loader` case remains as-is.
- Gate 1 and gate 3 wording changes accordingly (gate 3 becomes unit test only; the real AI health +
  byte-identical inspect proof move under gate 2).
- The author reflects this in `plan.md`/`drift.md` in the S7 commit's run-artifact update (every
  slice already touches the run dir), with a one-line drift entry "interpretation overturned by
  PLAN-EVAL; relocated to path 6".

### PE-6 — Genericity: genuine, with workers evidence. (note)

Derived from `plan.md` lines 116–135 against `plugins/workers/scaffold.runtime.json`. The v1 contract
carries no AI vocabulary: activation is a manifest key, the request is the resolved manifest passed
inline, the response is `{registryPath, sourceFiles}` per declared target, and validation deliberately
does not require membership in the legacy walk (line 129). Workers declares one `registryPath`, passes
`--profile scaffold` through `<runtimeRegistryGenerator.args>` in the fixed argv order, and its
`pluginDirs` sources (`plugins/workers/jobs`, `plugins/triggers/jobs`) are project-relative regular
files — all inside the v1 rules. Later workers adoption needs no host or schema change. ✔

### PE-7 — Doctrine layering into `plugins/ai`: holds. (note)

The host consumes a versioned evidence document and never imports from `plugins/ai`; the AI package
owns its selector and gains no new dependency (`generate-runtime-registries.ts` already imports only
`@netscript/plugin/cli`). AP-9 is avoided as claimed. ✔

### PE-8 — Gate set honesty. (minor)

- `check:mcp-export-corpus` (13) and `check:publish-assets` (14) are listed as measured either way ✔;
  `scaffold.runtime` (16) is REQUIRED, supervisor-coordinated, author-must-not-run, with the runner
  `--report` JSON as durable evidence ✔; no environment failure pre-excused ✔.
- `quality:gate` (10) composes `quality:scan && arch:check` (`deno.json:52`), which satisfies the
  harness skill's `plugins/**` review requirement ✔.
- Correction: `check:mcp-export-corpus` is **not** in `.llm/tools/gates/catalog.ts` (only
  `publish-assets`, `doc-lint`, `quality-gate`, … are), so "through repo gate" cannot apply to gate 13;
  record it as a reproducible raw command + exit code instead. Gate 11's catalog entry is bare
  `deno task doc:lint`; the `--root … --pretty` variants likewise fall under "where catalogued".

### PE-9 — F-1 file-size growth in path 2. (minor)

Derived from `.llm/tools/fitness/check-doctrine.ts:352–370`. The coordinator forbade the split file,
so the DTO parser, 11-row reason matrix, canonical-path checks, and regular-file checks land in
`installed-runtime-registry-generator.ts`, currently 478 lines against a 500-line cap. It will cross
the cap. This is `level: 'WARN'` — `arch:check` exits non-zero only on `fail` totals (line 760) and
the 802-line `doctor-plugin-use-case.ts` already carries the same WARN — so no debt entry is required
and gate 10 stays green. The plan should say so explicitly so IMPL-EVAL does not read the new WARN as
unrecorded drift.

### PE-10 — Error-title claim slightly overstated. (minor)

`plan.md` lines 194–198 rename the `runtime-registry:inspection` wrapper title to `Generator runtime
registry inspection` and say it "cannot be mistaken for the legacy path". The wrapper
(`doctor-plugin-use-case.ts:168–186`) catches *every* dry-run failure, including legacy-path errors
(manifest HTTP failure, `EmptyPluginRegistryError`). The healthy-wording claim is correct; the
error-title claim is not. Either keep a neutral title (e.g. `Runtime registry inspection`) or drop
the sentence; the protocol-failure prefix in the message already disambiguates.

### PE-11 — Artifact staleness. (minor)

`supervisor.md` §"Recorded lane/eval overrides" still says "PLAN-EVAL is `N/A`", contradicting
`plan.md` line 25 and this pass. Update in the S7 artifact commit.

### PE-12 — Verdict vocabulary. (note)

`plan.md` line 263/344 uses `APPROVED`/`CHANGES_REQUESTED` (the `netscript-pr` phase-comment
vocabulary); the harness gate vocabulary is `PASS`/`FAIL_PLAN`. This artifact records both mappings;
no change needed.

## Open-decision sweep (evaluator-run)

1. **Generator-authoritative dry-run with zero selected sources across all targets.** Legacy dry-run
   throws `EmptyPluginRegistryError` when the walk finds nothing (adapter line 104); the plan says an
   empty per-target `sourceFiles` is valid but not what happens when *every* target is empty. Safe to
   defer with a stated default: keep the legacy semantics (throw `EmptyPluginRegistryError` when the
   reported total is zero) so doctor's behaviour on an empty AI project does not silently change.
   Record the choice in S9.
2. **Error-title neutrality** (PE-10). Safe to defer; decide in S9.

No open decision forces rework if deferred.

## Spot-checks against the tree

- S6-1/S6-3: `compileAiRegistry` applies manifest filters then `selectToolDefinitionModules`; the
  entrypoint discards `result.files` (`generate-runtime-registries.ts:39–44`). ✔
- S6-4: `ProcessPort.exec` returns captured `stdout`/`stderr` (`process-port.ts`). ✔
- S6-7: `readRuntimeManifest` reads `command`/`args` structurally and ignores extra members
  (adapter lines 337–351); maintainer `plugin-file-collector.ts:165` only checks generator presence.
  Adding `inspectionProtocol` is additive. ✔
- S6-9: normal generation writes the sidecar manifest and grants `--allow-write` (adapter lines
  423–448). ✔

## Paragraph on the ruling itself

I do not believe the ruling is wrong. The rejected alternatives (manifest excludes, host-side AI
selection) are both AP-9 duplications; the optional, fail-closed, generator-owned protocol is the
only shape that keeps the plugin the selection authority. No dissent recorded.

## Verdict

**`PASS_PLAN`** (harness `PASS`; PR-comment `APPROVED`). Implementation may begin at S7 subject to
the binding items below, which execute inside the plan's own provisions and need no S6 re-lock:

| # | Item | Severity | Where it lands |
| --- | --- | --- | --- |
| PE-5 | S7 + layer-3 byte snapshot relocate to path 6; the integration test is not amended; gates 1–3 reworded | major (ruled) | S7 commit (test + run-artifact update) |
| PE-2 | Inspect-report ≡ compile-`files` equivalence assertion per target, via a plain report-builder function in path 10 | major | S8 |
| PE-8 | Gate 13 recorded as raw reproducible command (not catalogued) | minor | S10 |
| PE-9 | State the expected F-1 WARN on path 2 | minor | S7 artifact update |
| PE-10 | Neutral inspection error title or drop the claim | minor | S9 |
| PE-11 | Fix stale `supervisor.md` PLAN-EVAL line | minor | S7 artifact update |
| Sweep-1 | Empty-total behaviour under generator authority: keep `EmptyPluginRegistryError` | minor | S9 |

IMPL-EVAL should treat PE-2 and PE-5 as `FAIL_FIX` conditions if absent.

## Boundaries honoured

Read-only over source; no gates run; no `e2e:cli`/Aspire/Docker/browser; no lease requested; no
merge/draft/label/issue mutation; no thread ids, rollout paths, or daemon handles recorded.
