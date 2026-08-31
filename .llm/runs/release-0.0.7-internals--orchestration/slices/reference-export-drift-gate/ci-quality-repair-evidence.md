# CI changed-source quality repair evidence

## Finding and repair

GitHub Code quality run `31908898023` scanned the nine changed source paths selected between main
`0ef48c2ec` and PR head `05ac90d0`. It attributed exactly two findings to this leaf, both in
`.llm/tools/docs/check-exports-drift.ts`:

- former line 356, `explicit-any`: the `deriveExpectedExports` `exportsObj` parameter;
- former line 372, `unsafe-cast`: manual access to a conditional export's `default` member.

The local pre-fix reproduction used the exact nine-file CI selection and returned raw exit 1 with
those same two findings, zero allowances, and no additional finding.

The repair models the actual configuration vocabulary as `DenoExports`, `DenoExportTarget`, and
`DenoConditionalExportTarget`. `deriveExpectedExports` accepts the untrusted JSON boundary as
`unknown`; `isExportsRecord` and `isDenoExportTarget` narrow it without a cast. The fixed sites are
now `exportsObj: unknown` at line 364 and the narrowed `resolveDenoExportPath` call/helper at lines
384 and 399-401.

No scanner allowance, suppression, lint-ignore, unsafe cast, or gate weakening was added.

## Behavior decisions

1. A string export still maps directly to its path. A conditional object with a string `default`
   still maps to that path.
2. A missing `default`, empty-string `default`, or other falsy malformed `default` maps to exactly
   `''`, preserving the prior fallback.
3. A target-level `null` now deliberately maps to `''` instead of throwing. This is the one
   intentional pathological-input behavior change: one malformed target no longer aborts the entire
   audit and instead remains an empty path that downstream drift comparison can expose.
4. A top-level `exports` value that is neither a string nor a non-array object now throws
   `TypeError('Deno exports must be a string or a record')`. This is fail-closed; primitives can no
   longer pass through `Object.entries` as an empty inventory.

The focused assertions are discriminating: separate cases lock the root string form, record string
target, conditional `default`, missing default, falsy/malformed default, target-level `null`, and
malformed top-level refusal. The pre-existing four refusal tests remain intact.

## Gates

| Proof                                                   | Raw exit | Result                                                                            |
| ------------------------------------------------------- | -------: | --------------------------------------------------------------------------------- |
| Exact CI nine-file changed-source quality scan, pre-fix |    **1** | Exactly the two attributed findings; zero allowances                              |
| Exact CI nine-file changed-source quality scan, final   |        0 | Nine nonempty scanned paths; zero findings and zero allowances                    |
| Focused TypeScript format check                         |        0 | Both edited files formatted                                                       |
| Focused `deno check --unstable-kv`                      |        0 | Checker and checker test type-safe                                                |
| Root `deno task check`                                  |        0 | Package/plugin selection cache-valid; focused check above covers this `.llm` tool |
| Root `deno task test`                                   |        0 | 4,217 passed, 0 failed, 19 ignored; 4,236 total                                   |
| Focused checker tests                                   |        0 | 12 passed, 0 failed                                                               |
| `deno task docs:exports-drift`                          |        0 | Eight package reports and terminal PASS                                           |
| Forbidden-command scratch precheck                      |        0 | 1 passed, 0 failed before the root test                                           |
| Generated-cascade working diff                          |        0 | All four generator-owned outputs byte-unchanged; no generator ran                 |
| `deno.lock` working diff                                |        0 | Byte-identical blob `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`                    |

The drift output is unchanged: `fresh-ui`, `config`, `contracts`, and `telemetry` remain
`mode=complete`; `plugin`, `queue`, `sdk`, and `service` remain `mode=entrypoints-only`. Every row
still prints its reason and omission-group counts. Fresh UI reports 0 omitted groups / 1 documented
non-export group; Contracts reports 0 / 0.

## Boundaries

Only the already-authorized checker and assertion files changed, plus append-only artifacts in this
leaf's run directory. All `impl-eval*`, `plan-eval*`, prior audits, and prior receipts—including the
SA4 red—remain byte-unchanged. `gen:mcp-export-corpus`, close-gate, evaluators, readiness, issue
boxes, mirrors, merge, runtime, and publication are `NOT_RUN` / `NOT_FIRED` as applicable.

A first porcelain scope-classifier wrapper returned raw exit 1 after trimming the leading status
column from its first record; it made no scope claim. The corrected column-preserving classifier
returned raw exit 0 for exactly two implementation paths and four run-artifact paths.
