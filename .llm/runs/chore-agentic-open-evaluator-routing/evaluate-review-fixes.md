# IMPL-EVAL — review-fixed exact head

- Issue: #1791
- Evaluated head: `ba70c6c90098129821cad342d0f005a38d37bb77`
- Base: `5197e70b716eafb82fbb12ddb9a910c248ddb86a`
- Session: `ec1cfcda-7207-4719-a976-5e16c0914e8d`
- Requested route: OpenRouter / `z-ai/glm-5.3-flash` / effort `max` / Claude-print
- Observed route: provider `Z.AI`, canonical model `z-ai/glm-5.3-flash`, `CLAUDE_EFFORT=max`, local
  guarded Claude-over-gateway transport
- Verdict: **PASS**

This evaluation intentionally dogfooded the new GLM/max route introduced by the leaf. It is a fresh,
separate opposite-family session, but it is not route-independent evidence.

## Exact-head checks

- Verified the exact head and base SHAs and a clean worktree before review.
- Independently reran the full `.llm/tools/agentic` test surface: **493 passed, 0 failed**.
- Ran focused routing, policy/doc parity, volatile-model guard, provider/preset canary, hybrid,
  launcher/gateway, OpenHands phase-dispatch, legacy-contract, and trigger tests: **125 passed**.
- Reviewed both accepted medium fixes and their execution order manually.
- Did not rerun paid canaries; treated the committed hardened post-fix canary evidence as the live
  receipt and all pre-fix evaluator/canary artifacts as historical only.

## Findings

No blocking or required-fix findings.

The evaluator verified:

1. `hasVisibleAssistantMarker` accepts the canary marker only from final-result or visible assistant
   text events. Reasoning and tool-input echoes fail closed, and the 512 KiB capture retains a
   visible tail after a reasoning prelude exceeding the former 64 KiB bound.
2. The OpenHands phase workflow rejects Qwen outside PLAN-EVAL and GLM outside IMPL-EVAL before the
   paid dispatch function is called.
3. PLAN OpenRouter routing selects Qwen 3.8 Flash/max; IMPL, hybrid, gateway, and generic defaults
   select GLM 5.3 Flash/max; the retired models deserialize at persisted boundaries but are absent
   from active presets and launch allowlists.
4. Formal and gateway task aliases are distinct, OpenHands makes no effort-attestation claim,
   lane-policy parity is machine checked, and volatile model IDs remain centralized.

Two informational observations do not require changes for this leaf: the canary scan is deliberately
bounded at 512 KiB, and the pre-existing capability classifier can over-count reasoning by substring
while visible-response eligibility remains independently enforced.

## Verdict

**PASS**
