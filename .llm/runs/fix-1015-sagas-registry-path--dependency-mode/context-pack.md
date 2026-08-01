# Context Pack — fix-1015-sagas-registry-path--dependency-mode

## Current state

- Phase: Plan-Gate pending.
- Branch/base: `fix/1015-sagas-registry-path` at `3ab64720f` from `origin/main`.
- Root cause verified exactly as supplied: service init and runner fallback anchor registry paths to
  package `import.meta.url`; Aspire never supplies the env seam; generated glue is already correct.
- Locked boundary: no Aspire entrypoint or generated glue text changes.

## Next action

Run separate-session PLAN-EVAL. Implementation may begin only after `PASS`.
