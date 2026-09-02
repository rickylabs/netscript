# Worklog

## Design

- Public surface: unchanged; all 17 export-map entrypoints remain as-is.
- Domain vocabulary, ports, constants: N/A for a publish-filter-only metadata slice.
- Commit slice: one additive exclusion plus harness evidence, proven by publish-set enumeration and scoped package gates.
- Deferred scope: source/runtime/browser/CLI work and #1895's concurrent patterns.
- Contributor path: publish contents are controlled by `packages/fresh/deno.json` under `publish.include` and `publish.exclude`.

PLAN-EVAL: N/A — the issue supplies a complete mechanical contract and acceptance evidence.

## Baseline evidence

| Evidence | Result |
| --- | --- |
| Branch baseline | `77ad823dcb1874ccfc8964b4679ad92a3a145e0b` = `origin/main` |
| Lock SHA-256 | `e52c167e48e78a3c822ee1e63d5874401e1a02d0c49c214e1cd2df189272c46d` |
| Publish dry-run | exit 0; 155 entries from stderr; 19 `tests/` entries |
| Export-map `deno doc` | exit 0; 17/17 entrypoints |
| Entrypoint grep | `rg 'tests/'` exit 1; zero matches |

## Gate evidence

| Gate | Exit | Result |
| --- | ---: | --- |
| Post-change `deno publish --dry-run --allow-dirty` | 0 | 136 stderr publish entries; 0 under `tests/` |
| Scoped Fresh check wrapper | 0 | 207 files, 2 batches, 0 failed batches/findings |
| Fresh source test wrapper | 0 | 254 passed, 0 failed, 0 ignored |
| Evaluator whole-package Fresh test wrapper | 0 | 276 passed, 0 failed, 0 ignored |
| `deno task check:assets-barrel` | 0 | fresh |
| `deno task check:publish-assets` | 0 | fresh |
| `deno task check:mcp-export-corpus` | 1 | unrelated stale baseline carrier; see causality check below |
| `deno task gen:mcp-export-corpus` (diagnostic) | 0 | generated 35 packages, 272 subpaths, 7,803 symbols; output reverted |
| `deno task quality:gate` | 0 | quality scan and doctrine check passed; pre-existing warnings only |
| Focused JSR package audit | 0 | package inspected; two pre-existing warnings, no failures |

## Reconcile

- The implementation remains one additive publish-filter line plus harness evidence.
- No #1895 patterns were copied, and no source or other package configuration changed.
- IMPL-EVAL completed with `PASS` in separate session `e300572e-3af6-4431-8629-f655c5ed42ea` (Claude Fable 5.1, medium). Its low finding about the implementation brief was resolved by adding the required `## SKILL` section before commit.

## Corpus causality check

- Regenerated carrier SHA-256 with `"tests/"` temporarily absent: `484005d66dfc4b19669e62fd11bdf82975311d213c396feb131f3f3d92528831`.
- Regenerated carrier SHA-256 with `"tests/"` present: `484005d66dfc4b19669e62fd11bdf82975311d213c396feb131f3f3d92528831`.
- The generated delta (12 additional symbols; uncompressed corpus +4,401 bytes; compressed corpus +448 bytes) is byte-identical regardless of this slice. It is unrelated baseline staleness, so the generated file was restored from `HEAD` as the owner directed. The final corpus check truthfully exits 1 for that pre-existing condition.
