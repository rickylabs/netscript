# Context Pack — Wave 5 Apps Consolidation (resumable)

Run ID: `feat-package-quality-wave5-apps--consolidation`
Branch: `feat/package-quality-wave5-apps` (umbrella; 5a–5d already merged). HEAD `9226846`.

## What this run is
A **structural** consolidation of the four merged Wave 5 packages
(`@netscript/{service,sdk,fresh-ui,fresh}`) to the production-grade canonical doctrine layering used
by Wave 2/3 (`packages/plugin` reference). The prior cheap-agent passes made them pass
type/lint/JSR gates but left RFC-era ad-hoc folder shapes. PLAN-EVAL **waived in writing** by user.

## Plan of record
`consolidation-plan.md` (this dir). Archetype 4 for all four. Phases A(service) → B(sdk) →
C(fresh-ui) → D(fresh) → E(close). Base classes **withheld** (D1.1, doctrine A4/A5) — seams are
ports+adapters. Subpath keys stay stable for service/sdk/fresh-ui; only `fresh` surface is
rationalized (D6) with all consumers/CLI-templates/tests updated atomically.

## Key facts
- `fresh` is the long pole: no `src/`, forbidden `utils/`, `form/` 28 files, 6 over-cap files.
- `sdk`: root barrel folders duplicate `src/` feature folders; adapters scattered.
- `fresh-ui`: no `src/`, 14 root items, `registry.manifest.ts` 891 LOC (hand-authored).
- `service`: only `service-builder.ts` 604 LOC needs splitting.
- Blast radius: research.md §3 (CLI templates 13, generators 3, import-resolver, SCAFFOLD_PACKAGES,
  3 CLI tests, plugin deno.json/services, cross-package imports, root deno.json).
- **E2E (`deno task e2e:cli`) only valid from WSL native worktree** `/home/codex/repos/
  netscript-wave5-apps` — `/mnt/c` DrvFS fails (codex-wsl-remote skill). Windows = fast scoped
  `deno check` inner loop.

## Status
- [x] Bootstrap run + artifacts (research, consolidation-plan, worklog+Design, drift, commits, this).
- [x] Phase A (service) — A1 split builder (a0e5bcc), A2 docs/archetype (e67edf1). DONE.
- [ ] Phase B (sdk) — B1 adapters, B2 domain/application, B3 delete barrels + repoint exports.
- [ ] Phase C (fresh-ui) — C1 src/ wrap, C2 manifest split + A4 label.
- [ ] Phase D (fresh) — D1 utils kill, D2 builders, D3 route, D4 form, D5 streaming, D6 surface.
- [ ] Phase E — gates, WSL e2e, PR summary.

## Resume hint
Read `consolidation-plan.md` + this pack; check `commits.md` for last landed slice; continue the
next unchecked phase. Use scoped wrappers `.llm/tools/run-deno-{check,lint,fmt}.ts`.
