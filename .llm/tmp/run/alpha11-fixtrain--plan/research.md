# alpha.11 fix-train — research (Storefront Ch.1 eye-test blockers)

Source: eye-test Run-1 (`.llm/tmp/run/tutorial-eyetest-alpha10--eval/run-1-storefront-ch1.md`, #153) +
read-only code-surface scout (2026-06-27). User decisions 2026-06-27 folded in. Worktree:
`C:\Dev\repos\netscript-framework\.claude\worktrees\prb-shim-removal` (paths below relative to it).

## Code-surface map (scout ground truth)

| Item | File | Symbol | Line(s) | Current behavior |
|---|---|---|---|---|
| F-3 | `packages/cli/src/public/features/root/public-command-tree.ts` | `createPublicCommandTree()` Cliffy `.version` | 102 | Hardcoded `version: '1.0.0'` |
| F-4 | `packages/cli/src/public/features/init/init-command.ts` (flag 60, `dryRun` 86); `.../scaffold/init-orchestrator.ts` (msg 68-71); `.../scaffold/init-pipeline.ts` (79,84); adapter `.../adapters/scaffold/dry-run-fs.ts` (UNUSED); wiring `.../public/.../public-command-dependencies.ts` (72-82) | `DryRunFileSystemAdapter` | — | Adapter exists but is never injected; real `DenoFileSystem` writes regardless of `--dry-run`; orchestrator still prints "No files were written" |
| F-6 | `packages/cli/src/kernel/application/scaffold/init-orchestrator.ts` | `initNextSteps()` | 94-132 | Prints db init/generate/seed (106-110) BEFORE `aspire run`; doc callout says DB must run AFTER aspire (eye-test: running CLI verbatim hits DB with no postgres up) |
| F-11 flags | `packages/cli/src/public/features/init/init-command.ts` | `.option()` chain | 43-62 | No `--cache`/`--cache-backend`; **no interactive prompt phase exists at all** (init is flag-only; validate-init.ts has no prompts) |
| F-11 apphost | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-infrastructure.ts` | infra registration | — | Where a cache resource would be emitted; only primaryDatabase today |
| F-11 appsettings | `packages/cli/src/kernel/templates/aspire/generate-appsettings.ts` | `AppsettingsOptions` | 24-40, ~90 | No Cache section |
| F-11 redis stub | `packages/cli/src/kernel/constants/scaffold/scaffold-aspire.ts` | `SCAFFOLD_ASPIRE_INTEGRATIONS.REDIS` | 27-30 | Redis NuGet defined but never emitted; NO garnet/deno-kv integration |
| F-13/F-12 | `packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-services.ts` | `generateRegisterServices()` | 38-100; exe+port 70-74 | Generates `builder.addExecutable('<name>','deno',workdir,[...]).withHttpEndpoint({port,env})` + waitFor(db). Looks CORRECT. Service main `packages/cli/src/kernel/assets/service/main.ts.template:13` reads `PORT` env or falls back. |
| F-14 | `packages/cli/src/kernel/assets/service/routers/health.ts.template` (10-18); router `.../service/router.ts.template` (18-22); main `.../service/main.ts.template` (8-10 `defineService`) | health handler | — | Health is oRPC `v1.<svc>.health.check`; no plain `GET /health`; service mounts oRPC only |
| F-15a | `packages/sdk/src/ports/query-client.ts` | `QueryClientPort` | 35-63 | Has `getQueryData/setQueryData/invalidateQueries/fetchQuery/getQueryCache/mount/unmount/clear`; **NO `getQueryState`**. `QueryOptionsWithInitialData` exists (types.ts 24-35), `QueryClientFetchOptions` exported |
| F-15b | `packages/cli/src/kernel/assets/app/routes/examples/(_shared)/service-showcase.ts.template` | — | 60 | Calls `queryClient.getQueryState(...)?.dataUpdatedAt` → method missing (real local error). Line 58 `QueryOptionsWithInitialData` assignability to `QueryClientFetchOptions` |
| F-15c | `packages/fresh/src/application/vite/vite.ts` | `NetScriptVitePlugin` / `createNetScriptVitePlugin()` | 92-106, 191-212 | Returns Vite `Plugin`; scout could NOT reproduce the PluginOption type error from local source → likely **published alpha.10 drift**, verify |
| F-1 | `docs/site/tutorials/storefront/01-scaffold.md` (45); `docs/site/_config.ts` (no version mechanism) | — | 45 | Hardcoded `jsr:@netscript/cli` (no pin); no Lume dynamic-version data source found |
| F-8 | `docs/site/tutorials/storefront/01-scaffold.md` | — | 30,163,194 | Doc says `http://localhost:18888`; eye-test observed Aspire serves **https** only, http fails → doc must change to https |

## Dispositions & open questions

- **F-4** — root cause unambiguous: wire `DryRunFileSystemAdapter` (or skip format/git + writes) when `dryRun`. Verify "No files were written" only prints on the truly-write-free path. Clean.
- **F-6** — reorder `initNextSteps()` so `aspire restore` + `aspire run` precede any `db` command. Confirm db init truly requires postgres-up (eye-test says yes) before flipping; keep CLI and doc callout consistent.
- **F-13/F-12 — drive from the e2e, not just aspire run→start (USER 2026-06-27)** — the `aspire run`→`aspire start` switch is ONE caveat, not the whole story. Method: treat the `scaffold.runtime` e2e (the 47/47 sequence that actually produces a healthy running system) as the canonical command set; diff it against the tutorial to enumerate EVERY divergence (missing commands, order, flags, endpoint/port, http/https, health-probe shape), then test the real sequence and align the docs to it. The e2e-vs-docs diff scout (abc802aff3db46b95) produces this authoritative list. Generated AppHost is correct and the service serves under the e2e on Linux, so the Windows-specific not-served behavior is part of the same command-divergence story (tutorial uses `aspire run` + fixed ports + http + oRPC-health; e2e uses the working path). Tie F-12 orphaned-AppHost to the same alignment.
- **F-15** — F-15a/b are real & local: either add `getQueryState()` to `QueryClientPort` (+ adapter impl) OR rewrite the template to use an existing method (`getQueryData` / `getQueryCache().find()`), and fix the line-58 options typing. F-15c: verify against **published alpha.10 fresh-ui**; if publish-only, it self-resolves on republish — record, don't chase locally.
- **F-11 cache (new public surface)** — contract-first + PLAN-EVAL. Flags: `--cache` (default ON) + `--cache-backend redis|garnet|deno-kv` (default redis). Non-interactive default = cache on + redis. Emit the cache resource in register-infrastructure + appsettings + service env wiring (CACHE_URL) per backend (redis = Aspire Redis integration; garnet = Aspire Redis-protocol/Garnet container; deno-kv = no Aspire container, app-level). Storefront tutorial reconciled to redis default (away from garnet).
- **Interactive init = REGRESSION (USER 2026-06-27)** — user verdict: `init` MUST be interactive; flag-only is a defect to fix, not a feature to defer. So alpha.11 must (a) implement an interactive init prompt phase (prompt for missing options when not provided non-interactively / when TTY), and (b) that phase asks the two cache questions (enable cache? default yes; which backend? default redis) plus the other key options. Confirm via the scout whether interactive init ever existed (true regression) or was never built; either way it is in-scope now. Folds into the cache slice (C) as its prompt host, but the prompt phase itself is the broader fix. Defaults preserved so non-interactive/CI is unchanged (cache on + redis).
- **F-1** — acceptable alpha debt (user): do NOT cut 0.0.1. Add a Lume `_data` latest-alpha version source + inject the pinned `@<latest-alpha>` into every doc install snippet + an alpha banner. **Open:** verify whether the docs homepage already injects a version dynamically (user believes so); reuse that mechanism if it exists, else add one.
- **F-8** — doc-fix: update the 3 refs to `https://localhost:18888` + note the self-signed cert prompt.
- Minors F-5 (per-phase dry-run totals), F-7 (`database/` in file tour), F-9 (CLI↔SDK version warning note), F-10 (drop login-token sentence / document anonymous) — doc polish, batch with F-8.

## Proposed slice topology

- **A · CLI-core** (low-risk, no new surface): F-3 + F-4 + F-6. → Codex, scoped gates + e2e.
- **B · scaffold type-soundness**: F-15a/b (sdk + template) ; verify F-15c vs published. → Codex.
- **C · interactive-init + cache feature** (NEW public surface + REGRESSION fix → contract-first + PLAN-EVAL): interactive init prompt phase (regression) hosting the two cache prompts; `--cache`/`--cache-backend` flags + scaffold emission (3 backends) + appsettings + tutorial→redis. Defaults keep CI non-interactive (cache on + redis). → Codex after PLAN-EVAL.
- **D · service-runtime + doc-truth alignment** (e2e-driven): use the `scaffold.runtime` e2e as canonical; align tutorial to the working command sequence (run→start, ports, http→https, health probe, missing commands). Subsumes F-13/F-12/F-8 and the doc-drift minors. → repro + align.
- **E · health endpoint**: F-14 plain `GET /health` in service template (design: pre-oRPC route in main.ts.template); reconcile with the e2e's actual health-probe path from Slice D's diff. → Codex.
- **F · docs**: F-1 dynamic pin + alpha banner + F-5/F-7/F-9/F-10 polish (F-8 + command-drift moved into D). → docs lane.

Then: bump + republish **alpha.11**, re-run eye-test Run-1, resume sequential chapters.

## E2E ↔ tutorial command-drift (scout abc802, returned)

Canonical e2e `scaffold.runtime` order (suite: `packages/cli/e2e/suites/scaffold/capability-suites.ts`):
preflight → `init … --service --service-name users --service-port 3001 --ci --yes --no-git --force`
(+`--minimum-dependency-age=0` on JSR) → `service list` / `contract list` → plugin add worker/saga/
trigger/stream/auth `--samples --force` → `plugin list` → **db init/generate/seed** → 4× `deno check`
→ `aspire restore` → auth-smoke-env `deno eval` → `aspire start --apphost <p> --isolated
--non-interactive --nologo` → 9× `aspire wait <res>` → `aspire describe --format Json` → behavior
HTTP probes → `aspire stop`.

Reconciled dispositions (what to change vs. leave):
- **`aspire run` → `aspire start`** in tutorial (Ch.1/4/6). Faithful tutorial = `aspire start` WITHOUT
  `--isolated` (keep documented fixed ports + dashboard 18888); `--isolated` stays e2e-only. Fixes the
  `aspire run` divergence + likely F-12 orphaned-AppHost.
- **Do NOT add workers/auth to the storefront** — e2e adds them for a max-smoke; the storefront app
  legitimately uses products-service + sagas + triggers + streams only. Scout's "missing workers/auth"
  is intentional, not a defect. (Tutorial DOES omit an explicit `stream` add that e2e makes explicit —
  storefront treats streams as a saga dependency; verify that path still installs streams.)
- **`--force` on plugin add** is e2e defensiveness; not required in the faithful tutorial.
- **F-14 has a reference**: plugin APIs expose a working plain `GET /health` (8091-8094); the service
  template fix should mirror that idiom (Slice E / scout a864 Q3).
- **Tutorial-omitted behavior probes** (worker-executions poll, trigger-events POST) are e2e-internal;
  optional to surface in tutorial, not blockers.
- **Interactive init is tractable (not a from-scratch build)**: `PromptPort`
  (`packages/cli/src/kernel/ports/prompt-port.ts`, `.input()/.confirm()/.select()`) already exists and
  is wired into other commands (plugin add/service add); `--ci`/`--yes` flags labeled "non-interactive
  mode" prove interactive was the designed default, never wired into `init`. Slice C reuses the existing
  port+adapter. (Scout calls it "never built, no git-removal" = not a literal regression, but the user's
  regression-class mandate stands: wire it now.)

## RESOLVED (scout a864, returned)

1. **F-6 db-vs-aspire order — NOT a code reorder.** `db init/generate/seed` REQUIRE live Postgres but
   **self-provision it**: `DbOperationRunner.executeDetached()`
   (`packages/cli/src/kernel/adapters/database/operation-runner.ts:76-99,128-131,195-217`) shells out to
   `aspire start` detached, runs the Prisma op as an Aspire resource, polls `aspire describe`/`aspire
   wait`, then stops. So the CLI next-steps order (`aspire restore` → db → `aspire run`,
   `init-orchestrator.ts:94-131`) is **intentionally correct**; the **tutorial Ch.2 callout "db must run
   after aspire is up" is the wrong artifact**. → F-6 = doc/messaging fix (correct the callout + clarify
   db self-manages Aspire), NOT a code reorder. Slice A drops F-6; it moves to Slice D (doc-truth).
   **Latent risk (flag, not Run-1-proven):** if the user already has Ch.1's `aspire run` up, the db
   command's INTERNAL `aspire start` can collide on #138 fixed ports → the deep failure mode behind the
   eye-test's db concern. Proper fix = the #138 isolated-port work and/or sequencing guidance; verify in
   alpha.11 validation.
2. **e2e service :3001 coverage gap — CONFIRMED.** Behavior phase HTTP-probes only plugin APIs
   (8091-8094); **never the scaffolded service on :3001** → why F-13 stayed green. Fix-train adds a
   `behavior.service.health` probe to `scaffold.runtime` (regression guard for F-13/F-14).
3. **F-14 health — RESOLVED.** `@netscript/service` `ServiceBuilder.withHealth()`
   (`packages/service/src/builder/service-builder-impl.ts:354-363`, handler
   `packages/service/src/primitives/health.ts`) registers plain `GET /health|/health/live|/health/ready`
   — that's how plugin APIs serve health. Scaffolded service template (`assets/service/main.ts.template`
   via `defineService`, `assets/service/routers/health.ts.template`) is oRPC-only and never calls it.
   Fix: scaffolded service exposes plain `GET /health` via `withHealth()` (or `.route('get','/health',…)`
   / a `defineService` health option). Then the tutorial's `curl :3001/health` works.
4. **Interactive init — dormant infra, init is first consumer.** `PromptPort`
   (`kernel/ports/prompt-port.ts`) + `CliffyPrompt` adapter (`kernel/adapters/runtime/prompt/cliffy-prompt.ts`)
   exist but are wired into NO command (grep matches only the 2 files;
   `public-command-dependencies.ts:153-298` omits them). Wiring: instantiate `new CliffyPrompt()`, add
   `prompt: PromptPort` to init deps, call `confirm()`/`select()`/`input()` for cache + missing flags.
   `--ci`/`--yes` already gate it off for CI. Tractable.

## Status

- PR #154 (Aspire 13.4.6) MERGED 2026-06-27 (squash `b4ce2bb0`); main on aligned 13.4.6.
- e2e-vs-docs drift scout (abc802) RETURNED (folded above).
- code-truth scout (a864) RUNNING: resolves F-6 order, :3001 coverage gap, F-14 health ref, PromptPort wiring.
