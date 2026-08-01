# Context Pack — fix-1015-sagas-registry-path--dependency-mode

## Current state

- Phase: implementation and final validation complete; Opus 5 IMPL-EVAL pending.
- Branch/base: `fix/1015-sagas-registry-path` at `3ab64720f` from `origin/main`.
- Root cause verified exactly as supplied: service init and runner fallback anchor registry paths to
  package `import.meta.url`; Aspire never supplies the env seam; generated glue is already correct.
- Locked boundary: no Aspire entrypoint or generated glue text changes.

## Next action

All exact scoped gates passed on the committed implementation tree, plus the harness quality gate.
Update PR #1031 and hand off to the owner-authorized Opus 5 supervisor for IMPL-EVAL. Do not retry
OpenRouter/Qwen or dispatch OpenHands. The dependency-shaped test is not a real published JSR
install and remains explicitly reported as such.
