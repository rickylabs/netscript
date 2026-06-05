# Drift Log: S1 / Wave 0 Foundation (@netscript/shared)

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine,
or current-state documentation.

## 2026-06-05 — Doctrine file path mismatch

- **What:** The `netscript-doctrine` skill points to `.llm/research/architecture-doctrine-docs-v2/doctrine/`, but this worktree stores the required doctrine files under `docs/architecture/doctrine/`.
- **Source:** Failed `Get-Content .llm/research/...`; successful listing of `docs/architecture/doctrine/01..10`.
- **Expected:** Skill path would match the in-repo doctrine location.
- **Actual:** The required reading path from the user is the valid one in this worktree.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `docs/architecture/doctrine/{01..10}.md`.

## 2026-06-05 — Release readiness detail layout differs from stale references

- **What:** `release-readiness.ts --out ./audit --include-plugins` generated `./audit/_summary.md`, but the listed JSON detail files were not present after the run.
- **Source:** `Get-ChildItem audit -Recurse -File` after the baseline command.
- **Expected:** Stale docs reference `audit/readiness/{jsr,doctrine,standards}/packages__shared.json` and the current summary lists `./audit/{jsr,doctrine,standards}/packages__shared.json`.
- **Actual:** Only `./audit/_summary.md` exists in this worktree after the baseline run.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `./audit/_summary.md`.

## 2026-06-05 — Current package metadata differs from stale package facts

- **What:** The stale `evaluate_shared.md` says `@netscript/shared` is version `1.0.0`; current `packages/shared/deno.json` is already `0.0.1-alpha.0`.
- **Source:** `packages/shared/deno.json`.
- **Expected:** Stale facts might show version drift requiring a pin.
- **Actual:** Version is already pinned to the alpha lockstep value.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `packages/shared/deno.json`.

## 2026-06-05 — Physical `utils/` deletion is blocked by later-wave consumers

- **What:** `plugins/sagas` and `plugins/workers` still map `@shared/utils` to `../../packages/shared/utils/mod.ts`; deleting `packages/shared/utils/` in Wave 0 would require plugin edits outside the allowed surface and break the final workspace check.
- **Source:** Consumer scan over `packages/` and `plugins/`; plugin `deno.json` import maps.
- **Expected:** `plan_shared.md` proposes migrating the `utils/` grab-bag into doctrine role folders and deleting generic folder vocabulary.
- **Actual:** Published `./utils` can be removed from `@netscript/shared`, but physical deletion must wait for later-wave consumer migration or an explicit rescope.
- **Severity:** significant
- **Action:** defer
- **Evidence:** `plugins/sagas/deno.json`, `plugins/workers/deno.json`, imports of `notFound` from `@shared/utils`.

## 2026-06-05 — Exact root standards command is broader than Wave 0 package scope

- **What:** `deno run --allow-read tools/fitness/check-netscript-standards.ts` without `--root packages/shared` checks the repository root and fails on root `deno.json` package metadata plus unrelated whole-tree warnings.
- **Source:** Final gate run after package implementation.
- **Expected:** The Wave 0 gate describes README, `/docs`, `mod.ts`, and export-map readiness for `packages/shared`.
- **Actual:** The package-scoped command exits 0 for `packages/shared`; the root command fails on non-package root metadata outside the Wave 0 surface.
- **Severity:** significant
- **Action:** accept
- **Evidence:** package-scoped command: `FAIL=0`; root command: `FAIL=4` for root `deno.json` license, description, publish include, and root export map.
