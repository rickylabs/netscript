# PR-D drift

## 2026-08-12 — D-1: widened docs scan exposes three out-of-scope findings

Severity: significant (final gate contradiction)

After the scanner began treating `docs/site/**/*_test.ts` companions as docs fixtures rather than
exempt tests, the measured scan found three pre-existing `explicit-any` violations outside this
slice's two named trigger files:

| File                                             | Line | Rule           | Assessment                                                                                               |
| ------------------------------------------------ | ---: | -------------- | -------------------------------------------------------------------------------------------------------- |
| `docs/site/reference/contracts/examples_test.ts` |   13 | `explicit-any` | Pre-existing Prisma-shaped fixture signature (`args: any`, `Promise<any[]>`); outside the allowed files. |
| `docs/site/reference/contracts/examples_test.ts` |   22 | `explicit-any` | Pre-existing sort callback parameters; outside the allowed files.                                        |
| `docs/site/reference/contracts/examples_test.ts` |   43 | `explicit-any` | Pre-existing Prisma-shaped count signature; outside the allowed files.                                   |

The implementation brief requires all docs companions to be scanned, forbids fixing surfaced
findings or adding a new `quality-allow:`, limits edits to named files, and also requires
`quality:scan` plus `quality:scan:repo` to finish green. Those requirements cannot all hold for this
baseline. The finding count is **3**. Work continues on unblocked contracts; the final scan gates
remain blocked pending orchestrator direction on ownership or an explicit baseline policy.

The named trigger location also drifted from the brief's `index.md:310` to current line 173; the
symbol and executable twin still match the requested defect exactly.

## 2026-08-12 — D-2: required asset freshness mutates an out-of-bound generated file

Severity: significant (final gate contradiction)

`deno task gen:assets-barrel` exits 0 and regenerates
`packages/cli/src/kernel/assets/agent-tools.generated.ts` because the embedded
`quality/scan-code-quality.ts` payload and bundle hash changed. The resulting delta is 2 insertions
and 2 deletions. The required gate says the command must be followed by an empty
`git status --porcelain`, but the slice boundary says to touch only quality tools, one workflow, the
two trigger files, the two doctrine allowance lines, and this slice directory. The generated package
file is not in that list.

The generated delta is left uncommitted pending orchestrator direction; it is not folded into the
slice silently. Green freshness requires explicit authorization to add that generated file (the
normal consequence of changing an embedded agent tool), or a correction to the gate/boundary.

## 2026-08-12 — D-3: orchestrator-authorized connected scope

The orchestrator confirmed both contradictions were errors in the implementation brief and granted
the minimal connected scope explicitly:

> “AUTHORIZED — D-1: fix exactly the three findings, and only those three”

This authorizes sound typing for only lines 13, 22, and 43 of
`docs/site/reference/contracts/examples_test.ts`. The fixture keeps its Prisma-shaped input and
pagination semantics; no cast, TypeScript suppression, or quality allowance is permitted.

> “AUTHORIZED — D-2: commit the generated derivative”

This authorizes only the deterministic `gen:assets-barrel` output at
`packages/cli/src/kernel/assets/agent-tools.generated.ts`, followed by a second generator run and
empty `git status --porcelain` as the idempotence proof.

The orchestrator also accepted the stale trigger line as non-defective: the symbol remained the same
while `index.md:310` moved to line 173. No further action is required for that location drift.

## 2026-08-12 — D-4: authorized scope complete

D-1 closed in `d876bfa93635ce924539f12ad236fc482f2d5815`: the three Prisma-shaped fixture findings
now use `unknown` inputs, record/key narrowing, a typed sort comparator, and `Promise<MockItem[]>`.
The direct scanner reports zero findings, the file type-checks, and its three pagination tests pass.
No additional finding surfaced.

D-2 closed in derivative-only commit `f73fb369620e154f4c134cccf16423c9ae2f8f4c`. The first generator
run produced only the expected generated file; the second generator run exited 0 and
`git status --porcelain` was empty. The generated asset was not hand-edited.

## 2026-08-12 — D-5: IMPL-EVAL found consumer-bundle import closure missing

Severity: high (introduced installed-bundle failure)

Formal IMPL-EVAL on head `7264ce6aac21eecade916ea4b0332f5a1912e0c3` found that the generated
consumer bundle was current with respect to `consumer-tools.json` but incomplete with respect to
its own imports. Installed `quality/scan-code-quality.ts --help` could not resolve
`../docs/snippet-extractor.ts`. This is a correction within the same leaf, not a reversal of R-10:
the shared extractor remains the sole fence parser.

The durable correction adds a non-runnable `modules` manifest category, registers the extractor,
includes module paths and bytes in the canonical bundle identity, and adds a generic relative-import
closure test with an omitted-module negative control. The existing installed-bundle smoke remains
the end-to-end executable proof and now covers the repaired scanner import.
