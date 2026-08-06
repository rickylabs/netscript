# S2 Runtime and Canary Evidence

## Focused gates

- Focused canary/runtime/persistence/provider/runner tests: `32 passed, 0 failed`.
- Static provider preset canary: `passed`; all six registered presets observed and launch-valid.
- Full agentic suite: `416 passed, 0 failed`.
- Scoped check wrapper: 149 files, 2 batches, 0 failed batches, 0 findings.
- Scoped lint wrapper: 149 files, 1 batch, exit 0, 0 findings.
- Scoped fmt wrapper: 149 files, 1 batch, 0 failed batches, 0 findings.

The first full-suite attempt correctly failed the volatile-value guard because the new persistence
test pinned the Minimax literal. The test was corrected to use `OPENROUTER_MODEL_IDS.minimax`; the
complete rerun passed 416/416.

## Bounded live canaries

The first Minimax invocation was blocked before spawn because the canary process environment did
not contain the configured credential. No provider request occurred. The retry exported only the
existing configured OpenRouter assignment into the child shell; the key did not enter argv or
output.

### PLAN-EVAL default

- Profile: `claude-openrouter`
- Preset: `claude-evaluator-minimax-m3`
- Model: `minimax/minimax-m3`
- Effort: `high`
- Status: `passed`; process exit 0; not timed out
- Capabilities: tools/reasoning/streaming `supported`
- Event counts: tools 6, reasoning 13, streaming 18
- Diagnostics: none

### IMPL-EVAL default

- Profile: `claude-openrouter`
- Preset: `claude-evaluator-qwen-3-8-max`
- Model: `qwen/qwen3.8-max`
- Effort: `high`
- Status: `passed`; process exit 0; not timed out
- Capabilities: tools/reasoning/streaming `supported`
- Event counts: tools 6, reasoning 148, streaming 153
- Diagnostics: none

## Lock hygiene

The pre-existing `deno.lock` modification remains unrelated and unstaged.
