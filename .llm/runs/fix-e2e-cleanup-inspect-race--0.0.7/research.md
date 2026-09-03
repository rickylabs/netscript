# Research — fix-e2e-cleanup-inspect-race--0.0.7

## Re-baseline

- Carried-in source: `implement-brief.md` and issue #1977.
- Re-derived against `origin/main` at `4afbd82a78f9f825b46b1dfdb6034ca3d45c514d` on 2026-09-03.
- What changed vs the carried-in version: nothing. The remote baseline and branch match the brief;
  the local `main` ref is stale and is not used as the baseline.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | `inspectAllContainers` lists ids with `docker ps -aq`, then sends each id through `requireSuccess('docker', ['inspect', id])`; every nonzero inspect currently throws. | `packages/cli/e2e/src/application/gates/scaffold/runtime/evidence/cleanup.ts` |
| 2 | `stopAndProbe` can inspect more than once and retains only the final container array in the receipt; vanished ids need aggregation if evidence is to remain complete across probes. | `cleanup.ts` `stopAndProbe` and `resolveOwnedSurvivors` call site |
| 3 | Existing cleanup unit coverage lives in `packages/cli/e2e/tests/application/gates/aspire-cleanup-evidence_test.ts`; the issue specifically asks for the race regression under the `evidence/` surface, so the new regression will be colocated as `cleanup_test.ts`. | repository search for cleanup exports and tests |
| 4 | The nested `packages/cli/e2e` workspace is a CLI-owned harness, not an independently published doctrine unit. The parent `packages/cli` is Archetype 6 with a current `Keep` verdict. | doctrine files 06, 09 (F-19), and 10 |
| 5 | No relevant debt entry covers this race. The existing `scaffold-runtime-a8-f16-1333` debt concerns the already over-cap runtime registry/gate directory and is not deepened by a fifth file in `runtime/evidence/`. | `.llm/harness/debt/arch-debt.md` |

## jsr-audit surface scan (package/plugin waves)

- N/A. This is a non-published nested E2E harness (`publish: false`) and changes neither
  `packages/cli/mod.ts`, its export map, JSDoc, nor a published dependency.

## Open questions

- None. The live issue fixes the error class, receipt requirement, scope ceiling, budgets, and
  hosted-runtime acceptance contract.
