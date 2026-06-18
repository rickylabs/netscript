# PLAN-EVAL — chore-deps-hygiene--deps

- Plan evaluator session: PLAN-EVAL evaluator (this session, 2026-01)
- Run: `chore-deps-hygiene--deps`
- Branch under eval: `chore/deps-hygiene` (off `release/jsr-readiness`)
- Surface / archetype: A6-adjacent (cli-tooling) for the scanner scripts; otherwise repo tooling. No scope overlays.
- Drift active: **D-G2-2** supersedes D-G2-1 — npm `catalog:` protocol IS implemented (each workspace member declares npm deps as a `catalog:` value in its own `package.json`, resolved against the root `deno.json` `catalog` block, not via member `deno.json`). Catalog-shape work is therefore hygiene/enforcement, not restructuring.

## Checklist results

| Plan-Gate item                                | Result | Evidence / location |
| --------------------------------------------- | ------ | ------------------- |
| Research present and current                  | PASS   | `research.md` exists, rebaselined against current `main` (commit refs in worklog). `drift.md` updated; D-G2-1 superseded by D-G2-2. Catalog `catalog:` resolution confirmed live in the tree (verified by evaluator — see "Catalog live-invariant spot-check" below). |
| Decisions locked                              | PASS   | Locked Decisions table (DH-1..DH-4) with rationale; decisions are concrete (catalog law stays, scanners FAIL the build, wrapper replaces bespoke bump, divergent JSR policy is report→converge→FAIL). |
| Open-decision sweep                           | PASS   | Open-Decision Sweep table resolves all four items: 3 RESOLVED, 1 deferred ("safe to defer: inventory existing `deps:*` wrappers") because the inventory is performed in the catalog-census slice (D-1) before any new wrapper is written. No decision deferred that would force rework. |
| Commit slices (< 30, gate + files each)       | PASS   | Slice list (worklog `## Design`): D-1 (catalog census), D-2 (catalog compliance scanner), D-3 (JSR centralization scanner), D-4 (`file:`/`link:` audit), D-5 (task prune), D-6 (bump wrapper) — all single-concern, all name a proving gate (catalog census / FAIL-on-violation under `arch:check` + `ci` / parity test for wrapper). All < 30 LOC of net behaviour each (scanners are CLI scripts with pure cores; wrapper is a thin shim). |
| Risk register                                 | PASS   | Four risks, each with mitigation: false-positive lockout → report-only first, flip later; pruning a referenced task → grep all references before removal; bump parity → snapshot current output, assert wrapper parity in test; `deno.json` perturbation → scope edits to tasks only, diff-review every hunk. |
| Gate set selected                             | PASS   | Fitness Gates table maps to existing harness: scanner runs as workspace-wide sibling of `check-doctrine.ts` under `arch:check`; wired into `ci` (currently `arch:check` is NOT in `ci`, plan addresses this); publish:dry-run (27 units / 0 slow types) kept green; bump parity test gates wrapper replacement. |
| Deferred scope explicit                       | PASS   | "Non-Scope (LOCKED — never)" explicitly enumerates: no catalog restructuring, no version-pin edits, no `scaffold-versions.ts` touch, no release-time `deno.json` transform, no dep upgrade, no `file:`/`link:` adoption. "Hidden Scope" enumerates four caveats each addressed by an explicit slice/risk. |
| jsr-audit (package/plugin waves)              | N/A    | This wave ships **scanner tooling**, not publishable units. No public-surface change in any `@netscript/*` package. Audit-only consumers of the catalog/JSR shape. (Reason: tooling wave.) |

### Catalog live-invariant spot-check (load-bearing for this group, per trigger)

Verified directly in the tree:

1. **Members declare npm deps as `catalog:` in `package.json`** — `grep -l '"catalog:"' packages/*/package.json plugins/*/package.json` returns 18 files. Confirmed `catalog:` values in `packages/fresh-ui/package.json` (`@preact/signals`, `clsx`, `preact`, `tailwind-merge`), `packages/queue/package.json` (`amqplib`, `ioredis`), and others. The Deno 2.8 `catalog:` protocol resolves these against the root `deno.json` `catalog` block.
2. **Root `deno.json` `catalog` block defines the versions** — verified at `deno.json:92-126`. Contains `amqplib: "^2.0.1"`, `ioredis: "^5.11.1"`, `@preact/signals: "2.9.2"`, `clsx: "^2.1.1"`, `preact: "^10.29.2"`, `tailwind-merge: "^3.6.0"` plus ~25 more packages. Catalog block is the live source of truth.
3. **Inline `npm:` pins the compliance scanner MUST flag** — verified live:
   - `packages/queue/adapters/amqp.adapter.ts:10` — real import: `import { connect } from 'npm:amqplib@^0.10.3'`. Catalog pin is `amqplib: "^2.0.1"`. **Stale/wrong-version inline pin**, exactly the case the scanner must surface.
   - `packages/cli/src/kernel/constants/windows.ts:149-151` — string literals inside `DEFAULT_BUNDLE_EXTERNAL_IMPORTS` Record (consumed by `deno bundle` rewrite before `deno compile`). **NOT real Deno imports** — these are data values for the bundle-patch step.
   - `packages/fresh-ui/registry.manifest.ts:22` — string literals inside a `dependencies: ['npm:clsx@^2.1.1', 'npm:tailwind-merge@^3.5.0']` array (a manifest emitted to users; this is documentation/sample copy, not a runtime import). `tailwind-merge@^3.5.0` diverges from catalog `^3.6.0`.
4. **JSR deps stay inline `jsr:` per member** — Deno has no JSR catalog. Verified cross-member invariants: `jsr:@zod/zod@4.4.3` (13 members), `jsr:@hono/hono@4.12.24` (7 members), `jsr:@standard-schema/spec@1.1.0` (5 members), all JSR std modules at `^1`. **No cross-member JSR divergence on current tree** — JSR-centralization scanner would currently emit zero FAILs (clean baseline).
5. **No `file:`/`link:` specifiers anywhere** — `grep -E '"(file|link):' packages/*/deno.json plugins/*/deno.json` returns zero matches. `audit-file-link` scanner will have zero findings on current tree.
6. **JSR centralization is the right shape for a report→FAIL gate** — because the tree is already clean, the scanner can land in report-only mode without CI lockout, then flip to FAIL once the report has been observed for one slice. Plan's DH-3 + Risk mitigation "allow-list + dry-run report before enabling FAIL" matches this.
7. **Nothing in the plan de-catalogs, edits pins, or touches `scaffold-versions.ts`** — "Non-Scope (LOCKED — never)" item 1 (catalog restructuring) and item 2 (version pins / `scaffold-versions.ts`) are explicit.
8. **Every scanner lands report-only before flipping to FAIL** — Risk Register row 1: "Allow-list + dry-run report before enabling FAIL; land scanner in report-only, flip to FAIL in a later slice." Validation Plan row 1 orders the scanners before FAIL-on-violation is enabled.

### String-literal vs real-import distinction (gap surfaced during eval)

The plan's "FAIL on inline `npm:` specifiers in source" rule does not, on the current plan text, explicitly distinguish between (a) real `import … from "npm:…"` statements and (b) string literals that happen to contain `"npm:…"` (compile-bundle external map; registry manifest dependency arrays). Both of the latter appear in the tree and would false-positive under a naive grep.

**Evaluator judgment:** This is a **NIT, not a blocker**. (i) The catalog-compliance scanner is in `report-only` mode for at least one slice (Risk Register row 1, Validation Plan row 1). (ii) The slice can name the false-positive list explicitly (the two string-literal sites above) so the implementer sees them before they ship. (iii) The scanner detection rule (regex vs AST) is a slice-internal design choice — the plan correctly says "FAIL on violation" without prescribing the parser technique.

**Recommendation for the implementer of D-2:** the detection rule should anchor on `import`/`export … from "npm:…"` statement contexts (and the `imports`/`scopes` keys of `deno.json`), NOT on substring `npm:` inside arbitrary string literals. A regex with `\bfrom\s+['"]npm:` or AST-based detection is sufficient. Document the false-positive set (compile-bundle external map, registry manifest dependency arrays, tests that pin a literal npm module name for assertion text) as allow-listed or scoped.

### Other notes from spot-checks

- `arch:check` is per-package (`deno run --allow-read .llm/tools/fitness/check-doctrine.ts`) and not in `ci` today. Plan correctly identifies both — wiring the workspace-wide scanner into `ci` AND `arch:check` (with a `Finding[]` / non-zero-exit contract mirroring `check-doctrine.ts`) is the right shape.
- `deno task ci` is `deno ci && deno task ci:quality && deno task coverage:functions && deno task publish:dry-run && deno task audit:critical`. `deno ci` is `npm ci`-style clean install from lockfile, not a check runner. Adding `deps:check` after `ci:quality` is the right insertion point.
- The bespoke bump tool referenced (no path found by evaluator in `.llm/tools/` inventory at quick scan — the implementer must locate it; the plan says "wrap native, preserve structured output, snapshot parity" which is sufficient).
- DH-2 ("JSR-version centralization is a scanner gate, not a config change") is correct: Deno has no JSR-catalog equivalent and no publish-time map tree-shaking, so the only durable enforcement is a gate. Correctly framed.
- Catalog census slice (D-1) is the right ordering — it establishes the empirical baseline before the compliance scanner (D-2) and centralization scanner (D-3) decide what is "stale" or "divergent".

## Open-decision sweep (evaluator-run)

- None forcing rework. The single open ("inventory `deps:*` wrappers") is performed inside D-1 (catalog census) before any wrapper is written, so it cannot force rework later.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

(n/a)

## Notes

- D-G2-1 is superseded by D-G2-2 — `research.md` and `worklog.md` both flag this. Any reviewer reading `drift.md` MUST read D-G2-2.
- Plan is marked `DRAFT` in its header. Verdict is conditional on the DRAFT marker being flipped to "ready for implementation" by the implementer after this PASS — but the substance of the plan is sound and the locked decisions survive a status flip.
- One **non-blocking NIT** for the implementer: explicitly allow-list (or rule out via parser design) the string-literal contexts that contain `"npm:…"` substrings but are not real Deno imports — `packages/cli/src/kernel/constants/windows.ts` (compile-bundle external map) and `packages/fresh-ui/registry.manifest.ts` (user-facing manifest dependencies array). Plan slice D-2 should name these as known-allow-listed at landing time so the report-only baseline is meaningful.
- The plan correctly chooses **report-only → FAIL** sequencing for the centralization scanner (DH-3 + Risk Register row 1). Because the tree is currently clean on JSR centralization, this transition has zero CI-lockout risk.
- Catalog itself (DH-1) is locked; no slice may restructure it. The scanners add enforcement without changing the shape.