use harness

## SKILL

- netscript-harness — run loop, commit-by-slice + push, run-dir artifacts.
- netscript-tools — manifest/parity gate correctness, evidence-only repairs.

## D-114 bounded correction: `check:aspire-version-parity` fails on two stale manifest paths

CI run `33344157488`'s `quality` job failed `Aspire version parity (phase 1)` with `fail=2`. Root
cause (confirmed by coordinator, reproduced locally): S6 moved two files into a `runtime/`
subdirectory, but `.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv` still
lists their old paths:

- `packages/cli/e2e/src/application/gates/scaffold/capture-db-endpoint-allocation.ts` →
  actual live path: `packages/cli/e2e/src/application/gates/scaffold/runtime/capture-db-endpoint-allocation.ts`
- `packages/cli/e2e/src/application/gates/scaffold/prepare-readiness-fixture.ts` →
  actual live path: `packages/cli/e2e/src/application/gates/scaffold/runtime/prepare-readiness-fixture.ts`

### Scope (bounded, evidence-only — no product/runtime code change)

1. In `aspire-surface-manifest.tsv`, update exactly those two lines' path column to their real
   `.../scaffold/runtime/...` location. Do not touch any other row, any other file, or the
   manifest's other columns (owner slice, notes) for those two rows.
2. Run `deno task check:aspire-version-parity` and confirm `fail=0` (paste the exact output).
3. Run format/lint check on the manifest file itself if it's covered by a formatting gate (check
   whether `.tsv` files are in scope for `deno fmt`/a dedicated manifest lint task; if not, note
   that and skip).
4. Do **not** touch any product source file, gate logic, health-check behavior, receipt shape, the
   D-101–D-113 architecture, or any test. This is a pure manifest-path metadata correction. No
   PLAN-EVAL, no DeepSeek/OpenRouter rerun — existing accepted evaluation and Phase-B receipts are
   unaffected (byte-identical product provenance).

### After this change

Commit (a clearly-scoped "chore" or "fix" commit touching only the manifest) and push. The
coordinator will let a fresh exact-head CI run complete and finish PR #1743's metadata/close-gate at
the new head.
