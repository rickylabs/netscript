# Refusal mutation tests — FAIL_FIX repair

## Attestation

- Immutable implementation head: `4238670173271bca4281eba7db6c2030d046bc73`.
- Source preparation: full-repository `git archive` raw exit 0; extraction into each of four
  independent `.llm/tmp/` copies raw exit 0.
- Each copy retained the committed test file unchanged and mutated only the named checker branch.
- Each command selected exactly one named test; every selection reported `1 test`, so no empty
  selection was treated as evidence.

## Discriminating controls

| Refusal                | Checker mutation in archive copy                        | Named test filter                               | Raw exit | Observed result                        |
| ---------------------- | ------------------------------------------------------- | ----------------------------------------------- | -------: | -------------------------------------- |
| INVENTS                | Disabled the `!expectedSymbols.has(sym)` refusal branch | `refuses an invented symbol`                    |        1 | `0 passed / 1 failed / 5 filtered out` |
| Unknown mode           | Accepted the unknown mode as `entrypoints-only`         | `refuses an unknown coverage mode`              |        1 | `0 passed / 1 failed / 5 filtered out` |
| Empty/malformed reason | Disabled the nonempty-reason error branch               | `refuses an empty or malformed coverage reason` |        1 | `0 passed / 1 failed / 5 filtered out` |
| OMITS                  | Disabled the `!docSymbols.has(sym)` refusal branch      | `refuses an omitted symbol`                     |        1 | `0 passed / 1 failed / 5 filtered out` |

The unchanged invented-symbol test documents both `actualSymbol` and `inventedSymbol`, so OMITS
cannot mask an INVENTS regression. All policy-refusal tests use the real `withSymbolFixture` package
and document paths. Every refusal assertion requires raw code 1, exactly one captured
`console.error`, the branch-specific message, and the absence of a `Failed to read` substitute.

## Restored control

- Untouched repository test suite: raw exit 0; 6 passed, 0 failed.
- Diff from the immutable head across checker and test: raw exit 0 with no diff after the mutation
  runs.
- Mutation scratch cleanup: raw exit 0; explicit absence check raw exit 0.
