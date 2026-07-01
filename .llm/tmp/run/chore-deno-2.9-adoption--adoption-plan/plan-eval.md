# PLAN-EVAL — `chore-deno-2.9-adoption--adoption-plan`

- Plan evaluator session: OpenHands `openrouter/minimax/minimax-m3`, run `28184411850`
- Run: `chore-deno-2.9-adoption--adoption-plan`
- Branch: `chore/deno-2.9-adoption` (head: `c0020a1b` baseline; no commits yet)
- Surface / archetype: repo toolchain/CI/config + skill docs (no package surface touched). No package
  archetype gate applies to C0–C4.
- Scope overlays: none.

## Checklist results

| Plan-Gate item                          | Result            | Evidence / location                                                                                                                                              |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS              | `research.md` exists; baselined against `origin/main c0020a1b` (includes #126); 2.9.0 release date sourced. Spot-checks below.                                  |
| Decisions locked                        | PASS              | `plan.md` `## Locked decisions` D1–D6 stated with rationale; D3 mechanism (compression handling as C0 sub-commit) is sound.                                       |
| Open-decision sweep                     | PASS              | No decision is left open that would force rework when sliced; C5 (transitive subpath resolution) is explicitly spike-gated and OUT of scope (D4).             |
| Commit slices (< 30, gate + files each) | PASS              | 5 slices (C0–C4); each names what it proves, the gate, and the files it touches. See slice-time notes below.                                                     |
| Risk register                           | PASS              | `plan.md` `## Risk register`: 6 risks (compression-off #35486, min-dep-age #35458, lock reseed, input-cache mask, `--jobs` parity, skill mirror drift) — each with likelihood + mitigation. |
| Gate set selected                       | PASS              | Repo-level gates: `deno task ci`; `deno task e2e:cli run scaffold.runtime --cleanup`; `deno task publish:dry-run`; `deno task ci:quality` (C1 parity). No package archetype gate (no `packages/`/`plugins/` source edits in C0–C4). |
| Deferred scope explicit                 | PASS              | `plan.md` D4/D5 + `## Deferred / debt`: C5 spike-gated; C6 follow-up; `bundle --declaration` and lockfile seeding decided-out; `aspire/package.json` missing-lock recorded as pre-existing. |
| jsr-audit surface scan (pkg/plugin)     | N/A               | C0–C4 are CI/config/docs glue; no `packages/`/`plugins/` source edits. C5/C6 are deferred.                                                                        |

## Open-decision sweep (evaluator-run)

Open decisions the plan lists (none require rework):

- **D6 — `deno.lock` reseed approval gate.** Plan correctly routes this through explicit user approval per AGENTS.md ("Do not delete lock files or caches, and do not run `deno cache --reload`, without approval"). The bump gate (C0) verifies CI `deno install` clean (catches min-dep-age default-on #35458); non-`--frozen` install at `ci.yml:50,71,101` means a reseed won't hard-fail, so the only requirement is reconciliation — which D6 covers. **Sound.**
- **C5 (deferred).** Plan/research correctly identifies three real blockers (subpath resolution by bare specifier, `catalog:` against source monorepo, MySQL-adapter prune on immutable source). All three are concrete and grounded in `packages/cli/src/maintainer/adapters/packages-copier.ts` + `import-resolver.ts` + `local-import-resolver.ts`. **Deferral rationale is sound.**
- **Decided-out.** `bundle --declaration` — repo publishes source TS directly (no `deno bundle` usage); `isolatedDeclarations:true` (`deno.json:60`) already gives fast `.d.ts`. Lockfile *seeding* — `deno install` lockfile seeding (2.9 #35330/#35346/#35350/#35394) imports an existing foreign lock; scaffold emits no foreign lock (`templates/workspace/deno-json.ts:45` uses `nodeModulesDir:'auto'`). **Both justified.**
- **`aspire/package.json` missing-lock (D5).** Plan claims this is "pre-existing scaffold DX arch-debt." No matching entry exists in `.llm/harness/debt/arch-debt.md`. **Inaccurate bookkeeping reference** — but this is a context note in the decided-out section, not a load-bearing debt claim; the slice does not require the entry to exist. Non-blocking.

Open decisions the plan did **NOT** flag but I found:

- **None.** No open decision that would force rework when sliced.

## Verdict

`PASS`

### Slice-time corrections (non-blocking — fold into IMPL)

#### C0 (Bump Deno 2.8.3 → 2.9.x)

- **Correct `publish.yml` line citation.** Both `plan.md:19` and `research.md:64` cite `publish.yml:23`, but the actual hardcoded `deno-version: "2.8.3"` lives at `publish.yml:62` (verified by `grep -n "deno-version" .github/workflows/publish.yml`). The slice shape is unchanged — same line, same edit — only the cited line number is wrong. Update the citations at slice time.

#### C3 (Refresh `netscript-deno-toolchain` skill to 2.9)

- **`docs/site/_plan/00-README.md:57`** contains "Deno 2.8" in a contextual sentence ("Deno 2.8, .NET 10, and Node 22 are all present…"). Plan C3 does not currently call this out. Whether C3 should rephrase this sentence depends on the intended audience (it is `_plan/` material, internal). Recommend including it in C3 for consistency; not load-bearing.

#### D5 / `aspire/package.json` (decided-out)

- **Arch-debt registry citation is unverifiable.** No `aspire/package.json`-related entry exists in `arch-debt.md`. The plan's "pre-existing arch-debt" claim is therefore a bookkeeping reference error. Recommend either (a) file the gap as a new `arch-debt.md` entry before IMPL begins (so the decided-out citation is honest), or (b) rephrase D5 to "pre-existing scaffold DX gap (not currently in `arch-debt.md`; out of scope for this program)". Non-blocking — does not affect C0–C4.

### Notes

- **Pin-site inventory (verified):** 7 sites / 5 files as the plan claims:
  - `.github/toolchain.env:7` — canonical env var `NETSCRIPT_DENO_VERSION=v2.8.3` (consumed by `openhands-agent.yml:286,398`).
  - `.github/workflows/ci.yml:47,68,98` — hardcoded `deno-version: "2.8.3"`.
  - `.github/workflows/e2e-cli.yml:57,87` — hardcoded `deno-version: "2.8.3"`.
  - `.github/workflows/publish.yml:62` — hardcoded `deno-version: "2.8.3"` (plan/research cite `:23`).
  - `.github/workflows/openhands-agent.yml:286,398` — env-var-driven (not in plan's 7 sites).
- **`deno.json` task runner sites (verified):** `ci:quality` at `:22` (shells `run-parallel-tasks.ts`); `check` at `:23`; `fmt:check` at `:49`; `lint` at `:50`; `e2e:cli` at `:47` (correctly excluded from C2's input-cache scope).
- **Unstable array (verified):** `deno.json:13-18` = `["kv","temporal","tsgo","worker-options","raw-imports"]` — none stabilized in 2.9; `--unstable-kv` remains pervasive (incl. scaffold output `deno-json.ts`/`editor-config.ts`).
- **`run-parallel-tasks.ts` (verified):** 52-line hand-rolled `Promise.all` runner used by `ci:quality`; no other consumers (`grep -rn "run-parallel-tasks" packages/ plugins/ deno.json` confirms). C1's deletion is safe.
- **C5 deferral grounding (verified):** `MYSQL_ADAPTER_PACKAGE = "prisma-adapter-mysql"` at `packages-copier.ts:74`; `pruneMysqlAdapterFromDatabasePackage:203-230`; `PACKAGE_TO_LOCAL_PATH` at `import-resolver.ts:84-131` and `local-import-resolver.ts:6-40+`. All three blocker claims are concrete and real.
- **Compression-off bump risk (verified):** No `automaticCompression` references anywhere in `packages/`/`plugins/`/`deno.json`/`.github`. The plan correctly notes that if `scaffold.runtime` doesn't assert response compression, the bump is safe; if it does, D3 routes through per-handler opt-in.
- **Catalog-in-`deno.json` (verified):** Plan correctly re-checks the `netscript-deno-toolchain` skill's JSR-in-catalog rejection claim (`SKILL.md:50-53`) at 2.9 — research.md B.6 item 4. Skill claim is grounded in current Deno behavior; no fabricated APIs.
- **Lockfile-reseed path (verified):** `ci.yml` lines 50, 71, 101 run `deno install` without `--frozen`; non-fatal on reseed. Plan correctly identifies D6 approval gate.
- **Deno 2.9 does NOT fix https-asset blocker (verified):** 2.9 release notes focus on tooling/publish improvements; the CLI-on-JSR asset blocker is independently addressed by PR #127. Plan correctly couples this concern to #127, not the 2.9 bump.

## Summary

The plan is sound, scoped, and grounded. Five slices (C0–C4) are supervisor-implementable with concrete
gates; C5/C6 are correctly deferred with grounded rationale. Three non-blocking slice-time corrections
are listed above. Implementation supervision may begin.

`PASS`