# Context Pack

Branch: `feat/prime-time/auth-s6-composition`
Worktree: `/home/codex/repos/netscript-pt-auth-s6-composition`

S6 implementation started after local verification that `HEAD` is S2
(`0b3521d5 S2: bind auth service handlers through contract context`) and AS6 is the immediate
parent (`e3a43b84 AS6: e2e scaffold.runtime auth path + honesty docs + CLI package-copy`).

Pre-existing dirty files under `.llm/tmp/run/openhands/` are unrelated and must remain untouched.

Current implementation target:
- Add `InteractiveFlowPort` to `packages/plugin-auth-core/src/ports/mod.ts`.
- Populate `interactive` from `packages/auth-kv-oauth/src/backend.ts`.
- Remove auth handler casts to `InteractiveAuthBackend`.
- Replace the speculative appsettings cast in `plugins/auth/services/src/init.ts`.
- Move request derivation out of `createService().withContext()` into request-scoped middleware plus
  typed oRPC context middleware.

Implementation status:
- Done. Scoped check/lint/fmt wrappers pass for `plugins/auth` and `packages/plugin-auth-core`.
- Targeted auth/core tests pass.
- JSR doc-lint and publish dry-runs pass; auth dry-run still reports the pre-existing dynamic
  bootstrap import warning, with no slow-type warnings.
- `deno.lock` is unchanged.
