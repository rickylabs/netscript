# Commits — Deno 2.8 + Aspire 13.4 toolchain upgrade

Plan-phase commit (this run, plan artifacts only — no `packages/` edits):

| Commit | Branch | Scope |
| ------ | ------ | ----- |
| `90a54e0` | `chore/deno-2.8-aspire-13.4-upgrade` | `docs(upgrade): plan + Phase-P publish plan + worklog Design + drift + plan-eval skeleton` |

## IMPL-phase commits landed (green-up, 2026-06-15)

| Commit | Scope | Slice |
| ------ | ----- | ----- |
| `f16b31f` | `fix(aspire): split public barrel value exports` | T0 |
| `db11fb7` | `fix(triggers): add isolated declaration annotations` | T3 |
| `212189a` | `fix(workers): add isolated declaration annotations` | T3 |
| `ac4ee94` | `fix(plugins): add stream and saga check annotations` | T3 |
| `b64dea1` | `fix(fresh): add builder fixture annotations` | T3 |
| `939bbe9` | `fix(fresh): align sse timer handle type` (real `TS2322`) | T3 |
| `f44c2da` | `fix(fresh-ui): add isolated declaration annotations` | T3 |
| `2d5e7ac` | `fix(cli): temporarily carve out isolated declarations` | LD-10 |
| `03838d1` | `style(packages,plugins): deno fmt isolatedDeclarations annotations` | T3 |

Remaining IMPL slices (generator resumes): T1, T2, T4, T5 (audit last). See plan.md
§Execution Status.

## Planned IMPL commit slices (executed in the impl phase, see plan.md §Commit Slices)

Phase T PR `chore/deno-2.8-toolchain-pin-foundation`:
- T0 aspire barrel dry-run fix
- T1 CI pin v2.8.x
- T2 catalog: + 28-member rewrite
- T3 remove dead suppressions / normalize isolatedDeclarations+lib
- T4 four slow-types carve-outs + debt rows
- T5 deno ci + audit + per-fn coverage + parallel

Phase P PR `chore/jsr-alpha-publish` (after T0+Slice0):
- P1 bump-version prerelease alpha
- P2 exclude cli from publish
- P3 deno publish (dry-run → real)
- P4 scaffold.published.runtime e2e
- P5 research-realized.md log

Phase A PR `chore/aspire-13.4-version-bump` (gated on E-12 GA check):
- A1 SCAFFOLD_VERSIONS → 13.4.x + CTK consolidation
- A2 stub 13.5 blocks + tsx/jsonrpc audit
- A3 wire aspire logs --search nightly
- A4 (joint w/ Wave 6) WithProcessCommand flag-off + doctor skip + skill docs

Each IMPL slice = its own commit, LF-normalized, `-c core.autocrlf=false`, gate evidence in worklog.

## Phase 0 — Supervisor ground-work (post-IMPL-EVAL remediation, 2026-06-16)

| Commit | Scope | Slice |
| ------ | ----- | ----- |
| `70a4904` | `docs(harness): lock final-plan + phase-registry for PR #44 remediation` | B0 |
| `941eb08` | `feat(tools): deps toolbelt (latest/outdated/why/audit/prod-install) + tasks + entry.md` | B1 |
| `a39b513` | `docs(skills): add netscript-deno-toolchain skill (native deno toolchain goldmine)` | B2 |
| `1d928d3` | `docs(skills): add netscript-pr skill (branch/PR/phase-comment/label house format)` | B3 |
| `709d811` | `feat(tools): watch-run.ts + AGENTS.md toolbelt/skills/watch wiring` | B4+B5 |
| `7e537f5` | `feat(tools): check-scaffold-versions.ts E-12/LD-7 guard + check:scaffold-versions task; R4 brief; R3 done/R4 in_progress registry` — guard runs green (`E-12 OK — 10 scaffold pin(s) are stable`, exit 0); enables R4's GA-only Aspire bump | R4-prep |

Phase 0 closeout: B6 (prod-install lane) delivered in B1 as `deps/prod-install.ts` +
`deno task deps:prod-install`. watch-run.ts validated (exit 0 on change, exit 2 on timeout).

B1 evidence: `deno check --unstable-kv` clean on all five tools; `deno task deps:latest` →
`26 behind / 52 total` with `jsr:@fedify/fedify ^1.5.0 → 2.2.5` (stable, proving the prerelease-trap
fix); `deps:why @hono/hono` → `DEAD import` (confirms eval C5); `@std/path` → 140 source hits.

## IMPL-EVAL remediation slices (2026-06-16)

| Commit | Scope | Slice |
| ------ | ----- | ----- |
| `104bfc5` | `fix(fresh,deps): align preact subpath pins to catalog + dax ^0.48`; evidence: `deps:latest --filter "preact*"` = 0 behind / 2 total, `deps:latest --filter "@david/*"` = 0 behind / 1 total, targeted `deno check --no-lock --unstable-kv` passed for Fresh/Fresh UI entrypoints. | R1 |
| `3e7368f` | `fix(plugins,deps): prune dead imports from workers + sagas (C5)`; DEAD evidence: `@hono/hono` sourceUsed=false/sourceHitCount=0/likelyDeadImport=true/fullyRemovable=true; `@netscript/plugin-workers-core/presets` sourceUsed=false/sourceHitCount=0/likelyDeadImport=true/fullyRemovable=true; `@netscript/plugin-workers-core/schemas` sourceUsed=false/sourceHitCount=0/likelyDeadImport=true/fullyRemovable=true; `@netscript/plugin-sagas-core/integration/publisher` sourceUsed=false/sourceHitCount=0/likelyDeadImport=true/fullyRemovable=true; `@netscript/plugin-sagas-core/streams` sourceUsed=false/sourceHitCount=0/likelyDeadImport=true/fullyRemovable=true. Scoped plugin check/lint passed. | R2 |
| `211039d` | `chore(deps): bump inventory to stable latest + DEBT for held majors (C2)`; bumped 20 stable patch/minor/pre-approved entries and held 6 documented debt rows before maintainer follow-up. Evidence: post-edit `deps:latest --behind-only` = 6 documented holds / 52 total; `deno task check` PASS (1581 files, 14 batches, 0 occurrences); `deno task publish:dry-run` PASS exit 0 with only pre-existing warning classes. | R3 |
| `3613a7d` | `chore(deps): bump approved held majors`; bumps `@fedify/amqp`, `@fedify/denokv`, `@fedify/redis`, `@durable-streams/state`, and `amqplib`; leaves only `vite` held as DEBT. Evidence: `deps:latest --behind-only` = 1 documented hold / 52 total; `deno task check` and `deno task publish:dry-run` rerun after the bump. | R3 follow-up |
| `b834f54` | `feat(cli): source app scaffold pins from catalog + bump Aspire 13.4 (C6)`; Aspire pins: `ASPIRE_SDK` `13.2.2`→`13.4.4`, `ASPIRE_HOSTING_DENO` `13.1.0`→`13.4.0`, `ASPIRE_HOSTING_SQLITE` `13.1.0`→`13.4.0`, `SCALAR_ASPIRE` `0.7.3`→`0.10.3`, all NuGet stable GA with no prerelease suffix. Catalog sourcing: app `deno.json` external Fresh/Preact/Signals/Tailwind/Vite imports now come from `SCAFFOLD_APP_CATALOG` / `SCAFFOLD_APP_IMPORTS`, with npm pins mirrored from the root catalog. Init smoke PASS under `.llm/tmp/r4-init-smoke` and cleaned up; generated app npm pins matched root catalog and generated Aspire SDK was `13.4.4` with no semver prerelease pins. Validation PASS: `deno task check:scaffold-versions`, `deno check --unstable-kv packages/cli`, generator config test, touched-file fmt check. Final hash reported after commit creation/push. | R4 |
