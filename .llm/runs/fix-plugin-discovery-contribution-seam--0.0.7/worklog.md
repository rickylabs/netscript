# Worklog: third-party plugin discovery contribution seam

## Run Metadata

| Field          | Value                                           |
| -------------- | ----------------------------------------------- |
| Run ID         | `fix-plugin-discovery-contribution-seam--0.0.7` |
| Branch         | `fix/plugin-discovery-contribution-seam`        |
| Base           | `bd9d463b4480847dcd6f76efe5bc1e53bb926bec`      |
| Archetype      | `4 — Public DSL / Builder`                      |
| Scope overlays | none                                            |
| Phase          | S2 implementation in progress                   |

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
- Focused unit proof: NOT RUN in S1 due the static-only constraint; mandatory in S2 through the
  structured test wrapper.
- CLI consumers: inspected statically; both remain protected by no-arg compatibility, but automatic
  third-party descriptor transport is not claimed.
- MCP corpus: impact confirmed statically; freshness check/regeneration not run because it is
  cross-package and outside the ceiling.

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

## Handoff Notes

1. PLAN-EVAL should challenge whether package-level extractor configuration satisfies the intended
   acceptance or whether automatic CLI transport is required; if the latter, rescope before S2.
2. Inspect the locked ceiling before implementation. Any manifest, CLI, MCP, generated-asset, or
   lock edit is a stop condition.
3. The decisive review point is the synthetic `defineChannelSync` test without a fourth default
   table row, paired with unchanged official-factory behavior.
4. Preserve the exact baseline reds; unrelated cleanup would obscure the narrow change.
5. Coordinate the known MCP corpus stale result with its owner rather than regenerating it here.
