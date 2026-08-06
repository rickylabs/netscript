# Slice registry — release 0.0.5 continuation

This registry is the dispatch index for the 18 PLAN-EVAL-approved PR clusters. “Prepared” means live
issue/PR/code evidence has been re-read and a dependency-aware supervisor/preflight record exists;
it does not authorize branch creation or launch. Exact base/head values and final prompts are
materialized only after the named dependency opens.

| Slice | Issues / PR   | State                            | Dispatch dependency                                                | Closure authority                                                  |
| ----- | ------------- | -------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| T1-A  | #1295 / #1315 | formal IMPL-EVAL held            | approved Qwen transport funded/reset                               | PR closes after Qwen PASS + current CI + pre-merge gate            |
| T1-B  | #1189 / #1316 | evaluator PASS; held ready-merge | T1-A PASS + assigned/green hosted runners                          | PR closes after current CI + pre-merge gate                        |
| T2-A  | #1117 / #1317 | prepared                         | T1 train mutations merged                                          | PR closes after current-base gates + fresh Qwen                    |
| T2-B  | #1115 / #1318 | prepared                         | T1 train mutations merged                                          | PR closes after current-base gates + fresh Qwen                    |
| W1-A  | #1312 + #1148 | prepared                         | inherited T1/T2 train coherent                                     | PR closes both; orchestrator alone publishes                       |
| W1-B  | #1024 + #1328 | prepared                         | inherited T1/T2 train coherent                                     | PR closes both only after remaining consumer/runtime rows          |
| W1-C  | #1324 + #1330 | prepared                         | inherited train + live OpenRouter                                  | PR closes both after real MCP/resume + Qwen                        |
| W2-A  | #1325         | prepared                         | canary.14 green pair; fresh canary.15 train                        | PR close                                                           |
| W2-B  | #1329         | prepared                         | canary.14 green pair; fresh canary.15 train                        | PR close; contract dependency for W3-A                             |
| W2-C  | #1202 + #1327 | prepared                         | canary.14 green pair; fresh canary.15 train                        | PR closes #1327, refs #1202; orchestrator hand-closes #1202        |
| W3-A  | #1326         | prepared                         | W2-B merged                                                        | PR close                                                           |
| W3-B  | #1102 + #1197 | prepared                         | W1-C merged and tools attached                                     | PR closes #1102, refs #1197; orchestrator hand-closes #1197        |
| W3-C  | #1119         | prepared                         | W3 schedule opens on canary.15 train                               | PR close                                                           |
| W4-A  | #1333         | prepared                         | canary.15 green pair; fresh canary.16 train; GLM design checkpoint | PR refs #1333; orchestrator hand-closes after measured agent smoke |
| W4-B  | #1208         | prepared                         | W4-A merged                                                        | PR refs until Phase 2 is completed or separately dispositioned     |
| W4-C  | #1108         | prepared                         | canary.15 green pair; fresh canary.16 train                        | PR close                                                           |
| W5-A  | #1137 + #1138 | prepared                         | W5 schedule opens with shipped MCP surface                         | PR closes both                                                     |
| W5-B  | #1332 + #1334 | prepared                         | W4-A/W4-B merged                                                   | PR closes both                                                     |

## Cut boundaries

- C14: inherited T1/T2 plus W1; W1-A's authenticated budget gate must land before minting.
- C15: W2/W3 on the fresh canary.15 train; W2-B precedes W3-A and W1-C precedes W3-B.
- C16: W4/W5 on the fresh canary.16 train; W4-B follows W4-A and W5-B consumes both.

Every dispatched Codex lane is bypass-enabled and uses `.llm/tools/agentic/`. Every implementation
PR receives a separate Qwen 3.8 Max IMPL-EVAL. Observational rows above are never closed by a code
PR. The milestone orchestrator retains all merge, issue hand-close, canary, and publication
authority.
