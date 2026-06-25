## PLAN-EVAL verdict: `PASS`

All 8 Plan-Gate boxes are satisfied; the plan is decision-complete; the gate set is appropriate for the CI/config/docs surface (no `packages/`/`plugins/` source edits in C0–C4). C5/C6 are correctly deferred (spike-gated / follow-up). Three non-blocking slice-time corrections are listed below.

### Plan-Gate checklist

| Plan-Gate item | Result | Evidence |
|---|---|---|
| Research present and current | PASS | `research.md` re-baselines against `origin/main@c0020a1b` (includes #126); 2.9.0 release-date sourced from `denoland/deno/releases/tag/v2.9.0` + `deno.com/blog/v2.9` + PR #34359. |
| Decisions locked | PASS | `plan.md` "Locked decisions" — D1–D6 with rationale (scope, lane split, breaking-risk handling, deferral, decided-out, lock reseed approval gate). |
| Open-decision sweep | PASS | No decision left open that would force rework when sliced; C5 transitive subpath resolution is the only genuine unknown and is explicitly OUT of scope (D4, spike-gated). |
| Commit slices | PASS | 5 slices (C0–C4); each names what it proves, the gate, and the files it touches. All < 30. |
| Risk register | PASS | `plan.md` "Risk register" — 6 risks (compression-off #35486, min-dep-age #35458, lock reseed, input-cache mask, `--jobs` parity, skill mirror drift) with likelihood + mitigation. |
| Gate set selected | PASS | Repo-level gates: `deno task ci`; `deno task e2e:cli run scaffold.runtime --cleanup`; `deno task publish:dry-run`; `deno task ci:quality` (C1 parity). No package archetype gate applies (C0–C4 don't touch package surface). |
| Deferred scope explicit | PASS | `plan.md` D4/D5 + "Deferred / debt": C5 spike-gated; C6 follow-up; `bundle --declaration` and lockfile seeding decided-out; `aspire/package.json` missing-lock recorded as pre-existing. |
| jsr-audit surface scan (pkg/plugin) | N/A | C0–C4 are CI/config/docs glue; no `packages/`/`plugins/` source edits. C5/C6 are deferred. |

### Spot-verification summary

- **Pin-site inventory (7 sites / 5 files, verified):**
  - `.github/toolchain.env:7` — `NETSCRIPT_DENO_VERSION=v2.8.3` (canonical; consumed by `openhands-agent.yml:286,398`).
  - `.github/workflows/ci.yml:47,68,98` — hardcoded `deno-version: "2.8.3"`.
  - `.github/workflows/e2e-cli.yml:57,87` — hardcoded `deno-version: "2.8.3"`.
  - `.github/workflows/publish.yml:62` — hardcoded `deno-version: "2.8.3"` (plan/research cite `:23` — see F-1 below).
  - `.github/workflows/openhands-agent.yml:286,398` — env-var-driven (not in plan's 7 sites).
- **`deno.json` task runner sites (verified):** `ci:quality` at `:22` (shells `run-parallel-tasks.ts`); `check` at `:23`; `fmt:check` at `:49`; `lint` at `:50`; `e2e:cli` at `:47` (correctly excluded from C2's input-cache scope).
- **Unstable array (verified):** `deno.json:13-18` = `["kv","temporal","tsgo","worker-options","raw-imports"]` — none stabilized in 2.9; `--unstable-kv` remains pervasive (incl. scaffold output `deno-json.ts`/`editor-config.ts`).
- **`run-parallel-tasks.ts` (verified):** 52-line hand-rolled `Promise.all` runner used by `ci:quality`; no other consumers. C1's deletion is safe.
- **C5 deferral grounding (verified):** `MYSQL_ADAPTER_PACKAGE = "prisma-adapter-mysql"` at `packages-copier.ts:74`; `pruneMysqlAdapterFromDatabasePackage:203-230`; `PACKAGE_TO_LOCAL_PATH` at `import-resolver.ts:84-131` and `local-import-resolver.ts:6-40+`. All three C5 blocker claims are concrete and real.
- **Compression-off bump risk (verified):** No `automaticCompression` references anywhere in `packages/`/`plugins/`/`deno.json`/`.github`. The plan correctly notes that if `scaffold.runtime` doesn't assert response compression, the bump is safe; if it does, D3 routes through per-handler opt-in.
- **Deno 2.9 does NOT fix the https-asset blocker (verified):** 2.9 release notes focus on tooling/publish improvements; the CLI-on-JSR asset blocker is independently addressed by PR #127. Plan/research correctly couple this concern to #127, not the 2.9 bump.

### Slice-time corrections (non-blocking — fold into IMPL)

**F-1 — Correct `publish.yml` line citation.** Both `plan.md:19` and `research.md:64` cite `publish.yml:23`, but the actual hardcoded `deno-version: "2.8.3"` lives at `publish.yml:62` (verified). The slice shape is unchanged — same line, same edit — only the cited line number is wrong. Update the citations at slice time.

**F-2 — `docs/site/_plan/00-README.md:57` contains "Deno 2.8"** in a contextual sentence ("Deno 2.8, .NET 10, and Node 22 are all present…"). Plan C3 does not currently call this out. Recommend including it in C3 for consistency; not load-bearing.

**F-3 — `aspire/package.json` arch-debt citation is unverifiable.** No `aspire/package.json`-related entry exists in `arch-debt.md`. The plan's "pre-existing arch-debt" claim is therefore a bookkeeping reference error. Recommend either (a) file the gap as a new `arch-debt.md` entry before IMPL begins (so the decided-out citation is honest), or (b) rephrase D5 to "pre-existing scaffold DX gap (not currently in `arch-debt.md`; out of scope for this program)". Non-blocking.

### Residual risks (forward-looking, not plan-defects)

- C5/C6 remain follow-up work; they are correctly NOT in this plan.
- D6 lock reseed requires explicit user approval per AGENTS.md "Do not delete lock files or caches, and do not run `deno cache --reload`, without approval." — the plan correctly routes this through an approval gate.
- The bump risk from `Deno.serve` compression-off (#35486) is caught by C0's `scaffold.runtime` gate (per-handler opt-in via D3 if needed).
- Min-dep-age default-on (#35458) is caught by C0's CI `deno install` gate (pinned catalog reduces exposure).

### Notes

- Evaluator: OpenHands / openrouter/minimax/minimax-m3, action run 28184411850 (per `netscript-harness/SKILL.md` "Agent Delegation Contract" — PLAN-EVAL must run in OpenHands with minimax M3).
- All 2.9 feature claims in research.md Part A are real Deno 2.9 features; no invented APIs.
- C5 deferral rationale (subpath resolution, `catalog:` against source, MySQL-adapter prune on immutable source) is sound and grounded in real code.
- `bundle --declaration` and lockfile-seeding decided-outs are justified by repo shape (source publish + isolatedDeclarations; no foreign lock consumer).

Full PLAN-EVAL deliverable: `.llm/tmp/run/chore-deno-2.9-adoption--adoption-plan/plan-eval.md`.