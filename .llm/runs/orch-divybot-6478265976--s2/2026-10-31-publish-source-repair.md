# Coordinator repair — publishable registry assets

Prior READY at56cc5be89 is superseded. Required CI run41148772405 fails Release preflight on three JSON import attributes in registry source. Owner comment6536722286 authorizes this repair and requires a green required quality job at the repaired head before renewing READY. No final repair sign-off or renewed READY is claimed by this provisional source checkpoint.

## Representation and freshness

- Added scripts/embed-registry-assets.ts using the existing token embedding pattern: canonical JSON parse, gzip/base64, explicitly typed generated TypeScript constants and Web DecompressionStream. Runtime imports ordinary TypeScript; no asset filesystem/network reads or import attributes remain.
- Catalog and both unchanged pinned schemas share src/registry/assets/registry.generated.ts. Synchronous Ajv SchemaObject preserves compile<T>'s unknown-input type guards without assertions or suppressions.
- Package registry:embed and registry:embed:check tasks generate/check the exact representation. Root gen:assets-barrel generates it; check:assets-barrel runs its read-only check BEFORE regeneration, so missing/stale assets fail the existing required CI freshness step.
- Removed only redundant raw JSON entries from publish.include; source JSON remains authoritative in the repository, and the upstream MIT license remains published. Public exports, registry content, schema semantics, components and S3 ownership are unchanged.

## Local proof

- Canonical release:preflight fails before with the three exact coordinator-reported findings; after repair it PASSes text imports, import attributes, eager file URLs and self imports with zero findings.
- Structured full S2 regressions366/0/0; separate actual CLI acceptance3/0/0; native publish-size test1/0/0; focused embedding/schema/authoring9/0/0. The two new tests prove exact catalog/schema parity and read-only stale/missing checks, plus deterministic regeneration. No skips or top-level process failures.
- All5 changed TS source/generated/test files pass structured check/lint/format with zero findings/drops/refusals. Root quality:gate now passes after the normal main merge retained the upstream docs-quality repair. No new allowance or suppression.
- Four carrier checks pass: assets barrel, publish assets, MCP export corpus and agent prose. Docs build retains253 HTML/87 registry JSON artifacts. Workspace publish:dry-run passes without uploading packages; current-head durable receipts follow this source commit.
- Native Fresh UI publish file set:100 files, **2,341,743 bytes**, existing cap **5,000,000** unchanged. Pre-repair file set:102 files,2,455,806 bytes; delta **-114,063** bytes. The brief's0.9 MB-class description differs from these directly measured native bytes; no fabricated0.9 MB claim or budget increase.
- Earlier Docker-unavailable runtime and123 unchanged component doc-lint limitations remain. This repair does not rerun the expensive runtime already attempted in the readiness pass; the new brief specifically requests preflight/S2/wrappers/carriers/publication/CI quality.

## Required remaining handoff

Push this provisional implementation; run the retained separate exact native Opus5.5 High read-only IMPL-EVAL and fix once if needed. Commit/push its evidence before the final CI run so the final checked head is not invalidated. Ready the repaired draft to schedule required CI (draft pushes intentionally skip it), then wait for the required quality job to succeed at that exact head before renewing the canonical READY report. Record CI proof in PR/issue comments without moving the checked head. Stop for Cockpit merge; no labels, force push, new PR, tag or release.
