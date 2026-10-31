# Compile workflow examples beyond the Tier-1 snippet floor

`deno task docs:snippets` compiles only its Tier-1 page set. `.llm/tools/docs/workflow-examples_test.ts` extracts the actual worker and retry fences and feeds them through the same compiler against public workspace exports. The current defineJobHandler root API requires (payloadSchema, handler), unlike older one-argument snippets. The test wrapper passed on the new examples.

Root lint excludes .llm; use the structured lint wrapper with an explicit config that preserves root lint rules and removes the exclusion. Do not claim an all-excluded refusal is a pass.
