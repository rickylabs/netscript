# PLAN-EVAL — test-e2e-sqlite-runtime-tier--1158

- Plan evaluator session: `claude-openrouter` / `qwen/qwen3.7-max`
- Run: `test-e2e-sqlite-runtime-tier--1158`
- Surface / archetype: `packages/cli` (incl. `packages/cli/e2e`, `.github/`) / Archetype 6 (CLI /
  Tooling)
- Scope overlays: `SCOPE-service.md` (S1 changes Aspire service/background/app resource
  registration; S7 exercises a live AppHost)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` exists with 18 findings. Carried-in draft was re-baselined against `main @ c6f243da` with 5 corrections documented in a table (3 plan-shaping, 1 new blocker, 1 framing). The re-baseline is genuine: the generator re-derived every claim against the tree, not just the draft's stated blocker. Drift D-1, D-2, D-3, D-4 recorded in `drift.md` with severity and action.                                                                                                                                                                                                                                                                             |
| Decisions locked                        | PASS   | 10 decisions (D0-D9) in `plan.md § Locked Decisions`, each with rationale citing specific findings. D0-D4 correct the draft's root-cause analysis (garnet is not the blocker, redis is; `--allow-ffi` is services-only; `--cache-backend deno-kv` emits `Mode: 'External'` not `Local`). D5-D9 cover per-suite defaults, CI classifier, merge-readiness, provider-sensitive gates, Docker cleanup, and the harness-only-at-bootstrap constraint. All decisions are stated with rationale and cite code locations.                                                                                                                                                     |
| Open-decision sweep                     | PASS   | 6 decisions listed in `plan.md § Open-Decision Sweep`. 3 marked "must resolve now" — each resolved **within the slice that depends on it** with pre-agreed fallback: (1) exact `--cache false` vs `--no-cache` spelling resolved in S2 with 2-line additive fallback; (2) Garnet executable arm on `ubuntu-latest` resolved in S7 with documented downgrade; (3) postgres-shaped behavior gates resolved in S7 with per-gate evidence. 3 marked "safe to defer" with rationale. No open decision would force rework if deferred.                                                                                                                                      |
| Commit slices (< 30, gate + files each) | PASS   | 7 slices (S1-S7) in `worklog.md § Commit Slices`, each naming what it proves, the proving gate, and files touched. Slice count is 7 (< 30 target). Order is a strict dependency chain: S1 unblocks runtime path (hard prerequisite), S2-S3 build seams, S4 assembles suite, S5 makes teardown safe, S6 wires CI, S7 proves it live. S1 is correctly placed first because without it the sqlite tier fails at Aspire start for every non-service resource (finding 8).                                                                                                                                                                                                 |
| Risk register                           | PASS   | 9 risks (R-1 to R-9) in `plan.md § Risk Register`, each with mitigation. Risks cover: S1's cross-scaffold permission change (R-1), Cliffy `--cache false` acceptance (R-2), Garnet dotnet-tool restore (R-3), postgres-shaped behavior gates (R-4), `PrimaryCache` ordering (R-5), `ci:skip-e2e` regression (R-6), draft-PR CI gap (R-7), concurrency contention (R-8), doctrine restructure creep (R-9). Mitigations are concrete: unit tests, documented downgrades, separate concurrency groups, explicit non-scope.                                                                                                                                               |
| Gate set selected                       | PASS   | `plan.md § Fitness Gates` selects F-1 (lint), F-3 (arch:check), F-5 (publish:dry-run + jsr-audit), F-6 (publish:dry-run), F-9 (permission declaration), F-10 (per-slice unit tests), F-19 (scoped wrappers only), quality:scan. Matches `archetype-gate-matrix.md` for Archetype 6. Validation plan lists 11 ordered gates with expected evidence. Scope overlay gates (contract check, service check, runtime health, trace/log review, consumer check) are addressed by S1's unit tests, S7's live run, and the per-slice gate table.                                                                                                                               |
| Deferred scope explicit                 | PASS   | 5 items in `plan.md § Non-Scope` and `worklog.md § Deferred Scope`: merge-readiness flip (D6), `SCAFFOLD_DEFAULTS.CACHE_BACKEND` change (follow-up issue), `Mode: 'Local'` emission (debt entry), `--cache-backend` axis (superseded by D3), `env` on `CommandExecutor` port (not needed per finding 13). Each has rationale and owner (follow-up issue or debt entry). Arch-debt implications table lists 2 new debt entries to create at Close.                                                                                                                                                                                                                     |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md § jsr-audit surface scan` is present. Surface scanned: `packages/cli` public surface (`mod.ts`, `testing.ts`) and `packages/cli/e2e` internal surface. Verdict: **no slow-type / surface risks introduced**. Every planned export is a literal-typed constant object with a derived union (`SCAFFOLD.RUNTIME_SQLITE`, `SCAFFOLD_TITLE.RUNTIME_SQLITE`) or an added `readonly` field on an existing interface (`RunOptions.cache`). S1's generator change alters emitted **strings**, not types. `packages/cli/e2e/**` is not part of the published JSR surface. Required at gate time: `deno task publish:dry-run` + jsr-audit rubric on `packages/cli`. |

## Open-decision sweep (evaluator-run)

I ran the open-decision sweep myself. The plan lists 3 "must resolve now" decisions and claims each
is resolved within the slice that depends on it. I verified:

1. **Exact `--cache false` vs `--no-cache` spelling** — resolved in S2 with a pre-agreed fallback
   (add `--no-cache` negation to `init-command.ts` if neither works). The fallback is 2-line,
   additive, and does not change defaults. S2 cannot land without a passing `scaffold.init` on the
   sqlite suite, so the resolution is forced before commit. **No rework if deferred** — the fallback
   is decided in advance.

2. **Garnet executable arm on `ubuntu-latest`** — resolved in S7 with a documented downgrade: drop
   `NETSCRIPT_CACHE_MODE=Executable` and accept ambient-Docker garnet (still no postgres, no redis).
   S7 proves it locally before S6 pins the env var in CI. **No rework if deferred** — the downgrade
   is pre-agreed and recorded in R-3.

3. **Postgres-shaped behavior gates** — resolved in S7 as a full local run with per-gate evidence.
   Fixes land inside S7 rather than as a later slice. **No rework if deferred** — S7 is the evidence
   gate, and any fix is scoped to the sqlite suite's gate list (not deleted from the postgres
   suite).

I found **no open decision the plan did not flag that would force rework if deferred**. The three
"must resolve now" items are each resolved with pre-agreed fallbacks inside the dependent slice, so
deferral does not trigger rework. The "safe to defer" items are correctly classified: they are
product-default changes or latent-feature questions that do not affect the sqlite tier's viability.

## Spot-check results

I spot-checked the three most load-bearing findings against the tree at `main @ c6f243da`:

1. **Finding 4 — `Mode: 'Auto'` garnet has a Docker-less `dotnet tool run garnet-server` arm
   selected by `shouldUseContainerCache()` / `NETSCRIPT_CACHE_MODE`**:
   - `generate-register-infrastructure.ts:202` emits `if (shouldUseContainerCache()) {` for
     `Mode: 'Auto'` entries.
   - `_aspire-compat.mts` (embedded in `embedded.generated.ts`) defines `shouldUseContainerCache()`
     which honors `process.env.NETSCRIPT_CACHE_MODE` (`Container` → true, `Executable` → false) and
     otherwise probes `docker info`.
   - Line 356 emits `builder.addExecutable('${name}', 'dotnet', ...)` with
     `['tool', 'run', 'garnet-server', '--port', '${CACHE_DEFAULT_PORT}']`.
   - The resource is named `garnet` in both arms (the `${name}` comes from the cache entry key,
     which is `'garnet'` per `ensureSharedCache` in `workspace-mutator.ts:563-591`), so
     `runtime.wait.garnet` passes without Docker.
   - **CONFIRMED**: the draft's stated blocker was wrong; the garnet wait is not a blocker.

2. **Finding 5 — `netscript init` defaults to cache backend `redis` with `Mode: 'Container'` and no
   fallback arm**:
   - `scaffold-defaults.ts:12` has `CACHE_BACKEND: 'redis' as const`.
   - `generate-appsettings.ts:233-241` emits
     `{ Engine: 'Redis', Mode: 'Container', DataPath: '.data/redis' }` for `case 'redis'`.
   - `init-interactive.ts:51-55` prompts with `defaultValue: SCAFFOLD_DEFAULTS.CACHE_BACKEND`
     (redis).
   - `validate-init.ts:156` falls back to `SCAFFOLD_DEFAULTS.CACHE_BACKEND` when
     `options.cacheBackend` is undefined.
   - **CONFIRMED**: the real cache Docker cost is `redis`, not `garnet`. Init's default is a hard
     Docker container with no Auto/Executable fallback.

3. **Finding 8 — #1191's sqlite `--allow-ffi` fix exists **only** in
   `generate-register-services.ts`**:
   - `grep -rn "allow-ffi" packages/cli/src/kernel/templates/aspire/helpers/register/` returns only
     `generate-register-services.ts:35-36`.
   - `types.ts:69` shows `databaseEngine?: DatabaseEntry['Engine']` only on
     `RegisterServicesOptions`.
   - `RegisterAppsOptions`, `RegisterBackgroundOptions`, `RegisterPluginsOptions` do not carry
     `databaseEngine`.
   - `generate-register-apps.ts`, `generate-register-background.ts`, `generate-register-plugins.ts`
     emit `resolvePermissions(...)` with no sqlite branch.
   - **CONFIRMED**: apps, background processors, and plugin services get no `--allow-ffi` on sqlite
     → they exit 1 at startup. S1 is a hard prerequisite.

All three load-bearing findings are correct at file:line. The plan's D0/D2/D3/D4 are sound.

## Verdict

`PASS`

## Notes

The generator did genuine re-baseline work. The carried-in draft's root-cause analysis was wrong on
two plan-shaping counts (garnet is not the blocker, redis is; `--cache-backend deno-kv` emits
`Mode: 'External'` not `Local`), and the generator corrected both with code evidence. The new
blocker (finding 8, `--allow-ffi` services-only) is correctly identified and placed first as S1. The
plan is additive, narrowly scoped, and does not touch the doctrine `Restructure` work on
`@netscript/cli`. The open-decision sweep is thorough and each "must resolve now" item has a
pre-agreed fallback that prevents rework. Implementation may begin.
