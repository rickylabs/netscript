# IMPL-EVAL — Wave 5 `@netscript/service` Consolidation (Phase A)

- Branch: `feat/package-quality-wave5-apps`
- Run: `feat-package-quality-wave5-apps--consolidation`
- Scope: `packages/service` — Archetype 4 (Public DSL/Builder)
- Output artifact: `.llm/tmp/run/feat-package-quality-wave5-apps--consolidation/impl-eval-service.md`
- Evaluator session: independent, no edits to `packages/`, no implementation, no merging.

## Summary

Independent IMPL-EVAL of the post-merge Phase A tree on the umbrella
branch. Phase A split `packages/service/src/service-builder.ts` (was
604 LOC) into
`src/builder/{service-builder,service-builder-impl,service-rpc,service-listener}.ts`,
introduced package-owned structural public types (`ServiceContext`,
`ServiceHandler`, `RunningService`, ...) in `src/types.ts` to remove
Hono/oRPC vendor types from public signatures, and added a
DB-connectivity startup diagnostic in `src/diagnostics/`. The single
`.` export (`mod.ts`) is unchanged at the symbol level.

All 7 evaluator verify items came back PASS with raw-evidence snippets
captured in the artifact. The two open `packages/service` debt entries
in `.llm/harness/debt/arch-debt.md` (role-clarification Refactor verdict
and D-9 `assets/scalar.min.js` 3.3 MB vendored) are DEBT_ACCEPTED with
explicit owner + target. The `builder/`+`primitives/` folder-vocabulary
nuance is covered by the existing role-clarification debt entry and is
not a new violation.

## Changes

No source-code changes (this is an **eval-only** session). Files written:

- `.llm/tmp/run/feat-package-quality-wave5-apps--consolidation/impl-eval-service.md`
  (≈360 LOC) — the deliverable, with one `## Verify N` heading per
  item, a `## Verdict` heading, gate evidence, and a final verdict line
  that maps the protocol `PASS` to the trigger-comment
  `VERDICT: APPROVED`.
- This summary file.

## Validation

All gates run from the repository root and scoped to `packages/service/`:

| Gate                        | Command                                                                          | Result |
| --------------------------- | -------------------------------------------------------------------------------- | ------ |
| Type check                  | `deno task check`                                                                | PASS   |
| Lint                        | `.llm/tools/run-deno-lint.ts --root packages/service --ext ts,tsx`               | PASS (17 files, 0 findings) |
| Format                      | `.llm/tools/run-deno-fmt.ts --root packages/service --ext ts,tsx`                | PASS (17 files, 0 findings) |
| Doc-lint (F-5 family)       | `.llm/tools/run-deno-doc-lint.ts --root packages/service --pretty`              | PASS (0 privateTypeRef, 0 missingJSDoc, 0 other) |
| JSR publish dry-run         | `deno publish --dry-run --allow-dirty`                                          | PASS ("Success Dry run complete") |
| Tests                       | `deno task test`                                                                 | PASS (17/17, 705 ms) |
| README-example drift test   | `deno test --allow-all tests/_fixtures/readme-examples_test.ts`                  | PASS (2/2) |
| F-1 (file ≤500 LOC)         | `wc -l src/builder/*.ts src/types.ts mod.ts`                                     | PASS (max 408 LOC) |
| F-11 (folder vocab)         | `find src -mindepth 1 -type d`                                                   | PASS (4 folders; no forbidden names; `builder/`+`primitives/` flagged for tracking) |
| F-13 (runtime lifecycle)    | grep `RunningService.stop` + AbortSignal                                        | PASS (test "serve stops when external signal aborts" passes) |
| F-16/F-18 (vendor leak)     | `grep -cE "import .* (hono|orpc)" src/types.ts`                                  | PASS (0 hits) |
| F-3 (layering)              | builder / diagnostics / presets / primitives / types.ts roles consistent        | PASS |

Quantitative structure checks (Doctrine 05):

- `src/` top-level children: 5 (4 folders + `types.ts`) — well under
  the ≤12 cap.
- Max depth: 2 (`src/<role>/<file>.ts`) — under the ≤4 cap.
- No forbidden folder names from F-11.

## Responses to review comments or issue comments

n/a — this is an IMPL-EVAL pass (independent evaluator), not an
implementation iteration responding to PR review threads. No new
findings to record beyond what is captured in `impl-eval-service.md`.
The single pre-existing drift entry
(`2026-06-14 — carried-in plan path absent (significant)`) is a
harness-process reconciliation: the user-cited prior `plan.md` path
does not exist locally, but the prior OpenHands output is already
merged into the umbrella branch and the re-baseline was re-derived
from the live tree. The inspected tree itself is the prior work's
result, so no code-level drift was introduced.

## Remaining risks

- The `builder/` + `primitives/` folder-vocabulary nuance (singular
  `builder/` instead of doctrine-A4 `application/builders/`, and the
  use of `primitives/` for handler factories) is **tracking-only** in
  the existing `packages/service — doctrine verdict Refactor` debt
  entry (F-3, F-11). Future waves should refine the role names; this
  evaluator did not block Phase A on it because the open debt entry
  already names it.
- `assets/scalar.min.js` (3.3 MB) is intentionally vendored in the
  JSR publish per locked decision D-9. The asset is included in the
  publish-target list but `deno publish --dry-run` still reports
  "Success Dry run complete". No new risk.
- `doc-lint` is provided at the **repo wrapper** level
  (`.llm/tools/run-deno-doc-lint.ts`); the package's own `deno.json`
  does not declare a `doc-lint` task. This matches every other
  package in the workspace and is not a finding.
- No new debt entry was created in this pass. The two existing
  `packages/service` debt entries remain open and DEBT_ACCEPTED.

## Verdict

`VERDICT: APPROVED`
