use harness

## SKILL

Continue under the skills and reading already loaded for this leaf (`netscript-harness`,
`netscript-pr`, `netscript-tools`, `netscript-deno-toolchain`, `rtk`), plus
`.llm/harness/gates/plan-gate.md`.

# Coordinator rescope — #1709 envelope four → six paths (PLAN ONLY)

## The decision

Your mandatory read-only audit **found the symmetric defect in `run-deno-fmt.ts`** — the identical
batch-size-dependent false green. That was exactly the evidence condition the frozen contract set
for widening, so the coordinator has **accepted the formatter defect into this same leaf** rather
than spinning a follow-up. Good audit; this is the outcome the contract was written to allow.

**This is a PLAN envelope change only. No product mutation this turn.** Everything else about your
stop lines is unchanged.

## New authorized envelope — exactly six paths

| Path                                                        | Status                        |
| ----------------------------------------------------------- | ----------------------------- |
| `.llm/tools/run-deno-lint.ts`                               | unchanged                     |
| `.llm/tools/run-deno-lint_test.ts`                          | unchanged                     |
| **`.llm/tools/run-deno-fmt.ts`**                            | **added by this rescope**     |
| **`.llm/tools/run-deno-fmt_test.ts`**                       | **added by this rescope**     |
| `deno.json`                                                 | unchanged                     |
| `packages/cli/src/kernel/assets/agent-tools.generated.ts`   | unchanged — canonical regeneration only |

**No seventh path.** If the plan appears to force one, stop and report rather than taking it.

## What the plan must now do

1. **Separate, ordered refusal slices for lint and fmt if — and only if — their parsers or
   completion signals differ.** Do not merge them into one slice on the assumption that they are
   symmetric; prove the signal shape for each. If the signals genuinely are identical, say so with
   evidence and justify a shared slice. Note that `deno fmt` and `deno lint` report differently
   (`Checked N files` versus finding streams), which is precisely why this must be established
   rather than assumed.
2. **Shared invariants across both wrappers** — one selected-vs-processed identity contract and one
   batch-size invariant, stated once and applied to both, not two divergent definitions.
3. **Symmetrical structured JSON causes** — a dropped-file refusal must be expressed the same way in
   both wrappers' reports, so a consumer can handle them uniformly.
4. **Must-not-regress proofs for both** — all-excluded selection and empty-selection refusals stay
   fail-closed in lint *and* fmt.
5. Keep the **sequencing already accepted**: the root `lint` task's obsolete doctor-family exclusion
   is corrected **first**, before either stricter refusal is enabled.
6. Carry the fmt evidence you produced in the audit into `research.md` as first-class findings now
   that they are in scope, not as an appendix.

## Publish consequence — re-check, do not assume

`run-deno-lint.ts` is in `.llm/tools/consumer-tools.json` and embedded in the published
`agent-tools.generated.ts`. **Verify whether `run-deno-fmt.ts` is also a consumer tool.** Earlier
supervisor research indicated it is **not**, which would mean the barrel delta stays confined to the
lint tool text and `EMBEDDED_AGENT_TOOL_BUNDLE_HASH`. Confirm that yourself and state it plainly —
if fmt *is* embedded, the publish disclosure and the JSR row change and the plan must say so.

## Unchanged stop lines

Research and plan only. No product, tooling, config, or workflow mutation — including the fmt
wrapper you just gained planning authority over. Gate set unchanged: `check`, `test`,
`publish-dry-run`, `quality-job`, `check:assets-barrel`. `scaffold.runtime`, Aspire, Docker,
browser/E2E, MCP JSR, docs-site gates and every lease remain **N/A** and must not be requested.

Commit, push by explicit refspec, update the draft PR record if you opened one, then **stop** for the
supervisor's fresh independent Tier-A. PLAN-EVAL and implementation remain separate later
authorizations. Report your thread id, commit SHA, plan head, PR number/URL if any, and whether the
lint and fmt signals differed.
