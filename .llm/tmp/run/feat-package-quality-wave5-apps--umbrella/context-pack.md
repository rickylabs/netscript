# Umbrella Context Pack — Wave 5: Apps Layer (sdk · service · fresh · fresh-ui)

Run ID (umbrella): `feat-package-quality-wave5-apps--umbrella`
Umbrella branch: `feat/package-quality-wave5-apps` (off track `feat/package-quality` @ `9b27fb4`)
PR target: `feat/package-quality` (the S1 track) — merges **once**, at full Wave 5 completeness.
Role: SUPERVISOR-authored umbrella/tracking + architectural pre-research. **Not** a PLAN-EVAL or
IMPL-EVAL artifact. The locked slice authority is each sub-wave `plan.md` once written.

## ✅ STATUS: UNBLOCKED — RECONCILED @ `dfab7a4` (2026-06-10). READY TO OPEN 5a.

Wave 4 is **merged to the track** (closeout PR #16 → `f0e1441`; all sub-waves 4a/4b/4c/4d
IMPL-EVAL PASS, separate sessions). The track has been **reconciled into this umbrella**
(`dfab7a4`, merge clean — no conflicts) and the apps layer was **re-baselined against the merged
surface** (`research.md` §0.5, `wave5-rebaseline.json` + `wave5-doclint.json`). Gate sequence:

1. ✅ umbrella branch + worktree + seed + Draft PR.
2. ✅ Wave 4 IMPL-EVAL PASS + merged to track (`f0e1441`; 4d verdict committed `bc17fe3`).
3. ✅ **Reconcile (this pass):** track merged into umbrella (`dfab7a4`); cross-package consumer
   scan + stream coupling re-confirmed against the merged Wave 4 streams surface; re-baseline
   recorded. **Headline unchanged:** 328 doc-lint / 138 private-type-ref / all 4 dry-run FAIL —
   but **all 4 now PASS `deno check`** on the merged surface + blessed lock.
4. ▶️ **NOW:** open sub-wave **5a** (service). Plan & Design + separate PLAN-EVAL/IMPL-EVAL per
   sub-wave from here. (This is the next generator's job — supervisor stops at unblock + re-baseline.)

> **Tooling note (Wave 4 tail):** `.llm/tools/parse-deno-check-errors.ts` was **removed**; the
> scoped `deno check` runner/parser is now `.llm/tools/run-deno-check.ts` (root `check`/`lint`/
> `fmt:check` use scoped wrappers that exclude Wave 5 app packages + Wave 6 CLI debt). Doctrine
> gained F-19. Use `run-deno-check.ts`, not the old path.

## Scope — 4 publishable units

`@netscript/service` (A4+A3), `@netscript/sdk` (A3+A4), `@netscript/fresh-ui` (A4 Browser),
`@netscript/fresh` (A4+A3 Browser, multi — splits internally). All `0.0.1-alpha.0`.

Out of scope: `@netscript/ui-primitives` (RFC defers it — do NOT create); `@netscript/cli`
(Wave 6); unified-mode/Nitro adapters (RFC 14 roadmap — protect seams only, don't implement);
publishing/versioning/OIDC (S2/S3).

## Headline (read `research.md` for the full architect's pass)

- **This is a RE-ARCHITECTURE wave, not fine-tuning.** Unlike Wave 4 (all 9 PASS dry-run), **all
  4 Wave 5 packages FAIL `deno publish --dry-run`** (slow types: service 8, fresh-ui 6, fresh 4,
  sdk 2). These grew via RFC 12/13/15/16/17 **before doctrine + the plugin rewrite**.
- **328 doc-lint errors**, dominated by **138 `private-type-ref`** (public APIs leak unexported
  types — F-5 surface re-design, not annotation). `fresh` = 276 of the 328.
- **20 over-cap files** (fresh 13, incl. two >1,000 LOC); **2 zero-test packages** (sdk, service);
  **`service` has no README**; **0/4 have `docs/` or `./testing`**.
- **Central surface debate:** sdk + fresh each expose **12 subpaths** ⇒ F-16 cardinality + F-18
  sub-barrel. Several are RFC-era (sdk `query-client`/`collections`/`streams`; fresh `query`/
  `streams`/`vite`/`interactive`) — justify or fold each.
- **`fresh` is the long pole** (57% of LOC, 84% of doc-lint, multi-archetype) and **must split**
  per-entrypoint-cluster (`split-strategy.md` §5d).

## Three architect throughlines (beyond JSR readiness)

1. **Surface encapsulation** — kill the 138 private-type-ref leaks via deliberate public-type
   design + F-16 discipline on the 12-subpath packages.
2. **Forward-compatible seams (RFC 14, unimplemented)** — `sdk` `createServiceClient` `Transport`
   seam + `fresh` `defineFreshApp` extension points (§10) designed so unified mode never needs a
   breaking alpha change. **Protect the seam; do NOT implement unified mode.** Plus cross-package
   integration (`research.md` §3): sdk↔fresh query/streams, fresh↔fresh-ui forms.
3. **CLI-readiness (Wave 6 next)** — stable + documented + tested `fresh-ui/registry/manifest`,
   `defineFreshApp`/`definePage` presets, `define-service` preset, `createQueryFactories`, and
   `./testing` harnesses so starter commands compete with create-next-app / TanStack Start.

## Sub-wave split (proposal — see `split-strategy.md`)

`service (5a) → sdk (5b) → fresh-ui (5c) → fresh (5d, splits into 5d-1..5d-6)`, dependency-ordered.
Umbrella merges once at full completeness.

## Phase 0 reading (per sub-wave, read only what the slice needs)

1. This pack + `research.md` + `split-strategy.md`.
2. `.llm/harness/archetypes/ARCHETYPE-{3,4}-*.md` + `SCOPE-*` + `gates/archetype-gate-matrix.md`.
3. `.llm/harness/lessons/*` — package-quality is **architectural, not type/lint cleanup**.
4. RFC set (consumer evidence at **test-app root**, not this worktree):
   `.resources/rfcs/frontend/` — README → 04 → 03 → 12 → 05 → 17 → 16 → 15 → 13 → 14 → 06/07.
   RFC 14 = seam obligations only (unimplemented). RFC 17 v3 = the realized integration thesis.
5. Implementation evidence: `.llm/tmp/run/feat-frontend-rfc-implementation--*` (~22 runs).
6. Consumer proof: `apps/playground` (the rewrite — keep it compiling); `apps/frontend` (old).
7. Focused code per unit: `deno.json`, the `exports` entrypoints. Prefer `deno doc <module>` /
   `deno doc --filter <symbol>` over whole-file reads.

## MEASURE-FIRST (per sub-wave generator, before locking effort)

- Full-export `deno doc --lint` over **every** `exports` entrypoint (root-only undercounts;
  `fresh` full-export = 276 vs near-zero on root). Re-measure per cluster for `fresh`.
- `deno publish --dry-run --allow-dirty` per unit (currently RED on all 4 — confirm the slow-type
  fixes clear it).
- `deno check --unstable-kv` over all entrypoints.
- Test adequacy vs archetype layers; sdk + service start from **zero**.
- Browser/real-route validation for fresh-ui + fresh (against `apps/playground` routes).
- Record real per-entrypoint numbers in the sub-wave `research.md`/`drift.md`.

## Carried-in caveats

1. **All 4 dry-run RED** — F-6 is the first gate to turn green; slow-type (missing return type)
   fixes precede doc-lint work.
2. **138 private-type-ref** — each is a surface decision (export the type vs change the signature);
   weigh against F-16. Do not blanket-export.
3. **`fresh/streams` + `sdk/streams`** couple to Wave 4 streams — **reconcile done** (`dfab7a4`);
   the merged `@netscript/plugin-streams(-core)` surface is now in-tree and all 4 app packages
   `deno check` PASS against it. 27 `fresh` files reference sdk/streams/plugin surfaces (consumer
   scan). Lock the exact stream surface decision at the 5d-4 sub-wave plan.
4. **`@netscript/ui-primitives`** is RFC-deferred — do NOT create it.
5. **Zero-consumer rule** — grep playground/services/packages before any removal; no shims in
   alpha, but no silent playground breakage.

## Process boundaries (Harness v2)

- Generator, PLAN-EVAL, IMPL-EVAL are each a SEPARATE session. Evaluator ≠ generator.
- Supervisor does not run gates/PLAN-EVAL/IMPL-EVAL/scoring. (The pre-research dry-run + doc-lint
  sweep here was an explicit user-directed prep pass; per-sub-wave MEASURE-FIRST stays with the
  generator.)
- Never delete lock files/caches; never `deno cache --reload` without approval.
- Targeted `deno check` must pass `--unstable-kv`.
- Record every plan deviation + rename in the sub-wave `drift.md`.

## References

- Research: `research.md`; split: `split-strategy.md`.
- RFCs (test-app root): `.resources/rfcs/frontend/` (README is the map; 14 = unimplemented seams).
- Gate matrix: `.llm/harness/gates/archetype-gate-matrix.md`; archetypes `ARCHETYPE-{3,4}-*.md`.
- Canonical (stale, intent only): `…/copilot-evaluate-…/{evaluate,plan}_{sdk,service,fresh,fresh-ui}.md`.
- Supervisor: `.llm/tmp/run/feat-package-quality--supervisor/phase-registry.md` (Wave 5).
- Lessons: `.llm/harness/lessons/*`.
