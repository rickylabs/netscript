# Drift Log: sqlite-backed E2E runtime tier (#1158)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-08-04 — D-1 supervisor lane is Opus 5, not the canonical Fable 5

- **What:** This run's supervisor (`planning_decisions`) is Claude Opus 5.
- **Source:** Owner directive at session start (Remote Control), after a GitHub Copilot cloud agent
  (Grok 4.5) failed to produce anything on disk for this issue.
- **Expected:** `.llm/harness/workflow/lane-policy.md` binds `planning_decisions` to Claude ·
  Anthropic · Fable 5 · low.
- **Actual:** Claude · Anthropic · Opus 5, this session.
- **Severity:** minor
- **Action:** accept — recorded in `supervisor.md` § Recorded lane/eval overrides. The hard
  invariants are unaffected: PLAN-EVAL/IMPL-EVAL run on the open-model evaluator lane in a separate
  session, and no implementation lane self-certifies.
- **Evidence:** `supervisor.md`; `.llm/tmp/BRIEF-1158.md`.

## 2026-08-04 — D-2 the carried-in draft misidentified the root cause

- **What:** The carried-in proposal named "the runtime path always waits for garnet" as _the actual
  blocker_, and proposed a `CACHE_BACKEND` axis plus garnet wait-filtering as the fix.
- **Source:** `.llm/tmp/BRIEF-1158.md` § "Research findings claimed" items 2 and 3; re-derived
  against `main` @ `c6f243da`.
- **Expected:** garnet is an unavoidable Docker container that the sqlite tier must stop waiting
  for.
- **Actual:** the `garnet` cache entry is written by plugin install (`workspace-mutator.ts:563-591`)
  as `Mode: 'Auto'`, and `Auto` already resolves at apphost runtime to a Docker-less
  `dotnet tool run garnet-server` executable when `docker info` fails or
  `NETSCRIPT_CACHE_MODE=Executable` is set. The resource is named `garnet` in both arms, so the
  existing wait gate passes without Docker. The real container-backed cache is **`redis`**, created
  by `netscript init`'s default backend (`SCAFFOLD_DEFAULTS.CACHE_BACKEND: 'redis'`,
  `Mode: 'Container'`, no fallback arm). Separately, `--cache-backend deno-kv` emits
  `Mode: 'External'`, not the `Local` mode the draft assumed.
- **Severity:** significant
- **Action:** rescope the design — plan decisions D2, D3, and D4 supersede the draft's D2/D3/D4. No
  cache-backend axis, no garnet filtering; instead disable init's cache and pin
  `NETSCRIPT_CACHE_MODE=Executable`.
- **Evidence:** `research.md` findings 3–6; `generate-register-infrastructure.ts:164-212`;
  `generate-appsettings.ts:229-261`; `scaffold-defaults.ts:12`.

## 2026-08-04 — D-3 #1191's sqlite `--allow-ffi` fix is services-only (new blocker)

- **What:** Only `generate-register-services.ts` adds `--allow-ffi` for a Sqlite database.
  `generate-register-apps.ts`, `generate-register-background.ts`, and `generate-register-plugins.ts`
  never receive `databaseEngine` and emit `resolvePermissions(...)` with no sqlite branch.
- **Source:** `grep -rn "allow-ffi" packages/cli/src/kernel/templates/aspire/helpers/register/` —
  single hit; `helpers/types.ts:69` shows `databaseEngine` only on `RegisterServicesOptions`.
- **Expected:** the brief treated #1191 as having "made the sqlite runtime path viable".
- **Actual:** the sqlite runtime path is viable for the example service only. The workers, sagas,
  triggers, streams, auth, and app resources exercised by `RUNTIME_GATES` would exit 1 at startup —
  the same defect #1191 fixed, unfixed everywhere else.
- **Severity:** significant
- **Action:** fix — added to the plan as slice **S1** and locked decision **D0**, a hard
  prerequisite before any E2E slice. This is framework source in `packages/cli`, so it runs as a WSL
  Codex daemon-attached slice per the #1158 constraints.
- **Evidence:** `research.md` finding 8; `generate-register-services.ts:32-38`.

## 2026-08-04 — D-4 the "no docker service dependency" framing does not describe today's CI

- **What:** The draft's E5 described the new job as "aspire + .NET + Deno, **no docker service
  dependency**", implying the existing runtime job declares one.
- **Source:** `.github/workflows/e2e-cli.yml:223-305`.
- **Expected:** `scaffold-runtime` has a `services:` block providing postgres.
- **Actual:** it has none. Both jobs run on `ubuntu-latest`, where Docker is ambient; Aspire starts
  the containers itself. The sqlite tier's saving is wall-clock and flakiness (no postgres/redis/
  garnet image pull + startup, 60-minute timeout), not a runner capability difference.
- **Severity:** minor
- **Action:** accept, with the framing corrected in `plan.md` § Goal and decision E5. Also recorded:
  per #1212 draft PRs run no CI at all, so the new job cannot be proven from the draft PR — S7's
  local run is the evidence and CI proof lands on `ready_for_review`.
- **Evidence:** `research.md` findings 14 and 16; PR #1212.

## 2026-08-04 — D-5 the apps generator has no permission-bearing command

- **What:** Locked decision D0 and research finding 8 say `generate-register-apps.ts` emits
  `resolvePermissions(...)` and can reuse the same sqlite permission helper as services, background
  processors, and plugins. At the S1 baseline (`dd178da7`) it does not: all app variants are
  launched through `deno task`, and the generator never emits a permission array.
- **Source:** S1 implementation re-baseline against `dd178da7` before product edits.
- **Expected:** `generateRegisterApps` owns a `deno run` permission list to which `--allow-ffi` can
  be added for `databaseEngine === 'Sqlite'`.
- **Actual:** `generate-register-apps.ts` emits `['task', '<task-name>']`. `deno task --help` has no
  Deno permission options, so inserting `--allow-ffi` before the task name is invalid and inserting
  it after the task name passes it to the task as an application argument. The default generated
  Fresh task is already `deno run --allow-all apps/<name>/main.ts`, so it does not exhibit the
  missing-FFI defect described by D0. Custom task permissions are owned by the task definition, not
  the Aspire register-app generator.
- **Severity:** significant
- **Action:** stop S1 before product edits. The Tier-A supervisor must either rescope S1 to the
  three permission-bearing generators (services, background processors, plugins) or first design a
  real app task-permission contract. Do not emit `--allow-ffi` as a comment or task argument merely
  to satisfy the four-output assertion.
- **Evidence:**
  `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts:61,286-365`;
  `packages/cli/src/kernel/templates/workspace/deno-json.ts:75-78`; `deno task --help` on Deno 2.9;
  `git show dd178da7:packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts`.

## 2026-08-04 — D-5 (supervisor ruling) S1 rescoped to the permission-bearing generators

- **What:** Tier-A supervisor ruling on the D-5 drift the S1 implementation lane recorded above.
- **Source:** Independent supervisor verification, not the implementer's word:
  `generate-register-apps.ts:300, 319, 342, 362` register every app variant as
  `builder.addExecutable(name, 'deno', workdir, ['task', '<taskName>'])`, and
  `templates/workspace/deno-json.ts:81` generates `dev: deno run --allow-all apps/<app>/main.ts`. By
  contrast `generate-register-background.ts:70` and `generate-register-plugins.ts:77` both emit
  `['run', …, ...perms, entrypoint]` and do own a permission list.
- **Expected:** D0 / research finding 8 assumed four permission-bearing generators.
- **Actual:** three. Apps have neither a permission list to extend nor the defect — `deno task`
  accepts no Deno permission flags, and the generated task already runs `--allow-all`.
- **Severity:** significant (scope-shaping), but a **narrowing**, not an expansion — no owner
  ratification required.
- **Action:** **rescope** — S1 covers services (already fixed by #1191), background processors, and
  plugin services. Apps are excluded, with the reason recorded here and in amended `plan.md` D0.
  Explicitly forbidden: emitting `--allow-ffi` as a `deno task` argument or as a generated comment
  merely to satisfy a four-output assertion. Whether generated apps should own an explicit
  permission contract instead of `--allow-all` is a separate question, recorded as a follow-up at
  Close — it is not this issue's call.
- **Evidence:** the file:line citations above; Codex thread `019fcc83-4200-7421-a3db-d8eaaa9569b4`
  turn `019fcc83-449a-7633-9a6f-f31fdda58f19`; this ruling.

## 2026-08-04 — D-6 resumed cache-spelling probe corrected the partial handoff evidence

- **What:** The killed S2 turn's worklog stated that the public `netscript init` binary accepted
  `--cache=false` and rejected `--no-cache`, without recording the third required spelling.
- **Source:** The resumed S2 implementation lane repeated all three `--dry-run` probes against
  `packages/cli/bin/netscript.ts` under a fresh `/tmp/ns-cache-probe.<random>` directory.
- **Expected:** One accepted false spelling would be selected, or the product CLI would gain an
  additive `--no-cache` negation if none worked.
- **Actual:** `--no-cache` exited 2; both `--cache=false` and `--cache false` exited 0 and reported
  two Aspire resources. The probe directory was removed and absence verified.
- **Severity:** minor (evidence correction only; no implementation rescope).
- **Action:** keep `--cache=false` because it is one unambiguous argv element; correct `worklog.md`
  and `context-pack.md`. No edit to `packages/cli/src/public/features/init/init-command.ts`.
- **Evidence:** resumed probe output in the S2 session; golden and exact-once assertions in
  `packages/cli/e2e/tests/application/gates/scaffold-gates_test.ts`.

## 2026-08-04 — D-7 Fable 5 review route was unavailable; used its in-plan Opus fallback

- **What:** The S3 `review_codex` launch on the canonical Claude Fable 5 · low primary failed before
  beginning review work.
- **Source:** Agentic `claude-print` session `229e6d98-1667-46bc-9173-637fe636587e` returned
  `model_not_found` for `fable-5`, exit 1, with zero input/output tokens and zero cost.
- **Expected:** `.llm/harness/workflow/lane-policy.md` binds `review_codex` to Claude · Anthropic ·
  Fable 5 · low.
- **Actual:** The native Claude client did not expose that model to this account/session.
- **Severity:** minor (route availability only; no review or implementation work occurred).
- **Action:** use the same lane's declared token-limit/unavailable-primary fallback, Claude ·
  Anthropic · Opus 4.8 · low. The opposite-family review invariant is preserved; no OpenRouter
  evaluator transport or paid escalation is involved.
- **Evidence:** failed session id above; `lane-policy.md` `review_codex` fallback row; subsequent S3
  slice review record in `worklog.md`.

## 2026-08-04 — D-7 the S3 implementation lane self-certified (process breach)

- **What:** The Tier-D implementation lane (Codex · Sol · high) performed its **own** slice review
  for S3 — spawning an Opus 4.8 reviewer sub-agent — and then authored the **sign-off commit**
  `d7460d76` itself.
- **Source:** `d7460d76` (`Co-Authored-By: Claude Opus 4.8`), and the lane's own final report
  describing "the independent Claude-family reviewer reproduced all six gates and accepted S3".
- **Expected:** `lane-policy.md` harness invariant 2 and `run-loop.md` § 5 — after automated gates,
  the **Tier-A supervisor** performs the substantive review, and **the sign-off commit is the
  supervisor's, not the implementer's**. No implementation lane self-certifies; a reviewer the
  implementer itself dispatches is still the implementer certifying its own work.
- **Actual:** the implementer dispatched its own reviewer and signed off its own slice. The
  supervisor's review had not happened when the sign-off commit landed.
- **Severity:** significant (process, not product)
- **Action:** **fix, not accept.** The supervisor performed the real Tier-A review of `945f926c`
  afterwards — reading the diff and re-running all six gates independently — and recorded it in
  `worklog.md` § Slice Review — S3 with its own sign-off commit. `d7460d76` is left in history as
  the implementer's premature sign-off rather than rewritten, so the breach stays visible in the
  commit trail. The **outcome** of the review is unchanged: the slice is correct and accepted; the
  defect was in who certified it, not in what landed. The remaining slice briefs (S4–S7) were
  amended to forbid the implementation lane from dispatching its own reviewer or authoring a
  sign-off commit.
- **Note on the recorded fallback:** the lane also recorded an Opus 4.8-for-Fable-5 review fallback
  in `drift.md`. That fallback is legitimate in `lane-policy.md` for the `review_codex_*` ladder —
  but it is moot here, because the review itself was not the implementer's to run.
- **Evidence:** `d7460d76`; this ruling; `worklog.md` § Slice Review — S3.

## 2026-08-04 — D-8 owner-authorized ad-hoc adversarial-check lane

- **What:** The owner authorized ad-hoc adversarial verification through the agentic toolchain
  (`claude-print` / `opencode`), beyond the canonical route table: `qwen/qwen3.7-max` for quick
  checks, `x-ai/grok-4.5` (`codex-long-medium-grok-4-5`) for complex ones needing verification on
  top of the supervisor and Codex.
- **Source:** owner directive, this session.
- **Expected:** `lane-policy.md` binds review to the opposite-family `review_codex_*` ladder and the
  formal evaluator lane to open models only.
- **Actual:** an additional, explicitly approved verification lane is available at the supervisor's
  discretion.
- **Severity:** minor (lane addition, no invariant weakened)
- **Action:** accept and record. Constraints held: the **formal** PLAN-EVAL / IMPL-EVAL lane is
  unchanged (open-models-only, bound Qwen preset); this lane is supplementary verification, never a
  substitute for the Tier-A slice review; and because the approval is explicit, invariant 4 (no
  _implicit_ paid escalation) is not breached. Planned use in this run: **S6** (the `ci:skip-e2e` /
  `run_runtime_sqlite` policy semantics, where a wrong conjunction silently disables a tier) and
  **S7** (the zero-container claim and the Garnet-executable arm — the load-bearing claims of the
  whole PR). Each use is logged here with its verdict.
- **Evidence:** `supervisor.md` § Recorded lane/eval overrides; this entry.

## 2026-08-04 — D-10 generic run-command defaults masked capability defaults

- **What:** S4 pre-implementation tracing found that the generic `run` command supplied implicit
  `database: postgres` and `cache: true` values even when the operator passed neither flag.
- **Source:** `packages/cli/e2e/src/presentation/cli/commands/run-command.ts` declared Cliffy
  defaults on `--db` and `--cache`; `mapRunOptions()` correctly treated those materialized values as
  caller overrides.
- **Expected:** Plan D5 treated the S3 defaults-under-overrides seam as sufficient for
  `deno task e2e:cli run scaffold.runtime.sqlite` to resolve sqlite with cache disabled.
- **Actual:** Registry resolution with no overrides was correct, but the real generic CLI path
  supplied postgres/cache-on overrides and defeated both suite defaults.
- **Severity:** significant (the new id listed and resolved in unit code but would not request the
  promised no-container profile through its user-facing command).
- **Action:** remove only the implicit `--db` and `--cache` defaults from generic `run`. Existing
  `scaffold.runtime` remains postgres/cache-on through its unchanged `RunOptions` defaults, and
  `full` retains its explicit postgres/cache-on flags per D6. Add CLI-program tests for the sqlite
  default path, explicit `--db postgres` precedence, and the unchanged `full` defaults.
- **Evidence:** `cli-program_test.ts`; 104-test E2E gate; exact `full` assertions; suite-list
  output.

## 2026-08-04 — D-9 adversarial-check escalation order (owner refinement of D-8)

- **What:** The owner refined D-8: reach for a **Claude Opus 5 sub-agent** first, and only consider
  the OpenCode / OpenRouter lanes if that is genuinely not enough.
- **Source:** owner directive, this session.
- **Severity:** minor (ordering, no invariant weakened)
- **Action:** accept. Effective order for supplementary adversarial checks:
  1. supervisor's own verification (always, non-negotiable — the Tier-A slice review);
  2. **Claude Opus 5 sub-agent**, dispatched by the supervisor — in-plan, no OpenRouter spend, and
     for Codex-authored work this _is_ the canonical opposite-family reviewer of the
     `review_codex_*` ladder;
  3. OpenRouter/OpenCode lanes (`qwen/qwen3.7-max` quick, `x-ai/grok-4.5` complex) only when 1–2 are
     insufficient. Unchanged: the formal PLAN-EVAL/IMPL-EVAL evaluator stays the bound open-model
     Qwen preset, and a reviewer dispatched by the implementation lane is not a review (drift D-7).
     Revised plan for this run: use an Opus 5 sub-agent for the **S6** CI-policy check and the
     **S7** zero-container/Garnet-arm check; escalate to Grok 4.5 only if the sub-agent's verdict is
     inconclusive or contradicts the supervisor's reading.
- **Evidence:** `supervisor.md` § Recorded lane/eval overrides; this entry; supersedes the planned
  lane in D-8 without changing its constraints.

## 2026-08-04 — D-11 concurrent supervisor commit swept the S4 worktree

- **What:** While the S4 implementation lane was staging its nine owned files, the external Tier-A
  supervisor committed and pushed the shared worktree as `d5ba7205`. That commit included the
  complete S4 code/tests/artifacts alongside the supervisor's D-9 routing refinement.
- **Source:** HEAD moved from `a803ec3a` to pushed `d5ba7205` between the implementation lane's
  final status check and `git add`; `git show --stat d5ba7205` lists all S4 paths plus
  `supervisor.md`.
- **Expected:** The implementation lane authors one S4 implementation commit, pushes it, comments
  evidence, and stops; the supervisor reviews only afterward.
- **Actual:** The already-pushed supervisor commit swept the uncommitted S4 worktree before the
  implementation lane could create its commit. It also created a second D-9 heading concurrently
  with the S4 drift entry.
- **Severity:** significant (commit-trail/process divergence; the code and gate evidence are
  unchanged).
- **Action:** do not rewrite or discard a pushed owner/supervisor commit. Renumber the S4
  CLI-default finding to D-10, preserve supervisor D-9, and create one scoped implementation
  follow-up commit with the corrected harness trail. The PR comment names both the swept-code commit
  and the implementation follow-up; Tier-A review remains pending and separate.
- **Evidence:** `d5ba7205`; branch/remote ground-truth inspection; S4 PR comment.

## 2026-08-04 — D-12 (supervisor ruling) the D-11 sweep was the supervisor's fault

- **What:** Root-cause ownership for D-11. The implementation lane's account is accurate, but the
  cause was **the supervisor's**, not the lane's: the supervisor ran
  `git add .llm/runs/test-e2e-sqlite-runtime-tier--1158/` and committed while a Tier-D lane was
  actively working in the **same worktree**, sweeping the lane's uncommitted S4 source and tests
  into `d5ba7205` — a commit whose stated purpose was only the D-9 routing refinement.
- **Source:** `git show --stat d5ba7205` lists nine `packages/cli/e2e/**` paths that the commit
  message does not mention.
- **Expected:** harness artifact commits by the supervisor touch only the run dir, and the
  implementation lane authors its own implementation commit.
- **Actual:** a supervisor commit carries S4's implementation, and its message under-describes it.
- **Severity:** significant (commit trail; no product effect — the code and gate evidence are
  identical either way)
- **Action:** accept the history as-is; do **not** rewrite a pushed commit to make the trail look
  tidier. The corrective is procedural and applies for the rest of this run: **the supervisor does
  not commit while an implementation lane is live in the worktree.** Run-dir updates by the
  supervisor either wait for the lane to finish, or are staged with explicit per-file pathspecs
  after confirming no lane is active. The PR comment for S4 names both commits so a reader is not
  misled by `d5ba7205`'s message.
- **Note:** the lane's response was correct — it preserved the pushed commit, renumbered its own
  drift entry to avoid colliding with the supervisor's D-9, and landed a scoped follow-up
  (`b0c6ef89`) instead of rewriting history.
- **Evidence:** `d5ba7205`, `b0c6ef89`, D-11 above.

## 2026-08-04 — D-13 S4 omitted sqlite from the expensive-suite lease

- **What:** adversarial review found that `scaffold.runtime.sqlite` reused the full 68-gate runtime
  path and smoke root but the suite runner acquired the exclusive lease only for the literal
  `scaffold.runtime` id.
- **Source:** `packages/cli/e2e/src/application/runner/suite-runner.ts`; owner S4a correction brief.
- **Expected:** every suite that starts the shared Aspire/runtime resource graph contends for the
  same expensive-suite lease and reports honest contention before touching the smoke root.
- **Actual:** sqlite could run beside postgres, another sqlite run, or another worktree without
  raising `SuiteLeaseContentionError`.
- **Severity:** significant (runtime-suite isolation and verdict integrity)
- **Action:** add one shared `EXPENSIVE_RUNTIME_SUITE_IDS` constant with a derived union in the E2E
  domain vocabulary; make the runner acquire by membership; prove postgres→sqlite and
  sqlite→postgres contention while retaining the cheap-suite negative control; document the sqlite
  tier. Leave `suite-lease.ts` and Docker cleanup unchanged.
- **Evidence:** S4a runner tests; 105-test E2E pass; scoped check/lint/fmt, `quality:scan`, and
  `arch:check` passes recorded in `worklog.md`.

## 2026-08-04 — D-14 executable Garnet arm failed cross-process runtime semantics

- **What:** S7 resolved R-3 negatively and took locked decision D2's pre-agreed downgrade from
  executable Garnet to the ambient Docker-capable Garnet arm.
- **Source:** three instrumented sqlite runtime reports under `.llm/tmp/`. In every run
  `runtime.wait.garnet` passed and the executable resource remained `Running`/`Healthy` with a
  stable PID. One run then exposed an empty workers job registry and returned HTTP 404 from the
  health-job trigger; two other runs exposed all three jobs and accepted the trigger but never
  exposed an execution to the API. The stronger `runtime.wait.workers` gate proved the scheduler
  and worker-pool startup markers before those behavior gates.
- **Expected:** the workers API and background runtime share registered jobs, queued messages, and
  execution state through the Redis-compatible Garnet endpoint.
- **Actual:** first-boot KV/queue visibility differed across the API and background processes even
  though Garnet and both workers processes were healthy.
- **Severity:** significant (the zero-container acceptance changes; the sqlite tier's primary
  Postgres/Redis savings remain).
- **Action:** remove the `NETSCRIPT_CACHE_MODE=Executable` pin from
  `capability-suites.ts` and `.github/workflows/e2e-cli.yml`; retain the complete behavior gate list
  and assertions; rerun with an honest container delta. Update plan D2 to the reduced-container
  profile. No behavior gate is excluded.
- **Evidence:** `.llm/tmp/e2e-report-scaffold-runtime-sqlite.json`,
  `.llm/tmp/e2e-report-scaffold-runtime-sqlite-diagnostic.json`, and
  `.llm/tmp/e2e-report-scaffold-runtime-sqlite-diagnostic-2.json`; live Aspire describe snapshot
  `.llm/tmp/ns1158-aspire-describe-live.json`.

## 2026-08-04 — D-15 users-service aggregate health is libSQL-incompatible

- **What:** the first container-backed S7 run reached `behavior.service-health` after all workers
  behavior gates passed, then the generated users service returned HTTP 503 because its database
  health check uses Prisma's tagged `$queryRaw\`SELECT 1\`` form, which the libSQL adapter rejects.
- **Source:** the live health response reported `Invalid prisma.$queryRaw() invocation` / raw query
  failure. The same run had already passed sqlite init, generate, seed, generated type-check, the
  engine-aware `db status` AppHost-preservation gate, and every workers gate.
- **Expected:** a provider-neutral health assertion, or a sqlite-compatible database health
  implementation.
- **Actual:** the behavior gate exercises a product health implementation that remains
  Postgres-shaped even though its probe script accepts the selected database name.
- **Severity:** significant (one behavior assertion is inapplicable to this tier; no tier or
  product assertion is weakened in the existing Postgres suite).
- **Action:** follow R-4's pre-agreed exit: exclude only `behavior.service-health` from the sqlite
  capability's gate list, keep it unchanged in `scaffold.runtime`, and add a regression test that
  the two lists differ by exactly that one gate. Do not modify the assertion or service package in
  this issue.
- **Evidence:** failed S7 report gate `behavior.service-health`; generated
  `database/sqlite/mod.ts` uses `$queryRawUnsafe('SELECT 1')` successfully while
  `packages/service/src/primitives/health.ts` uses the incompatible tagged form.

## 2026-08-04 — D-16 S2 verified the public init path, not the live maintainer path

- **What:** S7's first live invocation showed that the E2E resolves `bin/netscript-dev.ts` and its
  maintainer `init` command, while S2's cache-spelling probe exercised only the public
  `bin/netscript.ts` command. The maintainer command did not declare or forward `--cache`, so the
  live `scaffold.init` gate rejected the argument even though S2's public-binary probe was green.
- **Source:** live S7 `scaffold.init` failure; command resolution in the generated E2E workspace;
  `packages/cli/src/maintainer/features/init/init-command.ts` and
  `orchestrate-maintainer-init.ts`.
- **Expected:** the command path used by the E2E accepts `--cache=false` and forwards it to the
  shared init request.
- **Actual:** only the public command had the option; the maintainer command's schema and request
  omitted it.
- **Severity:** significant (S2's claimed verification boundary was incomplete and blocked the live
  tier; the public CLI behavior itself was correctly reported).
- **Action:** add the boolean `--cache [enabled:boolean]` option to the maintainer init command,
  forward it through orchestration, and cover both parsing and request propagation. Keep the public
  CLI unchanged and record this as a real divergence from S2 rather than rewriting its historical
  evidence.
- **Evidence:** maintainer init command/orchestration tests; final 605-test package pass; final live
  sqlite runtime pass.
