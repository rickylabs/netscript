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
