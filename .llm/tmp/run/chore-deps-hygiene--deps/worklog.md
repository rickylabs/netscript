# Worklog: chore/deps-hygiene

| Field | Value |
|-------|-------|
| Run ID | `chore-deps-hygiene--deps` |
| Branch | `chore/deps-hygiene` (off `release/jsr-readiness`) |
| Status | `active` (**PLAN-EVAL PASS @ cycle 1**; implementation gated on user dispatch — G1 also PASS) |

## Progress Log

| Time | Phase | Step | Notes |
|------|-------|------|-------|
| 2026-06-18 | bootstrap | skeleton scaffolded | Supervisor created run dir + draft `plan.md`/`research.md` (5 deliverables: 3 scanners, task prune, bump wrapper). No branch/worktree/generator yet. |
| 2026-06-18 | plan-gate | group branch launched | Branched off umbrella @ `1f4cafa3` for the Plan-Gate. Plan/research/Design ready (inherited; catalog premise corrected via D-G2-2). Draft sub-PR → `release/jsr-readiness` + PLAN-EVAL dispatch (OpenHands/minimax M3, separate session) follow. Worktree deferred to implementation launch (WSL Codex, ext4). |
| 2026-06-18 | plan-gate | PLAN-EVAL cycle 1 = **PASS** | OpenHands minimax M3 (run 27755191977, separate session) → `plan-eval.md`. All 8 plan-gate boxes PASS (jsr-audit N/A — tooling wave); catalog live-invariant spot-check (8 points) confirmed against tree; off-limits/catalog guardrail PASS. DRAFT marker flipped → ready. **Non-blocking NIT (D-2):** compliance scanner must anchor on real `from "npm:…"` import statements + `deno.json` imports/scopes, NOT substring `npm:` — allow-list `windows.ts` (bundle-external map) + `registry.manifest.ts` (manifest dependency array). **Plan-Gate cleared — implementation may begin (gated on user dispatch; G1 also PASS).** |

## Design

> Plan & Design checkpoint (supervisor-authored; implementation lane is WSL Codex). `plan.md` holds
> locked decisions + gates; this section fixes component design + contracts. Catalog premise
> corrected (D-G2-2): the catalog IS live via member `package.json` `catalog:` — the scanners
> enforce that live invariant.

### Component design (3 scanners + prune + wrapper, under `.llm/tools/deps/`)

Shared scanner contract (sibling to `check-doctrine.ts`):

- **Input:** parse every workspace member (`packages/* packages/cli/e2e plugins/*`): `deno.json`
  imports, `package.json` deps (incl. `catalog:` refs), inline `npm:`/`jsr:` in source; resolve
  `catalog:` against the root `deno.json` `catalog` block.
- **Output:** `Finding[]` `{ ref, level, message, path, line }` + `--json` + non-zero exit on FAIL.
  Pure analysis core (testable) behind a thin CLI shell.
- **Wiring:** a new `deps:check` aggregator added to `ci`/`ci:quality` (durable enforcement, since
  `arch:check` is per-package and not in `ci` today).

| Scanner | Invariant | FAIL condition |
|---------|-----------|----------------|
| `scan-jsr-centralization` | a `jsr:` spec used by >1 member agrees on version | version divergence (minus allow-list) |
| `scan-npm-catalog-compliance` | every npm dep a member uses is a `catalog:` ref | inline npm pin where a catalog ref is required (e.g. `queue` `npm:amqplib@^0.10.3`); also flags stale catalog (`amqplib ^2.0.1`) |
| `audit-file-link` | no publishable unit ships `file:`/`link:` | any `file:`/`link:` in a publishable unit |

### Roll-out design (avoids CI false-positive lockout)

Each scanner lands **report-only** (exit 0) → tree cleaned to zero findings (or explicit allow-list +
arch-debt entry per intentional divergence) → a follow-up slice flips it to **FAIL-on-violation** and
wires it into `ci` + `arch:check`. This is the mitigation for the "scanner blocks CI on a legitimate
case" risk.

### Task prune + bump wrapper

- **Prune:** task-reference graph (root + member tasks, CI workflow, `e2e:cli`, `.llm/tools/*`
  callers) → remove only tasks with zero inbound refs; diff-reviewed.
- **Bump wrapper:** greenfield (no bespoke tool exists — research-confirmed) thin wrapper over native
  `deno bump-version`, preserving structured output; parity test.

### Slice plan (design-fixed; mirrors plan.md)

gate-0 catalog-resolve smoke → dep/task census → `scan-jsr-centralization` (report-only) →
`scan-npm-catalog-compliance` (report-only) → `audit-file-link` (report-only) → clean tree/allow-list
→ flip all three to FAIL + wire `ci`+`arch:check` → task prune → bump wrapper + parity test.

### Design guardrail

Never de-catalog, edit a version pin / `scaffold-versions.ts`, or add a release-time `deno.json`
transform. A divergence is fixed by *converging versions* or an *explicit allow-list + arch-debt
entry*, never by relaxing the catalog law.

## Gate Results

| Slice | Gate | Command / Evidence | Result |
|-------|------|--------------------|--------|
| D-1 | Gate-0 catalog resolution | `deno task deps:prod-install` after wrapper fix (`deno ci --prod` under Deno 2.8.3) | PASS: prod graph resolved, no lockfile churn |
| D-1 | Census JSON | `deno run --allow-read .llm/tools/deps/census.ts --json` | PASS: 27 members, 33 catalog entries, 61 dependency keys, 324 dependency uses, 148 tasks |
| D-1 | Tooling check | `deno check .llm/tools/deps/census.ts .llm/tools/deps/workspace.ts .llm/tools/deps/prod-install.ts` | PASS |
| D-1 | Tooling lint | `deno lint --no-config .llm/tools/deps/census.ts .llm/tools/deps/workspace.ts .llm/tools/deps/prod-install.ts` | PASS |
| D-2 | npm catalog scanner (report-only) | `deno run --allow-read .llm/tools/deps/scan-npm-catalog-compliance.ts --json` / `deno task deps:check:npm-catalog` | PASS exit 0: 27 WARN findings on real dependency surfaces, including `packages/queue/adapters/amqp.adapter.ts:10`; evaluator-named string-literal sites were not reported |
| D-2 | Tooling check | `deno check .llm/tools/deps/scan-npm-catalog-compliance.ts .llm/tools/deps/workspace.ts` | PASS |
| D-2 | Tooling lint | `deno lint --no-config .llm/tools/deps/scan-npm-catalog-compliance.ts .llm/tools/deps/workspace.ts` | PASS |
| D-3 | JSR centralization scanner (report-only) | `deno run --allow-read .llm/tools/deps/scan-jsr-centralization.ts --json` / `deno task deps:check:jsr-centralization` | PASS exit 0: zero findings; equivalent `1`/`^1` major-only ranges normalized |
| D-3 | Tooling check | `deno check .llm/tools/deps/scan-jsr-centralization.ts .llm/tools/deps/workspace.ts` | PASS |
| D-3 | Tooling lint | `deno lint --no-config .llm/tools/deps/scan-jsr-centralization.ts .llm/tools/deps/workspace.ts` | PASS |
| D-4 | file/link audit (report-only) | `deno run --allow-read .llm/tools/deps/audit-file-link.ts --json` / `deno task deps:audit:file-link` | PASS exit 0: zero findings |
| D-4 | Tooling check | `deno check .llm/tools/deps/audit-file-link.ts .llm/tools/deps/workspace.ts` | PASS |
| D-4 | Tooling lint | `deno lint --no-config .llm/tools/deps/audit-file-link.ts .llm/tools/deps/workspace.ts` | PASS |
| D-5 | Fresh task prune | `(cd packages/fresh && deno task publish:dry-run)` | PASS: canonical task succeeds, 0 slow types |
| D-5 | Task census | `deno run --allow-read .llm/tools/deps/census.ts --json` filtered to `packages/fresh` | PASS: `dry-run` alias absent; `publish:dry-run` present |
| D-5 | Reference check | `rg 'deno task dry-run|"dry-run"' packages/fresh/deno.json packages/fresh/README.md` | PASS: no matches |
| D-6 | bump wrapper parity | `deno task version:bump:test` | PASS: native `deno bump-version patch --dry-run` stdout/stderr/exit code preserved |
| D-6 | bump wrapper smoke | `deno task version:bump --cwd <tmp> --json patch --dry-run` | PASS: JSON wrapper reported `ok=true`, exit 0, `1.2.3 -> 1.2.4`; scratch dir removed |
| D-6 | Tooling check | `deno check .llm/tools/deps/bump-version.ts .llm/tools/deps/bump-version_test.ts` | PASS |
| D-6 | Tooling lint | `deno lint --no-config .llm/tools/deps/bump-version.ts .llm/tools/deps/bump-version_test.ts` | PASS |
| D-7 | Enforcement wiring | `deno task deps:check` | PASS exit 0: JSR centralization and file/link audit run with `--fail-on-violation` and emit no findings; npm catalog scanner runs report-only and emits 27 WARN findings |
| D-7 | Publish dry-run | `rtk proxy deno task publish:dry-run` | PASS: all publishable units completed dry-run; existing slow-type/dynamic-import warnings only |
| D-7 | Arch wiring | `rtk proxy deno task arch:check` | FAIL after dependency gate PASS: `deps:check` runs first and exits 0, then pre-existing doctrine baseline fails with `FAIL=58 WARN=147 INFO=1` |
| Final | Scanner reports | npm catalog: 27 report-only WARN findings; JSR centralization: `[]`; file/link audit: `[]` | PASS for report-only scanner landing |
| Final | Publish dry-run | `deno task publish:dry-run` | PASS: all publishable units completed dry-run; existing slow-type carve-out warnings only |
| Final | Doctrine gate | `deno task arch:check` | FAIL: pre-existing repository-wide doctrine baseline (`FAIL=58 WARN=147 INFO=1`), not caused by dependency-shape scanner wiring |

## Handoff Summary

- D-1 through D-7 are implemented on `chore/deps-hygiene`.
- D-1 added the dependency/task census and fixed drift D-G2-3 by removing the unsupported
  `--frozen` flag from the `deps:prod-install` wrapper while preserving lock hygiene.
- D-2 added the npm catalog-compliance scanner with the PLAN-EVAL NIT applied: it scans real
  dependency surfaces (`package.json`, `deno.json` imports/scopes, and source import/export
  specifiers) and does not flag the non-import string-literal sites in `windows.ts` or
  `registry.manifest.ts`.
- D-3 added JSR centralization scanning; D-4 added publishable `file:`/`link:` auditing; D-5 pruned
  the Fresh `dry-run` task alias; D-6 wrapped native `deno bump-version` with parity tests.
- D-7 added root `deps:check`, wired it into `ci:quality`, and made `arch:check` run `deps:check`
  as a distinct first step before `check-doctrine.ts`.
- `deps:check` enforces JSR centralization and file/link audits with `--fail-on-violation`.
  `scan-npm-catalog-compliance` is intentionally report-only: it is an adoption/divergence census
  for member inline-pin npm usage, and full member-to-catalog migration is a separate scoped
  decision. This rationale is recorded in `.llm/harness/debt/arch-debt.md`.
- Gates run: `deno task deps:check` PASS; `rtk proxy deno task publish:dry-run` PASS;
  `rtk proxy deno task arch:check` FAIL only after the dependency gate passes, due to the
  pre-existing doctrine baseline (`FAIL=58 WARN=147 INFO=1`).
- No dependency versions, catalog pins, lock files, caches, `scaffold-versions.ts`, or release-time
  transforms were changed.

## Handoff Notes

- Implementation is ready for separate OpenHands IMPL-EVAL. Do not self-certify this run.
- HARD LINE remains: never de-catalog, edit version pins, touch `scaffold-versions.ts`, delete
  lock/cache files, or use dependency upgrades to satisfy a scanner.
- The npm scanner's 27 WARN findings are evidence for a future convergence decision, not a D-7
  fail gate.
