# PLAN-EVAL round 2 — issue 2155

**Verdict: PASS.** The round-1 blocker is resolved, nothing new blocks the plan, and implementation can start. This is the same evaluator session, read-only, on head `4d68d1f` against baseline `ad252e8`; I did not read `profiles/`.

## Round-1 blocker (retry override shape)

The new section at `plan.md:21-25` locks every constraint I asked for:

| Required constraint | Where it's locked |
| --- | --- |
| The builder result stays private | `base` is a non-exported local |
| Exactly one exported definition per id | `export default Object.freeze({ ...base, retry }) satisfies typeof base` |
| The full retry policy is written out, with no partial merge | All five fields are named: `maxAttempts`, `initialDelayMs`, `maxDelayMs`, `backoffMultiplier`, `jitter` |
| The docs say static discovery omits it but the runtime loads it | Stated explicitly, with no claim that it shows up in static counts |
| A risk entry with mitigation and gate | Duplicate-id ordering risk, single-export mitigation, snippet compile plus an optional docs-tooling registration check, all under `.llm/tools/docs/**` |

I re-checked the new shape against source:
- **A default export is loaded.** The generated runtime registry checks `module.default` first and then `Object.values(module)`. Both are present in `plugins/triggers/src/cli/trigger-registry-compiler.ts:77` and `generate-runtime-registries.ts:125`. The default export therefore shows up twice in the candidate list, but it is the same object under the same id, so the `Map` keeps one entry. `project-trigger-registry.ts:76-78` reads from `registry.values()`, so the processor sees it once.
- **The CLI still recognizes it.** The CLI inspect path (`triggers-cli-backend-support.ts:101`) also checks `module.default`. Its kind detection looks for the `defineWebhook` text in the source, and the base still calls it.
- **The barrel fallback is not a new gap.** The fallback in `project-trigger-registry.ts:11-16` only runs when no generated registry exists. The scaffolded `triggers/mod.ts` (`barrel.ts:54-75`) either exports nothing or names the sample files, so every new trigger needs a manual barrel edit whatever its export style.

## Non-blocking notes for IMPL-EVAL

- `research.md:26` gives the wrong location for the runtime registry compiler (`packages/cli/src`). It actually lives in `plugins/triggers/src/cli/trigger-registry-compiler.ts` and `generate-runtime-registries.ts`. The public docs must cite the real paths if they cite any; IMPL-EVAL should check this.
- If the docs mention the hand-maintained `triggers/mod.ts` barrel, they should note that a default-exported trigger must be re-exported by name, because `export *` drops default exports.

## Rest of the checklist (unchanged since round 1, still holds)

- Research is current against the baseline.
- Decisions are locked, and the open-decision sweep is clean.
- The three slices are ordered and each names its gates.
- The risk register now includes the retry risk.
- The gate set is right for a docs-only wave, and jsr-audit is N/A for a stated reason.
- Deferred scope is explicit.
- The generated-carrier conflict (`check:publish-assets` against `packages/mcp/src/publish-assets.generated.ts`) is acknowledged and not authorized, and the gate is not weakened. Reporting it as unproven is allowed.
- Self-certification is ruled out: each slice gets an independent review, and the final IMPL-EVAL runs on the exact pushed SHA.

VERDICT: PASS
