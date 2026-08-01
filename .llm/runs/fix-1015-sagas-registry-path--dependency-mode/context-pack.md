# Context Pack — fix-1015-sagas-registry-path--dependency-mode

## Current state

- Phase: implementation complete; final validation/IMPL-EVAL handoff pending.
- Branch/base: `fix/1015-sagas-registry-path` at `3ab64720f` from `origin/main`.
- Root cause verified exactly as supplied: service init and runner fallback anchor registry paths to
  package `import.meta.url`; Aspire never supplies the env seam; generated glue is already correct.
- Locked boundary: no Aspire entrypoint or generated glue text changes.

## Next action

Rerun the exact final validation after the test-file split, update PR #1031 with per-slice evidence,
then hand off to the Opus 5 supervisor for IMPL-EVAL. Do not retry OpenRouter/Qwen or dispatch
OpenHands. The dependency-shaped test is not a real published JSR install and must remain reported
that way.
