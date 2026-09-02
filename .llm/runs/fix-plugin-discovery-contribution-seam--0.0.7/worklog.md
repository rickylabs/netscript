# Worklog: third-party plugin discovery contribution seam

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `fix-plugin-discovery-contribution-seam--0.0.7` |
| Branch         | `fix/plugin-discovery-contribution-seam`        |
| Base           | `bd9d463b4480847dcd6f76efe5bc1e53bb926bec`      |
| Archetype      | `4 — Public DSL / Builder`                      |
| Scope overlays | none                                            |
| Phase          | S3 implementation complete; fresh IMPL-EVAL pending |

The leaf brief explicitly limits S1 output to `research.md`, `plan.md`, and `worklog.md`; the
supervisor owns run identity, routing, and PLAN-EVAL disposition. No implementation may begin from
this session.

## Design

### Public Surface

- `ContributionBuilderPattern` — readonly public `callee -> axis` descriptor on
  `@netscript/plugin/sdk`.
- `AstExtractorOptions` — readonly `additionalBuilders` configuration.
- `new AstExtractor(options?)` — optional per-instance extension while preserving the no-arg path.
- `startWalker(root, options?)` — forwards extractor options while preserving `startWalker(root)`.

### Caller-Facing Shape

```ts
const extractor = new AstExtractor({
  additionalBuilders: [
    { callee: 'defineChannelSync', axis: 'channel-syncs' },
  ],
});

const contributions = await extractor.extract(files);
```

The 80-percent existing path remains `new AstExtractor()` or `startWalker(root)`.

### Domain Vocabulary

- **Contribution builder pattern** — a validated source-level factory identifier paired with the
  contribution axis emitted for direct exported calls.
- **Official defaults** — the immutable `defineJob/jobs`, `defineSaga/sagas`, and
  `defineWebhook/triggers` mappings.
- **Additional builders** — caller-owned patterns appended for one extractor instance.
- **Extracted contribution** — existing `{ file, symbol, axis }` output; unchanged.

### Ports

- `ExtractorPort` remains the consumed abstraction and does not change shape.
- `WalkerPort`/`WalkedFile` remain unchanged; the walker discovers text and must not learn factory
  semantics.
- `EmitterPort` remains unchanged; it consumes arbitrary axis strings already.
- No new port is justified.

### Constants

- Private `DEFAULT_CONTRIBUTION_BUILDERS` — exactly the existing three official mappings.
- Private TypeScript identifier validation expression — protects regex construction.
- No global mutable registry constant/state.

### Validation Rules

- `callee` must be a TypeScript identifier accepted by the extractor's direct-call grammar.
- `axis` must be non-blank; emitter normalization remains unchanged.
- Duplicate callees, including official collisions, throw a clear `TypeError`.
- Constructor snapshots caller input.

### Commit Slices

|  # | Slice                                                                                                         | Gate                                                                       | Files                                                                |
| -: | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
|  1 | Introduce descriptor/options contracts, configure `AstExtractor`, and prove synthetic plus official behavior. | focused structured test; scoped check/lint/fmt; quality scan               | `extractor-port.ts`, `ast-extractor.ts`, `walker-ports_test.ts`      |
|  2 | Forward options through `startWalker`, export/document the SDK surface, and verify package publish contracts. | focused structured test; `deno doc`; doc/JSR non-increase; publish dry-run | `start-walker.ts`, `sdk/mod.ts`, `README.md`, focused test if needed |

### Deferred Scope

- CLI descriptor transport — separately owned `packages/cli` integration.
- Manifest declaration/resolution — not implied by the current pipeline.
- Compiler AST/symbol binding — existing `PLG-WALKER-AST` debt.
- MCP corpus regeneration — report to the supervisor because `packages/mcp` is outside ceiling.
- Existing unrelated doctrine/JSR/doc-lint debt — exact non-increase only.

### Contributor Path

A third-party author or host tooling imports `AstExtractor` from `@netscript/plugin/sdk`, supplies
one additional `{ callee, axis }` pattern at composition, and passes that extractor to the existing
pipeline (or uses the option-forwarding preset). Adding a factory does not require editing
`packages/plugin` defaults. Automatic CLI pickup remains a separately coordinated consumer step.

## Progress Log

| Time (UTC) | Slice | Step             | Notes                                                                                                                                                                                                          |
| ---------- | ----- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-31 | S1    | Bootstrap        | Read harness activation/run-loop, Archetype 4, gate matrix, Plan-Gate, PLAN-EVAL protocol, doctrine, toolchain, PR/tooling/RTK guidance, and JSR audit. `rtk` was unavailable; focused raw commands were used. |
| 2026-08-31 | S1    | Re-baseline      | Confirmed clean branch and base equal to `origin/main` at `bd9d463b`; recorded initial lock hash.                                                                                                              |
| 2026-08-31 | S1    | Surface research | Used `deno doc` before focused source reads; confirmed published extractor/walker/pipeline/manifest shapes.                                                                                                    |
| 2026-08-31 | S1    | Census           | Found the one package builder table and two explicit CLI official-plugin collections; classified CLI tables out of scope.                                                                                      |
| 2026-08-31 | S1    | Baselines        | Ran only static package gates. Recorded exact green and pre-existing-red counts in `research.md` and `plan.md`.                                                                                                |
| 2026-08-31 | S1    | Design lock      | Selected per-instance extractor options, locked the six-path product ceiling, and recorded corpus/CLI handoffs.                                                                                                |
| 2026-08-31 | S2.1  | RED              | Commit `4659162df`: test-only change compiled across 153 files, then the focused suite failed on real behavior with 5 pass / 2 fail (synthetic factory silently absent; malformed configuration did not throw). |
| 2026-08-31 | S2.1  | GREEN            | Added frozen official defaults plus immutable per-instance `additionalBuilders`; focused suite passed 7/7 and scoped check/lint/fmt/quality gates stayed clean.                                                  |
| 2026-08-31 | S2.2  | RED              | Commit `148a655c4`: test-only change compiled across 153 files, then the focused suite failed on real preset behavior with 7 pass / 1 fail because `startWalker` did not forward the synthetic mapping.          |
| 2026-08-31 | S2.2  | GREEN            | Forwarded optional extractor options, exported/documented both public types, and added the explicit no-options preset compatibility oracle; focused suite passed 9/9.                                          |
| 2026-08-31 | S2    | Final gates      | Scoped check/lint/fmt/quality stayed clean; doc-lint and JSR reds did not increase; publish dry-run retained exactly two existing warnings; doctrine warnings improved from 3 to 2.                            |
| 2026-08-31 | S2    | Handoff          | Recorded additive SDK surface corpus staleness in `drift.md`; did not touch `packages/mcp/**`. Implementation stops for supervisor-dispatched separate-session IMPL-EVAL.                                    |

## Decisions

| Decision                            | Reason                                                                                                | Source                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Extractor configuration is the seam | `WalkedFile` supplies text; `ExtractorPort` owns interpretation; manifests do not enter the pipeline. | code + doctrine 07                          |
| Official mappings remain defaults   | Protect current no-arg consumers and official behavior.                                               | consumer search + existing test             |
| No global registry                  | Avoid hidden state, load-order dependence, and cross-test contamination.                              | A10/A11, AP-11/AP-25                        |
| No manifest change                  | Would require resolver/host transport beyond this package leaf.                                       | pipeline and manifest surfaces              |
| Public surface moves                | `./sdk` exports the affected class/preset and must expose documented option types.                    | `packages/plugin/deno.json`, `deno doc`     |
| MCP corpus is handoff scope         | Generator serializes package Deno-doc signatures, but `packages/mcp` is outside the locked ceiling.   | `gen:mcp-export-corpus` implementation/task |

## Drift

| Drift                                                                     | Severity | Logged in `drift.md`                             |
| ------------------------------------------------------------------------- | -------- | ------------------------------------------------ |
| None. The brief's carried-in defect and branch base matched current main. | minor    | no; S1 deliverable is limited to three artifacts |

## Gate Results

### Static Package Gates

| Gate                     | Result                  | Evidence                                                                   | Contract                                     |
| ------------------------ | ----------------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| Scoped check             | PASS                    | 153 files, 2 batches, 0 findings                                           | remain green                                 |
| Scoped lint              | PASS                    | 153 processed, 0 dropped/refused/findings                                  | remain green                                 |
| Scoped format            | PASS                    | 153 processed, 0 findings                                                  | remain green                                 |
| Full export doc-lint     | FAIL (pre-existing)     | 15 private refs; 0 missing JSDoc; 0 other                                  | <=15; missing/other 0; no owned-file finding |
| JSR package audit        | FAIL (pre-existing)     | 4 FAIL, 2 WARN, 1 INFO; dry-run OK                                         | exact non-increase; no owned-file finding    |
| Package publish dry-run  | PASS with warnings      | exactly 2 unanalyzable dynamic imports at existing locations               | no new warning/count                         |
| Code-quality scan        | PASS                    | 0 findings, 0 allowances                                                   | remain green                                 |
| Scoped doctrine          | PASS exit with findings | 0 FAIL, 3 WARN, 1 INFO                                                     | exact non-increase                           |
| Lock hygiene after gates | PASS                    | SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` | byte-identical                               |

### Fitness Gate Coverage

Archetype-4 F-1 through F-12 plus F-14 through F-19 are represented by the scoped wrappers, quality
scan, doctrine scan, JSR audit, doc-lint, publish dry-run, and manual design review. Existing debt
remains explicit; no green wrapper is treated as proof that the pre-existing findings vanished.

### Runtime and Consumer Gates

- Runtime/browser/scaffold/E2E/Aspire/Docker: N/A and forbidden in S1.
- Focused unit proof: NOT RUN in S1 due the static-only constraint; S2 final result is 9 passed / 0
  failed through the structured test wrapper.
- CLI consumers: inspected statically; both remain protected by no-arg compatibility, but automatic
  third-party descriptor transport is not claimed.
- MCP corpus: impact confirmed statically; freshness check/regeneration not run because it is
  cross-package and outside the ceiling. The stale generated path and owner handoff are recorded in
  `drift.md`; the corpus did not move.

### S2 Slice Evidence

| Slice | State | Command | Result |
| ----- | ----- | ------- | ------ |
| S2.1 | RED compile | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/plugin --ext ts,tsx` | PASS: 153 files, 2 batches, 0 findings |
| S2.1 | RED behavior | `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/plugin/tests/sdk/walker-ports_test.ts` | expected FAIL: 5 passed, 2 failed, 7 total, 2 unique failures |
| S2.1 | GREEN behavior | same focused structured test command | PASS: 7 passed, 0 failed |
| S2.1 | GREEN check | same scoped check command | PASS: 153 files, 2 batches, 0 findings |
| S2.1 | GREEN lint | `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/plugin --ext ts,tsx` | PASS: 153 processed, 0 dropped/refused/findings |
| S2.1 | GREEN format | `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/plugin --ext ts,tsx` | PASS: 153 processed, 0 findings |
| S2.1 | GREEN quality | `deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/plugin --max-allow 0` | PASS: 0 findings, 0 allowances |
| S2.2 | RED compile | same scoped check command | PASS: 153 files, 2 batches, 0 findings |
| S2.2 | RED behavior | same focused structured test command | expected FAIL: 7 passed, 1 failed, 8 total, 1 unique failure |
| S2.2 | GREEN behavior | same focused structured test command | PASS: 9 passed, 0 failed |
| S2.2 | Public surface | `deno doc --filter <symbol> packages/plugin/src/sdk/mod.ts` for both new types, `AstExtractor`, and `startWalker` | PASS: documented exported types and explicit optional parameters rendered |

### S2 Final Gate Contracts

| Gate | Final result | Baseline contract |
| ---- | ------------ | ----------------- |
| Scoped check | PASS: 153 files, 2 batches, 0 findings | green preserved |
| Scoped lint | PASS: 153 processed, 0 dropped/refused/findings | green preserved |
| Scoped format | PASS: 153 processed, 0 findings | green preserved |
| Code-quality scan | PASS: 0 findings, 0 allowances | green preserved |
| Full export doc-lint | expected exit 1: 15 private refs, 0 missing JSDoc, 0 other; `./sdk` has 0 | exact non-increase (15/0/0) |
| JSR package audit | expected exit 1: 4 FAIL, 2 WARN, 1 INFO; no owned-file finding | exact non-increase (4/2/1) |
| Package publish dry-run | PASS; same two unanalyzable dynamic imports at `generated-project-registry.ts:69` and `manifest-resolver.ts:33` | warning count/locations unchanged |
| Scoped doctrine | exit 0: 0 FAIL, 2 WARN, 1 INFO | improved from 0/3/1; no new finding |
| Lock hygiene | SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c` | byte-identical |

## Handoff Notes

1. PLAN-EVAL should challenge whether package-level extractor configuration satisfies the intended
   acceptance or whether automatic CLI transport is required; if the latter, rescope before S2.
2. Inspect the locked ceiling before implementation. Any manifest, CLI, MCP, generated-asset, or
   lock edit is a stop condition.
3. The decisive review point is the synthetic `defineChannelSync` test without a fourth default
   table row, paired with unchanged official-factory behavior.
4. Preserve the exact baseline reds; unrelated cleanup would obscure the narrow change.
5. Coordinate the known MCP corpus stale result with its owner rather than regenerating it here.

## 2026-09-01 — S3 implementation

### Outcome

- The generic plugin SDK no longer contains any official factory-to-axis mapping. Workers, sagas,
  and triggers each emit `NETSCRIPT_CONTRIBUTION_BUILDERS` from the control-plane module their
  adapter already owns.
- `AstExtractor` discovers those declarations from its existing `WalkedFile` input, merges them with
  its immutable per-instance `additionalBuilders`, and rejects malformed or duplicate callees.
- A recognizable direct contribution-factory call imported from a plugin core now throws a
  remedy-bearing `TypeError` when no walked declaration or `additionalBuilders` entry owns it. A
  walk with no such call remains quietly empty.
- The quality scanner now emits `plugin-discovery-core-coupling` when host/core source under
  `packages/**` contains a literal `{ callee, axis }` mapping or compares/predicates a `callee` or
  `axis` against a literal. Plugin engine packages (`packages/plugin-*-core/**`) and connector-owned
  declarations under `plugins/**` remain allowed.
- The canonical MCP corpus was regenerated. This incidentally clears the deterministic staleness
  tracked by #1873; this slice makes no claim about adding that check to CI.

### Migration boundary

Projects scaffolded before S3 do not yet have plugin-owned discovery declarations. Before using
no-argument discovery they must re-run plugin sync/update so the official control-plane modules are
regenerated. Passing `additionalBuilders` is the explicit compatibility path. Keeping the old core
table as a fallback was rejected because it would make the responsibility move cosmetic.

### RED / GREEN evidence

| Slice | State | Commit | Command and result |
| --- | --- | --- | --- |
| S3.1 declaration transport | RED | `aea929b054fdbb0011a8a08ea1618314ba4e111a` | Structured checks passed for 153 package files and 265 plugin files; focused structured tests exited 1 with 30 passed / 6 failed / 36 total. The failures were the missing synthetic declaration transport, missing unmatched/duplicate declaration errors, and the three missing official generated declarations. |
| S3.1 declaration transport | GREEN | `9cb326daecd0afabf431872c02f5459a63fb1a41` | The same focused structured test command exited 0 with 36 passed / 0 failed; both structured check commands exited 0. |
| S3.2 core-coupling guard | RED | `63c9dac34de5afd564d1365709f431ac4fb296ed` | Scanner test check exited 0; scanner tests exited 1 with 28 passed / 1 failed because an arbitrary `defineExample` table and branch in host core produced no findings. |
| S3.2 core-coupling guard | GREEN | `026032d5d5a80044be09c698cc6279990498701a` | Scanner tests exited 0 with 29 passed / 0 failed. The planted host-core fixture produces findings on its mapping-table and branch lines; the identical connector fixture produces none. `quality:gate` exited 0 on the real tree. |
| S3.3 corpus | RED | pre-`67c718a4c` | `deno task check:mcp-export-corpus` exited 1 at `generate-export-surface-corpus.ts:475` with the expected stale-corpus error. |
| S3.3 corpus | GREEN | `67c718a4c29bb8387925879d407d7c47fbdd1108` | Canonical generation completed; the check exited 0 with corpus SHA-256 `fe7d2056fb40c66c2e56daa9a3385839c95f384aaf799f848b0cdae4c47217fc`. |

### Exact-head gate results

| Gate | Exit | Result |
| --- | ---: | --- |
| `deno task quality:gate` | 0 | repository scan 0 findings / 7 pre-existing allowances; `arch:check` green |
| package structured check | 0 | 153 files, 2 batches, 0 findings |
| package structured test | 0 | 92 passed / 0 failed |
| package structured lint | 0 | 153 processed, 0 findings/drops/refusals |
| package structured format | 0 | 153 processed, 0 findings |
| official-plugin structured check | 0 | 265 files, 3 batches, 0 findings |
| official-plugin structured lint | 0 | 265 processed, 0 findings/drops/refusals |
| official-plugin structured format | 0 | 265 processed, 0 findings |
| focused official-plugin adapter tests | 0 | 23 passed / 0 failed |
| quality scanner tests | 0 | 29 passed / 0 failed |
| `deno task arch:check` | 0 | no architecture/dependency gate failure |
| `deno task check:mcp-export-corpus` | 0 | canonical corpus current |
| full export doc-lint | 1 (contractual red) | 15 private refs / 0 missing JSDoc / 0 other; no increase |
| package JSR audit | 1 (contractual red) | 4 FAIL / 2 WARN / 1 INFO; exact non-increase |
| package publish dry-run | 0 | same two `unanalyzable-dynamic-import` warnings at `generated-project-registry.ts:69` and `manifest-resolver.ts:33` |
| scoped doctrine | 0 | 0 FAIL / 2 WARN / 1 INFO; no increase |

### Ceiling and hygiene

The approved 12-path ceiling held exactly: three plugin adapters, their three tests, the extractor,
its walker test, the package README, the quality scanner and its test, and the regenerated MCP
corpus. The two CLI no-argument consumers and `start-walker.ts` remained read-only. No manifest,
`packages/config`, dependency, or lock path moved. `deno.lock` remains byte-identical to
`origin/main`, SHA-256 `01ff3a232713a35e9bd5c9f34db7669568fadd16273cb9c82389832b10b55cbe`.

## Supervisor verification at the integrated head (2026-09-01)

Measured independently of the implementation session, at merge `fe191a9f5`
(`origin/main` `82a2527e2` integrated).

### Generated-carrier conflict resolved through its generator, not by hand

Merging main conflicted on
`packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts`, because #1862
regenerated the same carrier on `main` in parallel. Resolved per the standing rule — **regenerated
via `gen:mcp-export-corpus`, never by picking a side** — then verified:
`check:mcp-export-corpus` **exit 0**. Symbol count moves `7782` → `7784`, which is this branch's own
new exports rather than a stale carry.

This also supersedes the concern filed as **#1873**: the corpus is now fresh on this branch and on
`main` (via #1862). #1873's remaining half — that `check:mcp-export-corpus` runs in **no** workflow
and can therefore drift again silently — is **not** addressed here and must not be claimed.

### Box 5 guard proven non-vacuous

A green `quality:gate` is not evidence the new rule works — it could be green because the rule never
fires. Tested directly by planting a violation in a core package:

```ts
// packages/plugin/src/sdk/discovery/__planted_probe.ts
export function axisFor(callee: string): string | undefined {
  if (callee === 'defineExample') return 'examples';
  return undefined;
}
```

| State | `quality:scan` |
| --- | --- |
| planted violation present | **exit 1**, finding `plugin-discovery-core-coupling` at `__planted_probe.ts:3` with the offending line quoted |
| probe removed | **exit 0** |

The planted callee is `defineExample` — deliberately **not** one of today's three — so the rule is
generic and cannot degrade into a three-name snapshot. Probe deleted; worktree clean.

### Required silent-failure guard implemented as directed

The supervisor review made one condition mandatory: D4's clean break must not reintroduce the silent
non-discovery that #1093 was filed about. Implemented at `ast-extractor.ts:105-122` — when a file
imports a contribution factory from plugin core **and** has export call sites for it, but no
declaration supplies an axis, it throws:

```
Contribution factory "<callee>" has no declared axis; run plugin sync/update or pass it through additionalBuilders
```

and it stays quiet when there are no call sites, which is the boundary that was specified.

### Gates at `fe191a9f5`

| Gate | Result |
| --- | --- |
| `deno task quality:gate` | **exit 0** |
| `deno task arch:check` | **exit 0** |
| `run-deno-test.ts` on `packages/plugin` | **92 passed / 0 failed** |
| `run-deno-check.ts --root packages/plugin --ext ts` | 153 files, 2 batches, **0 diagnostics** |
| `deno task check:mcp-export-corpus` | **exit 0** |
| `deno.lock` | blob **byte-identical** to `origin/main` `82a2527e2` |
