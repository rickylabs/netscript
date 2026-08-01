# Context Pack — fix-1015-sagas-registry-path--dependency-mode

## Current state

- Phase: PLAN-EVAL cycle-1 remediation complete; implementation authorized by owner.
- Branch/base: `fix/1015-sagas-registry-path` at `3ab64720f` from `origin/main`.
- Root cause verified exactly as supplied: service init and runner fallback anchor registry paths to
  package `import.meta.url`; Aspire never supplies the env seam; generated glue is already correct.
- Locked boundary: no Aspire entrypoint or generated glue text changes.

## Next action

Implement the four commit slices in the amended plan. Do not retry OpenRouter/Qwen and do not
dispatch OpenHands. The owner waived that route for the 0.0.3 fix train; Opus 5 is the separate
evaluator. Preserve the honesty boundary: the injected-importer test is dependency-shaped evidence,
not a real published JSR install.
