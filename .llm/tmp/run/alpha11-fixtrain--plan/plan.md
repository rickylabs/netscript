# alpha.11 fix-train — plan (Storefront Ch.1 eye-test blockers)

Companion: `research.md` (same dir). Source: eye-test Run-1 (#153) + two code-truth scouts (abc802,
a864). User decisions 2026-06-27 locked. This plan is the PLAN-EVAL deliverable; no implementation
slice begins before PLAN-EVAL `PASS` (OpenHands minimax-M3, separate session).

## Goal

Make published `@netscript/cli` Storefront Ch.1 completable as written on Windows, then republish
alpha.11 and re-run the eye-test. User's #1 priority: prod CLI scaffold must FULLY work (maintainer +
prod/JSR; no-copy paths must not leak source). Sequencing: fix all → alpha.11 → resume tutorials.

## Scope & archetypes

| Surface | Archetype / overlay | Slices |
|---|---|---|
| `packages/cli` (commands, scaffold templates, kernel) | ARCHETYPE CLI + SCOPE-service (scaffold emits services) | A, C, E |
| `packages/sdk` (`QueryClientPort`) | ARCHETYPE package (public API) | B |
| `packages/fresh` (vite plugin type) | ARCHETYPE package + SCOPE-frontend | B (verify-only) |
| `packages/service` (reference only — `withHealth`) | read-only reference | E |
| `packages/cli/e2e` (scaffold.runtime suite) | harness gate | E |
| `docs/site/**` | SCOPE-docs | D, F |

Implementation lane: **WSL Codex daemon-attached slices** (framework source). Docs lanes D/F MAY use
the Claude documentation-authoring exception (Opus, under harness skill), validated by OpenHands; any
framework-source touch within them (none expected) reverts to Codex. Cache (Slice C) is **new public
surface → contract-first**.

## Slice topology & dependency order

```
A (CLI-core)        ─┐
B (type-soundness)  ─┼─ independent, parallel-safe (different files)
E (health + e2e)    ─┘   E's new :3001 probe also DIAGNOSES F-13
C (interactive+cache) ── largest; new public surface; own PLAN-EVAL focus
D (doc-truth align)  ─┐ docs; author AFTER code lands so docs reflect reality
F (install pin)      ─┘ docs; independent of code
```

Republish alpha.11 only after A/B/C/E merge + a clean `scaffold.runtime` (now incl. the :3001 probe).
D/F docs land alongside/just after. Then re-run eye-test Run-1.

---

## Slice A · CLI-core hygiene  (F-3, F-4)

No new public surface. Two clean defects.

- **F-3 `--version`** — `public-command-tree.ts:102` hardcodes `version: '1.0.0'`. Contract: the Cliffy
  `.version()` must read the **installed CLI package version** (the `@netscript/cli` `deno.json`
  version), surfaced via the existing version/asset mechanism (text/JSON import, NOT a runtime file
  read — honor [[jsr-safe-asset-embedding-text-imports]]). `netscript --version` must print the real
  published version (e.g. `0.0.1-alpha.11`).
- **F-4 dry-run is write-free** — root cause: `DryRunFileSystemAdapter`
  (`adapters/scaffold/dry-run-fs.ts`) exists but is never injected;
  `public-command-dependencies.ts:72-82` wires the real `DenoFileSystem` regardless of `--dry-run`.
  Contract: when `dryRun` is set, the scaffold writes **zero files** to disk (and skips fmt + git
  init), while still printing the planned tree; the orchestrator's "No files were written" message
  (`init-orchestrator.ts:68-71`) must print **only** on the truly write-free path. Fix = conditionally
  inject `DryRunFileSystemAdapter` (and guard the format/git steps in `init-pipeline.ts:79,84`).
- **Gates:** scoped `run-deno-check.ts`/`run-deno-lint.ts`/`run-deno-fmt.ts --ext ts,tsx` on
  `packages/cli`; CLI unit tests; a new/updated e2e or unit assertion that `init --dry-run` leaves an
  empty target dir AND prints the plan. (F-5 minor — per-phase dry-run totals — optional polish here.)

## Slice B · scaffold type-soundness  (F-15)

- **F-15a/b (REAL, local):** `service-showcase.ts.template:60` calls `queryClient.getQueryState(...)`,
  absent from `QueryClientPort` (`packages/sdk/src/ports/query-client.ts:35-63`); line 58 has a
  `QueryOptionsWithInitialData`→`QueryClientFetchOptions` assignability error. **Decision (locked):**
  prefer changing the **template** to use existing port methods (`getQueryData` / `getQueryCache().find()`)
  and correct the options typing — do NOT widen the SDK public surface unless the template genuinely
  needs `getQueryState`. If the showcase semantically needs query *state* (dataUpdatedAt), then add
  `getQueryState()` to `QueryClientPort` + its adapter as a deliberate, contract-first SDK addition
  (note in plan, gets its own doc-lint). PLAN-EVAL to confirm which path.
- **F-15c (verify-only):** scout could not reproduce the `NetScriptVitePlugin`→Vite7 `PluginOption`
  error from local source (`packages/fresh/src/application/vite/vite.ts`) → likely **published
  alpha.10 drift**. Action: confirm against published alpha.10 fresh-ui; if publish-only, it
  self-resolves on alpha.11 republish — record, do not chase a local non-error.
- **Gates:** `deno check --unstable-kv` on `packages/sdk` + the generated-workspace check
  (`generated.deno-check` equivalent over a scaffolded project) must be GREEN with zero type errors;
  `deno doc --lint` on any changed SDK export (full export map, [[jsr-doc-lint-full-export-set]]).

## Slice C · interactive-init + cache feature  (F-11)  — NEW PUBLIC SURFACE, contract-first

### Public contract (lock at PLAN-EVAL)

Flags on `netscript init` (`init-command.ts:43-62` `.option()` chain):
- `--cache` / `--no-cache` — **default ON**. Provision an app cache resource.
- `--cache-backend <redis|garnet|deno-kv>` — **default `redis`**. Ignored (with a notice) if
  `--no-cache`.

Interactive prompt phase (NEW; init is the first `PromptPort` consumer):
- Wire `new CliffyPrompt()` (`adapters/runtime/prompt/cliffy-prompt.ts`) into init deps via
  `public-command-dependencies.ts`; add `prompt: PromptPort` to the init context.
- When TTY and **not** `--ci`/`--yes`: prompt for any missing option. Two cache questions:
  `confirm("Enable cache?", default true)` → then `select("Cache backend", [redis, garnet, deno-kv],
  default redis)`. Also prompt for other missing required options (name, service-name, db) using the
  same port (this is the user-mandated interactive regression fix; keep it cohesive).
- `--ci`/`--yes`/non-TTY: **no prompts**; defaults apply (cache on + redis). CI/e2e behavior unchanged
  except the new default cache resource (see e2e note).

### Scaffold emission (per backend)

- **redis** (default): emit Aspire Redis integration using the existing
  `SCAFFOLD_ASPIRE_INTEGRATIONS.REDIS` constant (`constants/scaffold/scaffold-aspire.ts:27-30`) in
  `generate-register-infrastructure.ts`; add a `Cache` section to `generate-appsettings.ts`
  (`AppsettingsOptions` ~24-40/90); wire `CACHE_URL` (or the framework's cache env contract) into the
  service env in `generate-register-services.ts` so the service reaches the cache.
- **garnet:** add a Garnet integration constant (Redis-protocol container) — NEW constant alongside
  REDIS — and emit it the same way (Garnet speaks RESP, so the service `CACHE_URL` wiring is
  identical; only the container image/integration differs).
- **deno-kv:** NO Aspire container; app-level Deno KV. Emit the appsettings/env that selects the
  deno-kv cache adapter; no infra resource. Document that deno-kv needs no external service.
- Storefront tutorial reconciled to **redis default** (Slice D removes the manual garnet aspire-config
  step; cache becomes CLI-managed).

### Gates

- Scoped check/lint/fmt on `packages/cli`; CLI unit tests for flag parsing + prompt defaults +
  per-backend emission (snapshot the generated `apphost.mts`/`appsettings.json` for each backend).
- `scaffold.runtime` e2e: with default cache on (redis), the generated AppHost must restore + start +
  the cache resource must reach healthy (`aspire wait <cache>`); pick the resource name deliberately
  and add a wait. Confirm non-interactive default path is unaffected (CI uses `--ci`).
- Interactive smoke (non-blocking on e2e): a unit/integration test driving the prompt port with a
  fake adapter to assert the two cache questions + defaults.
- **Debt/decision:** garnet vs deno-kv integration constants are new scaffold surface — record in
  `arch-debt.md` if any backend ships behind a follow-up (deno-kv app-adapter may be the thinnest;
  redis+garnet are the Aspire path). Default redis MUST be fully working for alpha.11.

## Slice E · service health + e2e coverage  (F-14, F-13 diagnosis, coverage gap)

- **F-14 plain `GET /health`:** scaffolded service (`assets/service/main.ts.template` via
  `defineService`; `assets/service/routers/health.ts.template` oRPC-only) must expose plain
  `GET /health` like plugin APIs do via `@netscript/service` `ServiceBuilder.withHealth()`
  (`packages/service/src/builder/service-builder-impl.ts:354-363`). Fix path (PLAN-EVAL to pick):
  (i) template adopts the Layer-2 builder `.withRPC().withHealth().serve()`, or (ii) `defineService`
  gains a health option that mounts `withHealth()` routes, or (iii) `.route('get','/health',…)`.
  Result: `curl :3001/health` returns 200 with the standard health body; oRPC health may remain too.
- **e2e coverage gap (F-13 diagnosis):** add `behavior.service.health` (+ maybe a list probe) to
  `scaffold.runtime` so the scaffolded service on :3001 is HTTP-probed. This is also the **diagnostic
  for F-13**: if the probe is GREEN under `aspire start` on Linux, F-13 is Windows-`aspire run`-specific
  → fixed by Slice D's `aspire run`→`aspire start`. If the probe is RED even on Linux/aspire-start, the
  service genuinely isn't wired to serve → escalate to a service-runtime scaffold slice (record in
  `drift.md`). The storefront uses `--service` (not a plugin), so add the service to the e2e's probe set.
- **Gates:** scoped check/lint/fmt `packages/cli`; the new e2e probe must pass; service-template unit
  test for the health route.

## Slice D · doc-truth alignment (e2e-driven)  (F-6, F-8, F-12, minors)  — docs lane

Drive every command from the canonical `scaffold.runtime` sequence (research.md "command-drift").
- **`aspire run` → `aspire start`** in Storefront Ch.1/4/6 (faithful: `aspire start` WITHOUT
  `--isolated`; keep documented fixed ports + dashboard 18888). Resolves F-12 (orphaned/unattachable
  AppHost) and aligns with the aspire skill.
- **F-6 callout correction (NOT a code reorder):** db commands self-provision Aspire
  (`DbOperationRunner`→`aspire start` detached). Correct the Ch.2 callout "db must run after aspire is
  up" → db commands manage their own Aspire session; clarify the init next-steps messaging. Add the
  **#138 caveat**: do not run db commands while a separate `aspire run`/`aspire start` is up on the
  same fixed ports until #138 isolated-ports lands (cross-link to the #138 slice).
- **F-8 https:** `01-scaffold.md:30,163,194` `http://localhost:18888` → `https://…` + self-signed cert
  note. Minors: F-7 (`database/` in file tour), F-9 (CLI↔SDK 13.4.x version-warn note — now 13.4.6
  aligned post-#154, verify the warning is gone), F-10 (anonymous dashboard / drop login-token line).
- Remove the manual garnet aspire-config step (now CLI-managed via Slice C redis default).
- **Gates:** docs build (Lume) clean; pre-flight the comp-syntax landmines
  [[lume-vento-comp-syntax-landmines]] / [[lume-vento-function-keyword-landmine]]; xref intact. Validated
  by OpenHands per the docs-authoring exception (per-page verdict).

## Slice F · install pin + alpha banner  (F-1)  — docs lane

- **User decision:** stay on alpha; do NOT cut `0.0.1`. Dynamically pin the exact latest alpha in every
  install snippet ("like the homepage") + an alpha banner.
- **Action:** FIRST verify whether the docs homepage already injects a version dynamically (user
  believes so). If a mechanism exists, reuse it; else add a Lume `_data` latest-alpha source (read the
  CLI version from the workspace/registry at build) and template it into install commands
  (`01-scaffold.md:45` + all tutorials) as `jsr:@netscript/cli@<latest-alpha>`. Add an alpha banner
  component to tutorial pages.
- **Gates:** docs build clean; pinned snippet renders the real latest-alpha; banner shows.

---

## Cross-cutting

- **#138 (fixed-port flake)** is a real dependency for the db-self-aspire collision (Slice D caveat)
  and clean parallel boots. Keep as its own queued slice (`aspire start --isolated` + endpoint
  discovery); reference it from D, don't fold it in.
- **Eye-test serialization:** while fix-train Aspire boots run (Slice C/E e2e), serialize vs any
  Windows eye-test Aspire to avoid the cross-OS :18891 collision until #138 lands.
- **Security:** no tokens in artifacts/briefs; Codex pushes via SSH explicit refspec
  `HEAD:refs/heads/<branch>`; no force-push; only the 2 accepted casts.

## Gate set (merge-readiness)

- Per-slice scoped check/lint/fmt (`.llm/tools/run-deno-*.ts --ext ts,tsx`) on touched packages.
- `deno task test` for touched packages; `deno doc --lint` for changed public exports.
- Full `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` GREEN **including the new
  :3001 service-health probe and the default redis cache resource** before alpha.11 republish.
- Docs: Lume build clean + xref + landmine pre-flight.

## Debt / decisions to record

- Garnet + deno-kv cache integration constants are new scaffold surface (arch-debt if any backend ships
  behind a follow-up; redis default MUST work in alpha.11).
- F-15c published-vs-local drift: record as publish-only if confirmed.
- F-13 fix path is conditional on Slice E's probe result (drift.md branch).
- SDK `getQueryState` addition (only if Slice B takes that path) is a deliberate public-surface change.

## Open for PLAN-EVAL to rule on

1. Slice B: template-rewrite vs SDK `getQueryState` addition.
2. Slice C: cache env contract name (`CACHE_URL` vs framework convention) + cache resource name for the
   `aspire wait`; deno-kv adapter location.
3. Slice E: which `withHealth` wiring path (Layer-2 builder vs `defineService` health option vs `route`).
4. ~~Interactive scope~~ — **LOCKED (USER 2026-06-27): BROAD.** Init prompts for ALL missing options
   (name, service, service-name, db) plus the two cache questions when on a TTY without `--ci`/`--yes`.
   This is the full regression fix ("it should already be interactive"). Defaults preserved for CI.
