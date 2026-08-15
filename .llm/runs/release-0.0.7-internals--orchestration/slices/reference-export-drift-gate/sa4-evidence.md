# SA-4 evidence — canonical generated publication cascade

## Attestation and generation

- Tier-A authorization: PASS on SA-3 head `f98cfabacb6ac362e8fcc8e56b180b55aa69c339`.
- Immutable generated-content head: `46528ae4c71b3744f0af64bd749d01d831f70c89`.
- Frozen base: `baf1cdf67a4e931af17b4772ddf6101f36152184`.
- The content commit changes exactly the four coordinator-approved generated paths. No generated
  file was hand-edited and `gen:mcp-export-corpus` was not run.
- One initial `gen:agent-docs-prose` tool cell was lost after it modified the expected two corpus
  files. Its exit was unavailable and is not counted. The observed rerun returned raw exit 0 and
  left the two-file diff SHA-256 unchanged.
- First fully observed pass: `gen:agent-docs-prose`, `gen:publish-assets`, and `gen:assets-barrel`
  each returned raw exit 0. Its four-path binary diff SHA-256 was
  `a47278e3c07b2c31358ca2e5d1fbdf9f5539e265e280848b875b9ab6984ae9bc`.
- Second pass: all three generators returned raw exit 0; the same four paths and exact same diff
  SHA-256 remained.
- After committing content, all three generators returned raw exit 0 again at the immutable head;
  direct Git status and diff were empty. All subsequent freshness gates left the generated tree
  unchanged.

The refreshed prose corpus is 4,768,211 uncompressed bytes / 1,367,454 compressed bytes with SHA-256
`78d5fed4792e34b8592dbf2fd5b87ae879e71dac54a4cca99cad700a58030114`. The CLI mirror embeds that
corpus and its provenance. MCP's bounded prose bytes remain separate, but its published fallback
provenance now records source commit `f98cfabac`; this is the narrow publish delta established in
SA-3.

## Head-bound receipts

All twelve receipts in `receipts/sa4/` attest the same immutable content head.

| Gate                      | Outcome  | Raw exit | Notable result                                                            |
| ------------------------- | -------- | -------: | ------------------------------------------------------------------------- |
| `check`                   | PASS     |        0 | Nonempty selection: 2,924 files, 25 batches, zero findings                |
| `test`                    | **FAIL** |    **1** | 4,202 passed, 1 failed, 19 ignored; see honest red below                  |
| `quality-job`             | PASS     |        0 | CI quality composite green; existing dependency warnings retained         |
| `arch-check`              | PASS     |        0 | Zero doctrine failures; existing WARN/INFO findings retained              |
| `docs-source-format`      | PASS     |        0 | `Docs source format: OK` from `docs/site`                                 |
| `docs-source-format-test` | PASS     |        0 | 6 passed, 0 failed from `docs/site`                                       |
| `docs-tagline`            | PASS     |        0 | 36 checked, zero over the JSR tagline cap                                 |
| `docs-accuracy`           | PASS     |        0 | Aggregate and named export-drift child completed fail-closed              |
| `agent-docs-prose`        | PASS     |        0 | Rebuilt site and verified the checked-in corpus/provenance                |
| `publish-assets`          | PASS     |        0 | MCP publish mirror fresh                                                  |
| `assets-barrel`           | PASS     |        0 | CLI asset barrel fresh; generator left no diff                            |
| `publish-dry-run`         | PASS     |        0 | Workspace static simulation; 318,629 bytes of member/file output reviewed |

The checked-in evidence-set evaluation is intentionally `INSUFFICIENT`, with the single reason
`test did not pass (FAIL)`. The test receipt is not laundered: the sole failure is
`repository contains no shared-host bulk teardown command`, which found
`.llm/tmp/claude/hooks/unscoped/events.jsonl: aspire stop --all`. That scratch was not created or
owned by this generation pass, so it was left alone. The earlier historical red
`receipts/fix1/test.json` is also preserved unchanged.

`publish-dry-run` is static packaging and isolated-declaration evidence only. It does not prove a
real publish, installation, remote dependency graph, or production behavior; no publish ran.

## Focused and publication evidence

- `deno task docs:exports-drift`: raw exit 0; eight nonempty package reports, with mode, reason,
  omission-group counts, and terminal PASS.
- Focused checker test: raw exit 0; 6 passed, 0 failed.
- Pages structural test: raw exit 0; 1 passed, 0 failed.
- CI classifier/workflow test: raw exit 0; 60 passed, 0 failed.
- `check:mcp-export-corpus`: **RED, raw exit 1**, reporting the known stale corpus. It was run
  read-only, not regenerated, waived, or reclassified.
- Contracts full-export doc lint: **RED, raw exit 1**; 9 private-type-ref findings and zero other
  findings, unchanged from the accepted baseline.
- Fresh UI full-export doc lint: **RED, raw exit 1**; 123 findings (96 private-type-ref and 27
  missing-jsdoc), unchanged from the accepted baseline.

| Member                       | Audit | Existing findings retained   | Exact internal member pins | Published generated delta                                                        |
| ---------------------------- | ----- | ---------------------------- | -------------------------- | -------------------------------------------------------------------------------- |
| `@netscript/contracts@0.0.6` | raw 0 | 1 sanctioned slow-type INFO  | 0                          | Four shipped JSDoc lines; no API/export/schema delta                             |
| `@netscript/fresh-ui@0.0.6`  | raw 0 | 4 WARN; 1 slow-type warning  | 2, both exact `0.0.6`      | Reference is upstream input, not a package-file delta                            |
| `@netscript/cli@0.0.6`       | raw 0 | 19 WARN; 1 slow-type warning | 6, all exact `0.0.6`       | `src/kernel/assets/agent-docs.generated.ts` (1.75 MB) selected by member dry-run |
| `@netscript/mcp@0.0.6`       | raw 0 | 3 WARN; 1 slow-type warning  | 3, all exact `0.0.6`       | `src/publish-assets.generated.ts` (281.23 KB) selected by member dry-run         |

The corrected exact-pin selector returned raw exit 0 with counts 0/2/6/3. A preliminary generic
string scan returned raw exit 1 because it incorrectly treated each package's own `name` field as a
dependency pin; it is a rejected measurement, not a package red. Likewise, an initial CLI
file-selection filter failed to retain the filter's `PIPESTATUS`; no filter verdict was claimed. The
corrected CLI and MCP member runs both recorded raw publish exit 0 and raw nonempty-filter exit 0.

## Scope, lock, and boundaries

- Direct base-to-content-head Git list: raw exit 0.
- Seventeen-path classifier: raw exit 0; contract size 17, changed implementation paths 14,
  unauthorized paths 0. The other committed paths are this leaf's append-only run artifacts.
- Forbidden-surface diff: raw exit 0 for `docs/exports`, `deno.lock`, all four audited member
  configs/export maps, the already-correct Contracts barrel/primitive JSDoc, MySQL paths, and the
  excluded MCP export corpus.
- `docs/exports` remains absent: raw exit 0.
- Base, content-head, and working-tree `deno.lock` blob IDs are byte-identical:
  `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- Post-gate generated-output and lock diffs both returned raw exit 0.
- No archive/tarball existed under `.llm/tmp/`; no foreign scratch was deleted.

`fresh-browser` remains N/A / waived and `NOT_RUN`; no runtime lease exists. Close-gate is
`NOT_RUN`. Aspire, Docker, browsers, `e2e:cli`, scaffold/runtime/service smokes, real publish,
cleanup, merge, label/issue-box/draft-state changes, readiness, and central-state mutations remain
`NOT FIRED`. The preserved pre-finding IMPL-EVAL PASS was not amended. A fresh delta IMPL-EVAL,
readiness, and merge remain coordinator-owned.
