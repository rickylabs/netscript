# Drift — CLI JSR production hardening

- 2026-06-25 — minor/process: run directory initially contained `plan.md`, `research.md`, and the
  first-cycle `plan-eval.md` verdict (`FAIL_PLAN`), but lacked `worklog.md`, `commits.md`, and
  `context-pack.md`. User prompt explicitly identifies this as the PLAN-PASSed implementation run
  and the revised `plan.md` records cycle-2 fixes. Created missing harness tracking artifacts and
  proceeded under the explicit user-provided PLAN-PASS state.
- 2026-06-25 — significant/eval: IMPL-EVAL (OpenHands qwen3.7-max) returned PASS, but the pre-merge
  CI gate caught it as a FALSE POSITIVE — CI was RED with 20 failures. Root cause: the eval ran
  only touched-file tests, not the repo-wide `deno task test` + e2e. S1's fetch-based registry made
  `readTemplateAssetSync` throw "Template registry not hydrated" on any sync template read whose
  caller had not first awaited `DEFAULT_TEMPLATE_REGISTRY.hydrate()`. Lesson to bake into harness:
  IMPL-EVAL must run repo-wide `deno task test` + e2e, never just touched-file tests.
- 2026-06-25 — process/authorization: per the harness fallback clause, a non-Codex implementation
  lane requires explicit user authorization. After two mechanical Codex launch failures the user
  granted supervisor-direct fix authorization ("use your skill and deno tools to fix / repair").
  This regression fix (commit e5fafc38) was therefore implemented directly by the supervisor under
  that explicit per-task grant, not by a Codex slice.
- 2026-06-25 — significant/architecture: the e5fafc38 hydrate fix was INCOMPLETE. The CLI has TWO
  composition roots: `runPublicCli` (bin `netscript.ts`, public commands) — hydrated in e5fafc38 —
  and `createLocalContributorCli` (bin `netscript-dev.ts`, dev/maintainer/local commands), which was
  NOT hydrated. The e2e suites (`scaffold.plugins`, `scaffold.runtime`, `scaffold-static` CI job)
  all drive `netscript-dev.ts` in local mode, so `plugin add worker` still threw "Template registry
  not hydrated" on e5fafc38 → CI stayed RED. `init` passed because its scaffolders self-hydrate via
  async `readTemplateAsset`; only the local plugin-add path hit a sync read first. Commit 4e252b80
  hydrates the local-contributor composition root the same way (await hydrate() before parse()),
  turning `scaffold.plugins` green 10/0 locally. Lesson: any future composition root that dispatches
  scaffold commands must hydrate at entry — the contract is per-root, not global.
