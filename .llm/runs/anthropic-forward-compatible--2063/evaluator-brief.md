use harness

## SKILL

Use the supplied one-defect fix evaluation contract. Do not read any profiles/ file. You are the independent evaluator, a GLM 5.3 Flash session from the Zhipu family; generator is OpenAI Sol 6.1.

Evaluate NetScript issue 2063 source change at exact commit 51d8e10d5. Work only in this detached evaluation worktree. Do not push, commit, edit board items, or edit the author worktree. Write only `.llm/runs/anthropic-forward-compatible--2063/evaluate.md` and your reproduction receipt JSONs. Do not self-invent missing publication evidence.

Read plan.md, research.md and worklog.md in the run. Review diff against 6f6cbdf for the owned additive-ID API and native current-model settings. User acceptance: bundled models work; configured future IDs are supported/listed/resolved/constructible offline through direct and registered factories; unknown unconfigured IDs reject; no SDK mutation or invented metadata; exact model reaches native Anthropic Messages; Opus/Fable mandatory adaptive thinking, Sonnet between_tools semantics, supported effort and tool choices; preserves text/reasoning/tools/usage/BYOK/abort/provider errors.

Independently prove regression-first. Save the evaluated source versions, temporarily restore baseline source with git restore --source=6f6cbdf -- packages/ai/anthropic.ts packages/ai/src/adapters/anthropic.adapter.ts packages/ai/src/adapters/tanstack-chat-client.ts. Run the structured test wrapper with `--filter` selecting the two tests named 'anthropic: configured IDs work consistently offline without mutating the catalog' and 'anthropic: registered public provider config preserves additive IDs' (or each separately). They must fail by assertion, not compilation. Restore all three source files from evaluated HEAD even if anything fails, then run the complete new regression file and preferably the full packages/ai/tests plugins/ai suite with `.llm/tools/run-deno-test.ts`. All must pass with the fix. Inspect that no product files outside the issue changed; assess why maxIterations(1) is necessary to keep the documented single-turn port and avoid fake tool results.

The local published version remains 0.0.7; stable 0.0.8 publication and a released-package downstream probe are explicitly outstanding. Do not use this absence to claim source PASS satisfies the full release issue; report it separately. No paid Anthropic inference was run. Verify the exact-ID semantics against primary references in research.md.

Write a single verdict PASS, FAIL_FIX, FAIL_RESCOPE or FAIL_DEBT at the start of evaluate.md, with findings and file:line citations, baseline and fixed exit codes, and limits. If a fixable issue appears, report a precise required repair; do not silently change author code. Keep raw output secret-safe. Final answer must name the verdict and report file.
