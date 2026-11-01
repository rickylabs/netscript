use harness

## SKILL
Read relevant netscript-harness, netscript-doctrine, netscript-tools and netscript-pr instructions; do not load profiles/. Independent read-only review, no source edits, agents, Git commits or GitHub comments.

You are the separate Anthropic-family implementation/slice evaluator, owner-selected Claude Opus 5.5/high. OpenAI authored the code. Review slice 1 before its supervisor sign-off commit. Read the corrected plan, design checkpoint, plan-eval-confirmation.md and worklog in .llm/runs/orch-divybot-6559439652--s5b/. Historical plan failures were escalated and the user explicitly continued; same plan evaluator then confirmed PASS before code.

Scope candidate: tools/figma-component-library/src/{contract,validate-contract,inventory,token-bindings,generate,validate-library,default-sources}.ts, tests/{fixture,generate_test}.ts and lint config. No native/import/commands/build yet; those are slice 2 and must not be treated as missing slice-1 features. Assess source-derived identity/coverage, exact role semantics, full contract roundtrip, canonical tamper rejection, shape/range limits, no partial bundle return and meaningful negative controls. Tests must not silently turn current source gaps green as full acceptance.

Run the structured scoped check/test/lint/fmt commands recorded in worklog; focused tests are tools/figma-component-library/tests/generate_test.ts. No mutating commands. Existing input contracts and token carrier can be inspected read-only. Import references reuse existing dependency versions; no dependency or lock changes. Tools are not a published Archetype-6 package: do not require package spine scaffolding.

Current executable inventory is 52 visual source items, 2046 variants, 35 unmatched contracts (14 shipped runtime-only,21 planned); the earlier plan review count22 was incorrect and is explicitly corrected in drift. Full generation must fail on existing missing prose/h4/tracking. Everything else must derive and validate without silent skips. Preserve all acceptance and no S3/token/plugin edits.

Return concise PASS (substantive slice review) or FAIL_FIX with concrete defects and file locations. This session will be resumed for final IMPL-EVAL after slice 2; preserve review context. Do not self-write verdict artifacts; your stdout is captured by supervisor.
