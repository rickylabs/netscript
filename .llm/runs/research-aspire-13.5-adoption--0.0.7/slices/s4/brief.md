use harness

## SKILL

- netscript-harness — run lifecycle, slice review gate, evaluator separation (you never
  self-certify).
- netscript-doctrine — `packages/cli` is framework code: archetype, gates, `quality:scan` +
  `arch:check` per slice, no `any`/casts/lint-ignores.
- netscript-tools — scoped wrappers, gate receipts, lock hygiene; `gen:assets-barrel` /
  `check:assets-barrel`.
- netscript-cli — generator/scaffold surface, `scaffold.plugins` suite.
- netscript-pr — draft PR, labels, `Closes`, commit-trail comments.
- aspire — Aspire facts; **no AppHost start, no host CLI change** (no runtime lease for this slice;
  the runtime verdict is CI's `scaffold.runtime` on your draft PR after ready, plus the S2 receipts
  you cite).

## Context

You are the GPT-5.6 Sol implementation agent for **S4 of the Aspire 13.5 epic** (#1712): **#1716 —
[aspire-13-5 S4] Generator re-validation against the 13.5 TypeScript API + deploy-adapter CLI
contract verification (D-15)**. Supervisor: the Fable 5 session. **Note:** #1371 (background
`ServiceReferences` injection) was closed on 2026-08-29 by main PR #1728 (`8b1e42f72`, in your
base), which added `generate-register-background_test.ts`; S4 no longer closes #1371 — you only
confirm that coverage in the member table.

### Your worktree / branch

- Worktree: `/home/codex/repos/netscript-aspire-13-5-s4` (native ext4; work ONLY here)
- Branch: `chore/aspire-13-5-s4-generator-revalidation` (off `origin/main`; no upstream — push only
  with `git push origin HEAD:refs/heads/chore/aspire-13-5-s4-generator-revalidation`)
- Run dir you own: `.llm/runs/chore-aspire-13-5-s4-generator-revalidation--impl/` (start with
  `supervisor.md` from `.llm/harness/templates/supervisor.md`; `worklog.md` with `## Design`;
  `context-pack.md`; `drift.md`).

### Required reading (in order)

1. Issue #1716 (scope, boundaries, acceptance, gates, regeneration) and epic #1712.
2. Research + decisions on `origin/research/aspire-13.5-0.0.7`:
   `git show origin/research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/research.md`
   (§2 C21/C24/C25/C32, §4 bridge audit, §11 discrepancies) and `…/plan.md` (D-4, D-15).
3. S2 receipts on `origin/test/aspire-13-5-s2-runtime-verification` under
   `.llm/runs/test-aspire-13-5-s2-runtime-verification--impl/receipts/`:
   `01-restored-module-grep.raw.txt` (13.5.3 SDK declares
   `withHttpHealthCheck(options?: WithHttpHealthCheckOptions)` — the options-object form is
   confirmed), `03-v9-*` (CommunityToolkit Deno projection: `addDenoApp`/`addDenoTask` present after
   restore), `03-v12-*` (verbatim `aspire publish|deploy|destroy --help` on 13.5.3: all list
   `--apphost`, `--output-path`, `--environment`, `--non-interactive`; only `destroy` also lists
   `--yes`).
4. The 13.5 TypeScript API reference pages in
   `…/sources/aspiredev-reference_api_typescript_aspire.hosting.md` (same branch) and the
   `.llm/tmp`-style member pages you may re-fetch from
   `https://aspire.dev/reference/api/typescript/aspire.hosting/<member>.md` if a signature needs
   checking.

### Locked facts

- Base `origin/main` still scaffolds 13.4.6 pins (S1 #1727 is a separate PR); **do not touch the pin
  constants** — your slice is emission correctness, comments, the config default, #1371, and the
  deploy adapters.
- S12 (0.0.8) owns any `addDenoApp` adoption; you only re-anchor comments to the true upstream state
  (aspire#18627/#16218 = 13.6; CommunityToolkit projection proven by S2 V9).

## Slices (commit in order; each message names what it proves)

1. **Member table.** For every Aspire SDK member the helper generators emit
   (`packages/cli/src/kernel/templates/aspire/helpers/register/*.ts`, `generate-config-schema.ts`,
   `generate-db-cli-mode.ts`, `generate-index.ts`, `assets/aspire/helpers/*.template`):
   `addExecutable`, `withHttpEndpoint`, `withHttpHealthCheck`, `withEnvironment`, `withReference`,
   `waitFor`, `waitForCompletion`, `withOtlpExporter`, `withBrowserLogs`, `withExplicitStart`,
   `addParameter`, `addPostgres`/`addMySql`/`addSqlServer`, `addDatabase`, `addConnectionString`,
   `addContainer`, `withEndpoint`, `withLifetime`, `withDataBindMount`, `withBindMount`,
   `withImage`/`withImageTag`, `withArgs`, `withContainerRuntimeArgs`, `getEndpoint` — one row each:
   emitted call site → 13.5.1 API page/signature → verdict (unchanged / changed / removed). Commit
   the table into your run dir (`member-table.md`) and paste it in the PR comment. No emission
   change unless a row says `changed`.
2. **Config default (+ #1371 coverage check).**
   `packages/config/src/domain/schemas/aspire-schema.ts:9` `appHost` default →
   `./aspire/apphost.mts` with doc comment + test. Confirm `generate-register-background_test.ts`
   (from #1728) covers the `services__<ref>__http__0` injection for
   `BackgroundProcessors.<name>.ServiceReferences`; add a case only if a gap exists.
3. **Stale anchors.** `templates/aspire/generate-aspire-config.ts:44-56` and
   `assets/aspire/helpers/_aspire-compat.ts.template:1-3`: replace the aspire#15119/#16220/#15812
   "revisit when 13.3" text with the 13.5 facts (TS projection exists — S2 V9; first-party Deno
   hosting = upstream 13.6 aspire#18627/#18628; S12 owns adoption). Grep-test: no
   `aspire#15119|aspire#16220|aspire#15812` under `packages/cli/src/kernel/templates/aspire/**` or
   `assets/aspire/**`. Arch-debt entry "CommunityToolkit Deno/SQLite TypeScript AppHost re-enable
   deferred": update evidence + gate (append/edit that entry only).
4. **Deploy adapters (D-15).**
   `packages/cli/src/kernel/adapters/aspire/aspire-cloud-deploy-target.ts` and
   `aspire-compose-deploy-target.ts` (+ `_test.ts`): verify the emitted argv against the S2 V12 help
   receipts; decide `--yes` for `destroy` (13.5.3 lists it) — add it where the adapter runs
   non-interactively, and record the sourced verdict per command in the member table; update the
   adapter tests to the 13.5 contract.
5. **Regenerate + gates.** `deno task gen:assets-barrel`, `check:assets-barrel`; scoped wrappers on
   `packages/cli` roots (note the wrappers' config exclusions: also run raw
   `deno fmt --check`/`deno lint` on touched files and say so); `deno task quality:scan`;
   `deno task arch:check`; generator unit tests;
   `deno task e2e:cli run scaffold.plugins --format pretty` (no Aspire runtime needed).

## Boundaries

- No pin changes, no `packages/fresh`, no skills/docs (S9/S11), no
  `.llm/runs/research-aspire-13.5-adoption--0.0.7/**`, no manifest/generator edits, no AppHost/CLI
  mutation.
- Emission-shape changes beyond #1371 and the config default are out of scope — record any
  temptation in `drift.md`.

## Draft PR and receipts

- After commit 1, open a **draft PR** to `main`: title
  `chore(aspire): generator re-validation against the 13.5 TypeScript API + deploy-adapter contract (S4)`;
  body per `.github/pull_request_template.md` with `## Scope` = `Closes #1716`, `Part of #1712` (do
  **not** reference #1371 with a closing keyword — it is already closed by #1728); labels
  `type:fix`, `epic:aspire-13-5`, `area:cli`, `area:aspire`, `priority:p1`, `status:impl`; milestone
  `0.0.7`.
- Push with the explicit refspec after every commit; per-commit PR comment with scope, SHA, gate
  evidence; paste push lines into `worklog.md`.

## Stop conditions

- Final non-empty line exactly `DONE` (plain text, no table, nothing after) when all five commits
  are pushed, the draft PR carries the commit trail, all named gates are green locally, run-dir
  artifacts committed. You do not mark ready and do not self-certify.
- Otherwise final non-empty line exactly `BLOCKED: <exact reason and evidence path>` (plain text).
