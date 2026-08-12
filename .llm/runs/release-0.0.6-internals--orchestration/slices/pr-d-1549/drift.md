# PR-D drift

## 2026-08-12 — D-1: widened docs scan exposes three out-of-scope findings

Severity: significant (final gate contradiction)

After the scanner began treating `docs/site/**/*_test.ts` companions as docs fixtures rather than
exempt tests, the measured scan found three pre-existing `explicit-any` violations outside this
slice's two named trigger files:

| File | Line | Rule | Assessment |
| --- | ---: | --- | --- |
| `docs/site/reference/contracts/examples_test.ts` | 13 | `explicit-any` | Pre-existing Prisma-shaped fixture signature (`args: any`, `Promise<any[]>`); outside the allowed files. |
| `docs/site/reference/contracts/examples_test.ts` | 22 | `explicit-any` | Pre-existing sort callback parameters; outside the allowed files. |
| `docs/site/reference/contracts/examples_test.ts` | 43 | `explicit-any` | Pre-existing Prisma-shaped count signature; outside the allowed files. |

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
`git status --porcelain`, but the slice boundary says to touch only quality tools, one workflow,
the two trigger files, the two doctrine allowance lines, and this slice directory. The generated
package file is not in that list.

The generated delta is left uncommitted pending orchestrator direction; it is not folded into the
slice silently. Green freshness requires explicit authorization to add that generated file (the
normal consequence of changing an embedded agent tool), or a correction to the gate/boundary.
