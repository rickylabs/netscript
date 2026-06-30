# Drift

- 2026-06-30 — `deno task arch:check` did not match the brief's baseline claim that all 13 roots were already `FAIL=0`. The task fails before touched roots on pre-existing `packages/plugin-auth-core` doctrine findings (`FAIL=12`, auth cast / `@ts-*` checks). S-b touched roots were checked independently and returned `FAIL=0` for `packages/plugin-sagas-core` and `plugins/sagas`. No auth files were edited because that would widen the approved S-b/S-c/S-d scope.

