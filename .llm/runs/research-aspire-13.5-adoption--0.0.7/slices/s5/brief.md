use harness

## SKILL

- netscript-harness — run lifecycle, slice review gate, evaluator separation (you never self-certify).
- netscript-doctrine — `plugins/**` and `packages/cli` are framework code: ARCHETYPE-5 contribution seams; `quality:scan` (no hard-coded plugin names host-side) + `arch:check` per slice; no `any`/casts/lint-ignores.
- jsr-audit — the sagas public surface: `deno publish --dry-run`, `deno doc --lint` no-new-errors, consumer-import gate (research §15, D-14).
- netscript-tools — scoped wrappers, receipts, `gen:assets-barrel`/`check:assets-barrel`, `check:aspire-host-ports`.
- netscript-cli — scaffold/E2E surface (`scaffold.plugins`, `scaffold.runtime` on CI).
- netscript-pr — draft PR, labels, `Closes`, commit-trail comments.
- aspire — Aspire facts; **no AppHost start, no host CLI change** (no runtime lease; the runtime verdict is CI's `scaffold.runtime` on your PR after ready — S2's receipts are your live evidence).

## Context

You are the GPT-5.6 Sol implementation agent for **S5 of the Aspire 13.5 epic** (#1712):
**#1717 — [aspire-13-5 S5] Remove every runtime literal pre-randomization port from plugin contributions and E2E probes; deprecated `SAGAS_API_DEFAULT_PORT` compatibility export retained (D-14)**. Will close #1365, #1370, #979 (OF-3a). Supervisor: the Fable 5 session.

### Your worktree / branch
- Worktree: `/home/codex/repos/netscript-aspire-13-5-s5` (native ext4; work ONLY here)
- Branch: `fix/aspire-13-5-s5-literal-ports` (off `origin/main`; no upstream — push only with
  `git push origin HEAD:refs/heads/fix/aspire-13-5-s5-literal-ports`)
- Run dir you own: `.llm/runs/fix-aspire-13-5-s5-literal-ports--impl/` (`supervisor.md` from `.llm/harness/templates/supervisor.md`, `worklog.md` with `## Design`, `context-pack.md`, `drift.md`).

### Required reading (in order)
1. Issue #1717 (scope incl. the S2 V3 comment), #1365, #1370, #979, epic #1712.
2. `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/plan.md` — D-14 (sagas compat contract, locked), OF-3a, D-16 (isolated starts reused Postgres host port 14428 — infrastructure host ports are in scope); `…/research.md` §15 (jsr-audit record for `SagaPublisherResult`/`SAGAS_API_DEFAULT_PORT`).
3. S2 receipts on `origin/test/aspire-13-5-s2-runtime-verification` (`.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/02-capture-db-allocation-*.raw.txt`, `02-verify-live-db-endpoint.raw.txt`, `02-aspire-describe-*.json`) — the exact evidence of the port reuse.
4. `.llm/tools/validation/check-aspire-host-ports.ts` (the fitness gate you extend), `plugins/*/src/aspire/*-contribution.ts`, `plugins/sagas/src/runtime/saga-publisher.ts:295-307`, `plugins/sagas/src/constants.ts`, `plugins/sagas/src/cli/adapters/runtime-api-client.ts`, `plugins/sagas/src/e2e/probes/probe-context.ts`, `plugins/sagas/scaffold.plugin.json`, `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts` (host-port emission for Postgres/MySQL/MSSQL/Redis/Garnet), `packages/cli/e2e/src/application/gates/scaffold/*` (live probes on 8091–8094 / fixed DB ports).

### Locked contract (D-14, do not reopen)
- `SagaPublisherResult` is already `SagaPublisherReceipt | SagaPublisherRejected`; `SagaPublisherRejected.reason` is `string` → return `{ published: false, reason: 'no-endpoint', retryable: false }` when no service reference/env resolves. **No core type change.**
- `SAGAS_API_DEFAULT_PORT` stays exported from root `mod.ts`, `./public`, `./runtime`, `./aspire` with its value unchanged and a `@deprecated` JSDoc ("not a runtime fallback; removed in 0.0.8 — see the deprecation issue"); **no runtime path reads it**. Open the 0.0.8 deprecation-removal issue text as a draft in your run dir (the supervisor files it) and reference it in the JSDoc by title.
- Infrastructure host ports (D-16): generated Postgres/MySQL/MSSQL/Redis/Garnet host-port pins become opt-in (same mechanism #952 used for app/service); default emission lets Aspire allocate, so two `aspire start --isolated` runs of one project cannot collide.

## Slices (commit in order; RED-first where a gate exists)
1. **Gate first.** Extend `check:aspire-host-ports` to plugin contributions and generated infrastructure host ports; commit the RED run (it must list the current literals), then make it green in later commits. Add the S5 literal grep as a test: `git grep -nE '809[1-4]|4437|127\.0\.0\.1:80' -- plugins packages/cli/src packages/cli/e2e` may hit only `plugins/sagas/src/constants.ts` and tests asserting the deprecation.
2. **Sagas publisher + constant (#1365).** `resolveServiceUrl` rejection path; CLI client default and e2e probe default derive from service references/env; `scaffold.plugin.json` `servicePort`/`backgroundPort` become opt-in; `@deprecated` export; sample job + plugin README updated; jsr-audit gates run and recorded.
3. **Contributions (#1370).** sagas/triggers/streams/workers contributions and the generated browser consumer stub publish URLs/health only from `ctx.port(...)` / service references.
4. **Plugin API + infrastructure host ports (#979, D-16).** Opt-in pinning in `generate-register-infrastructure.ts` and the plugin registration generators; `check:aspire-host-ports` green.
5. **E2E probes.** `packages/cli/e2e` gates resolve URLs from `aspire describe --format Json` (`urls[].url` per resource) instead of literal ports; `scaffold.plugins` green locally.
6. **Regen + gates.** `gen:assets-barrel`, `check:assets-barrel`, `gen:publish-assets`/`check:publish-assets` if READMEs change, scoped wrappers (+ raw fmt/lint on config-excluded files), `quality:scan`, `arch:check`, `deno publish --dry-run --allow-dirty` in `plugins/sagas` (no new warnings beyond the three pre-existing dynamic-import ones), `deno doc --lint plugins/sagas/mod.ts` (no error beyond the pre-existing `private-type-ref` #1708), plugin unit tests, `scaffold.plugins`.

## Boundaries
- No health-check registration (S6), no resource commands (S8), no `_aspire-compat.mts` beyond port helpers, no pins, no `packages/fresh`, no skills/docs (S9/S11), no archival rows, no AppHost/CLI mutation.
- Never remove a public export; never change a public type.

## Draft PR and receipts
- After commit 1: draft PR to `main`, title `fix(aspire): remove runtime literal ports from plugin contributions, infrastructure, and E2E probes (S5)`; body per `.github/pull_request_template.md`, `## Scope` = `Closes #1717`, `Closes #1365`, `Closes #1370`, `Closes #979`, `Part of #1712`; labels `type:fix`, `epic:aspire-13-5`, `area:plugins`, `area:aspire`, `area:cli`, `priority:p0`, `status:impl`; milestone `0.0.7`. Include an `acceptance-evidence` block per closing issue (exact box text) once evidence exists.
- Push with the explicit refspec after every commit; per-commit PR comment with scope, SHA, gate evidence; push lines in `worklog.md`.

## Stop conditions
- Final non-empty line exactly `DONE` (plain text, no table, nothing after) when all six commits are pushed, the draft PR carries the commit trail, gates green locally, run-dir artifacts committed. You do not mark ready and do not self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>` (plain text).
