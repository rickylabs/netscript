# Context Pack — fix-1015-sagas-registry-path--dependency-mode

## Current state

- Phase: Plan-Gate blocked on local evaluator authentication.
- Branch/base: `fix/1015-sagas-registry-path` at `3ab64720f` from `origin/main`.
- Root cause verified exactly as supplied: service init and runner fallback anchor registry paths to
  package `import.meta.url`; Aspire never supplies the env seam; generated glue is already correct.
- Locked boundary: no Aspire entrypoint or generated glue text changes.

## Next action

Authenticate the `claude-openrouter` evaluator profile, then rerun
`plan-eval-prompt.md` with the bound Qwen route. Session
`5e52c824-93f1-49ef-80ae-12fcd8a4c1e8` failed before a model turn with `Not logged in` and zero
token/cost usage. Implementation may begin only after `PASS`; OpenHands is not an allowed fallback
for this local run.
