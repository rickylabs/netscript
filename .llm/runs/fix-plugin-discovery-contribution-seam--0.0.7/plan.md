# Plan: third-party plugin discovery contribution seam

## Run Metadata

| Field          | Value                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| Run ID         | `fix-plugin-discovery-contribution-seam--0.0.7`                               |
| Branch         | `fix/plugin-discovery-contribution-seam`                                      |
| Base           | `bd9d463b4480847dcd6f76efe5bc1e53bb926bec`                                    |
| Phase          | `plan` (S1 artifact-only)                                                     |
| Target         | `packages/plugin`                                                             |
| Archetype      | `4 — Public DSL / Builder`                                                    |
| Scope overlays | none                                                                          |
| PLAN-EVAL      | disposition reserved for the supervisor; this generator does not self-certify |

## Archetype and Doctrine Verdict

`packages/plugin` is explicitly assigned Archetype 4. Its author-facing manifest builder and its
published SDK are curated DSL/extension surfaces; it is not a first-party Archetype-5 connector. The
current verdict is **Keep — preserve manifest, discovery, validation, and host contracts**.

The controlling axioms are A1 (public contract first), A2 (small predictable boundary), A10
(composition/injection), A11 (name the extension axis before abstraction), and A14 (tests and
publish gates preserve the contract).

## Goal

Make the existing AST extractor accept a caller-supplied third-party factory-to-axis mapping so a
synthetic `defineChannelSync` contribution is discovered without editing core defaults, while the
current `defineJob`, `defineSaga`, and `defineWebhook` behavior remains unchanged.

## Locked Product Path Ceiling

S2 product/test edits are limited to these paths:

1. `packages/plugin/src/sdk/discovery/ports/extractor-port.ts`
2. `packages/plugin/src/sdk/discovery/ast-extractor.ts`
3. `packages/plugin/src/sdk/presets/start-walker.ts`
4. `packages/plugin/src/sdk/mod.ts`
5. `packages/plugin/tests/sdk/walker-ports_test.ts`
6. `packages/plugin/README.md`

Run-artifact updates under this run directory remain allowed. No other product, test, generated,
lock, or documentation path may be edited without supervisor-approved rescope. In particular:

- `packages/cli/**` is excluded and independently owned.
- `packages/mcp/**` is excluded even though the export corpus will become stale.
- `packages/plugin/src/config/**` and `packages/plugin/src/protocol/**` are excluded because the
  selected seam is not a manifest schema change.
- `deno.lock` must remain byte-identical.

## Design

### Public contract

Add a documented readonly descriptor for the named extension axis:

```ts
interface ContributionBuilderPattern {
  readonly callee: string;
  readonly axis: string;
}
```

Add a documented `AstExtractorOptions` contract with
`additionalBuilders?: readonly ContributionBuilderPattern[]`. `AstExtractor` accepts the options in
an optional constructor. `startWalker` accepts the same optional extractor options and forwards them
to `AstExtractor`, keeping the high-level preset usable. Both types are exported from
`@netscript/plugin/sdk`.

The exact final public names are locked to `ContributionBuilderPattern` and `AstExtractorOptions`
unless PLAN-EVAL identifies a collision with an existing exported noun. Renaming after
implementation begins requires plan drift.

### Extraction policy

- Keep the three current mappings as private frozen defaults.
- Build each extractor instance's effective mapping list from defaults plus `additionalBuilders`.
- Do not expose a mutable module-global registration API and do not mutate the caller's array.
- Validate each additional callee as a TypeScript identifier and each axis as non-blank before
  extraction; fail synchronously with a clear `TypeError` rather than silently ignoring malformed
  configuration.
- Reject a duplicate callee, including collisions with official defaults, so one syntactic factory
  cannot silently emit into two axes.
- Preserve current deterministic output sorting by file, axis, then symbol.

### Why not the manifest

The runtime and installer manifest surfaces declare plugin/runtime/scaffolding contributions. They
are not inputs to `runWalkerPipeline`; `WalkedFile` carries only source text and the injected
`ExtractorPort` owns interpretation. Adding syntax metadata to a manifest would require resolver,
builder/schema, and host transport changes, widening this narrow issue and the product ceiling.

### Compatibility

- `new AstExtractor()` behaves exactly as it does at base.
- `startWalker(root)` remains source-compatible and uses the same defaults.
- The existing three-result official test remains unchanged as the compatibility oracle.
- Additional mappings are opt-in and per instance, so separate discovery runs cannot contaminate
  each other.

### Proof

Add a synthetic third-party test that configures `defineChannelSync -> channel-syncs`, supplies a
`WalkedFile` with an exported `defineChannelSync(...)` call, and asserts the extracted contribution.
The test must not add `defineChannelSync` to the default table. Add focused rejection coverage for a
duplicate official callee and malformed identifiers without broadening into a parser rewrite.

### Published surface and corpus

This is an additive `@netscript/plugin/sdk` surface change. The new public types and changed
constructor/preset signatures must be visible in `deno doc` and documented in the package README.
They will stale the generated MCP export-surface corpus. The implementation must report that stale
artifact to the supervisor; it must not edit or regenerate `packages/mcp/**` in this leaf.

## Scope

- Define the readonly extractor configuration contract.
- Make official mappings defaults rather than the only mappings.
- Thread the options through the public `startWalker` preset.
- Export and document the new SDK contract.
- Prove synthetic third-party discovery and official backward compatibility.

## Non-Scope

- TypeScript compiler-backed AST/symbol resolution; existing `PLG-WALKER-AST` debt remains open.
- Manifest schema/builder changes or automatic manifest resolution during walking.
- CLI/scaffold/e2e integration, generated assets, or host transport of plugin descriptors.
- MCP corpus regeneration.
- Cleanup of existing doc-lint, JSR module-tag, README, cardinality, or builder-size debt.
- Alias/import-binding analysis, namespace calls, computed calls, or arbitrary expression discovery.

## Hidden Scope

- Because `./sdk` is published, constructor parameter and exported type documentation are part of
  the change even though runtime logic is small.
- The default preset must forward the seam; otherwise only lower-level pipeline users benefit.
- Duplicate/malformed descriptor handling must fail loud to avoid replacing one silent failure with
  another.
- The corpus impact must be handed off even though its generated file is beyond the ceiling.

## Locked Decisions

| ID | Decision                                                         | Rationale                                                                                            |
| -- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| D1 | Configure the existing `AstExtractor` at construction.           | `ExtractorPort` owns `WalkedFile` interpretation and is already injected into the pipeline.          |
| D2 | Add patterns to official defaults, never replace defaults.       | Protects both no-arg CLI consumers and the three official factories.                                 |
| D3 | Use per-instance immutable configuration, not a global registry. | Deterministic, test-isolated, and free of load-order side effects.                                   |
| D4 | Do not add discovery syntax to either manifest.                  | Neither manifest participates in the walker pipeline; doing so forces broader transport/schema work. |
| D5 | Fail on malformed and duplicate callees.                         | The issue is a silent extension failure; ambiguous configuration must be explicit.                   |
| D6 | Treat MCP corpus movement as reported external scope.            | The corpus serializes public Deno-doc signatures, but `packages/mcp` is not owned by this leaf.      |

## Open-Decision Sweep

| Decision                                                | Status        | Notes                                                                                                                          |
| ------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| How installed third-party descriptors reach CLI callers | safe to defer | Requires `packages/cli` ownership. The package seam is usable by direct SDK/preset consumers; no CLI behavior is claimed here. |
| Compiler AST versus bounded regex                       | safe to defer | Existing `PLG-WALKER-AST` debt already owns parser precision.                                                                  |
| Manifest declaration format                             | safe to defer | Not needed for an extractor extension and would expand the pipeline contract.                                                  |
| Descriptor naming                                       | resolved now  | Locked above to avoid public-surface churn during implementation.                                                              |
| Duplicate and invalid input behavior                    | resolved now  | Synchronous `TypeError`; no silent ignore or override.                                                                         |

No unresolved decision would force rework inside the locked S2 ceiling.

## Commit Slices

|  # | Slice                        | What it proves                                                                                                                                                        | Files                                                                          | Proving gates                                                                                                                        |
| -: | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
|  1 | Contract plus extractor seam | A caller-defined `defineChannelSync` mapping is extracted without modifying official defaults; invalid/duplicate patterns fail loud; official calls remain unchanged. | `extractor-port.ts`, `ast-extractor.ts`, `walker-ports_test.ts`                | focused structured test wrapper; scoped check/lint/fmt; quality scan                                                                 |
|  2 | Preset and published surface | The high-level preset forwards options and the documented `./sdk` export is consumable without breaking old calls.                                                    | `start-walker.ts`, `sdk/mod.ts`, `README.md`, focused test additions if needed | focused structured test wrapper; `deno doc`/doc-lint non-increase; publish dry-run; scoped check/lint/fmt; JSR/doctrine non-increase |

## Risk Register

| Risk                                                   | Mitigation                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| New mapping duplicates official output or changes axis | Reject duplicate callee configuration; retain private official defaults.                                |
| Caller mutates options after construction              | Snapshot/freeze effective patterns per instance.                                                        |
| Regex injection from a callee string                   | Accept TypeScript identifiers only before building a regular expression.                                |
| Plan overclaims current CLI support                    | State explicitly that two CLI consumers remain no-arg/default-only and require separate transport work. |
| Public type worsens existing doc/slow-type debt        | Explicit readonly types and JSDoc; exact doc-lint/JSR non-increase gates.                               |
| Corpus freshness gate fails outside owned path         | Report precise stale generated file and coordinate; do not absorb `packages/mcp`.                       |
| Parser debt expands the slice                          | Keep direct-export regex semantics unchanged; `PLG-WALKER-AST` remains deferred.                        |

## Anti-Patterns to Resolve or Avoid

| AP                            | Status               | Plan                                                                                                                       |
| ----------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| AP-9 premature abstraction    | risk                 | Add only the two-field mapping actually required by the existing extractor.                                                |
| AP-11 hidden globals          | risk                 | Per-instance options; no registration singleton.                                                                           |
| AP-24 closed variant dispatch | existing issue shape | Replace the closed private-only list with defaults plus injected patterns, not another switch/table requiring a core edit. |
| AP-25 load-time side effect   | risk                 | No registration at module evaluation.                                                                                      |

## Architecture Debt

| Entry                                 | Action   | Notes                                                                               |
| ------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `PLG-WALKER-AST`                      | preserve | This change opens factory configuration but does not claim compiler-backed parsing. |
| `plugin-builder.ts — F-1 size`        | none     | Unrelated and outside ceiling.                                                      |
| Existing JSR/doc/cardinality findings | none     | Exact non-increase contracts; no opportunistic cleanup.                             |

No new debt is planned. If the configured regex cannot prove the synthetic factory within the
existing direct-export grammar, stop and request rescope rather than weakening the acceptance test.

## Gate Table

The base measurements are recorded in full in `research.md`. Pre-existing reds are contracts, not
promised greens.

| Order | Gate                                                                      | Base                                                                                                     | S2 acceptance                                                                                                              |
| ----: | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
|     1 | Focused synthetic + compatibility tests via `.llm/tools/run-deno-test.ts` | NOT RUN by S1 static-only constraint; source census = 5 tests and official expectation = 3 contributions | Wrapper exits 0; synthetic custom factory passes without editing defaults; existing official expectation passes unchanged. |
|     2 | Scoped check                                                              | PASS: 153 files, 0 findings                                                                              | PASS.                                                                                                                      |
|     3 | Scoped lint                                                               | PASS: 153 files, 0 findings                                                                              | PASS; 0 dropped/refused.                                                                                                   |
|     4 | Scoped format                                                             | PASS: 153 files, 0 findings                                                                              | PASS.                                                                                                                      |
|     5 | Code-quality scan                                                         | PASS: 0 findings, 0 allowances                                                                           | PASS with `--max-allow 0`.                                                                                                 |
|     6 | Full export doc-lint                                                      | RED: 15 private refs, 0 missing JSDoc, 0 other                                                           | Non-increase: <=15 private refs; missing/other = 0; no S2-owned-file diagnostic.                                           |
|     7 | Package JSR audit                                                         | RED: 4 FAIL, 2 WARN, 1 INFO                                                                              | Exact non-increase; no finding on an S2-owned file.                                                                        |
|     8 | Package publish dry-run                                                   | PASS with 2 known dynamic-import warnings                                                                | PASS; exactly the same two warning locations/classes and no new warning.                                                   |
|     9 | Scoped doctrine scan                                                      | exit 0: 0 FAIL, 3 WARN, 1 INFO                                                                           | Exact non-increase and no new finding.                                                                                     |
|    10 | Public surface inspection                                                 | Current `AstExtractor` has no constructor and no pattern type                                            | `deno doc` shows documented optional options and exported types; old no-arg path remains.                                  |
|    11 | Lock hygiene                                                              | SHA-256 `edfa0c24b70e0d830acce68aad6f5da42b66a88527aef4b80f3f82d989d1820c`                               | Byte-identical hash.                                                                                                       |

Runtime, browser, scaffold, CLI E2E, Aspire, Docker, and release gates are N/A for this bounded SDK
configuration slice and are forbidden by the leaf brief.

## Dependencies and Handoff

- S2 depends on supervisor PLAN-EVAL disposition; this session does not self-certify.
- A later CLI-owned change is required if product acceptance demands automatic installed-plugin
  descriptor transport into the two current no-arg CLI consumers.
- The supervisor must assign the MCP corpus refresh to its owner or explicitly coordinate a rescope;
  this leaf stops at reporting the churn.

## Drift Watch

Record and stop for supervisor direction if implementation needs any path beyond the ceiling, if the
manifest becomes necessary, if a compiler AST is required, if an existing official result changes,
or if any measured red increases.
