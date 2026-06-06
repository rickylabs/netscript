# Drift Log — feat-package-quality-wave2-adapters--adapters

> Record every deviation from the carried-in nested per-package plans, every
> subpath/folder rename, and the OQ-1 sub-wave decision here.

## Re-baseline drift (seed)

- Carried-in authority: nested `plan_{logger,telemetry,aspire,kv,database,queue,cron}.md`
  under `…/copilot-evaluate-every-package-jsr-release--package-jsr-alpha-release/`.
  These predate the plugin-platform merge + PR #84; their slow-type / doc-lint
  counts are **stale** and are NOT carried into this run's findings.
- Reviewer seed captured **structural** state only (README/docs/tests/metadata/
  folder vocab). Dynamic gates (`deno publish --dry-run`, `deno doc --lint`) are
  marked `MEASURE-FIRST` in `research.md` and MUST be re-run as Research step 1.
- New unit vs the 2026-05 inventory: `@netscript/prisma-adapter-mysql` (post-PR #84);
  no nested `plan_prisma-adapter-mysql.md` exists — derive its plan from the A2
  archetype + STANDARDS, not a carried-in doc.

## Decisions / renames (append during plan + implement)

| Date | Item | Decision | Consumer impact |
|------|------|----------|-----------------|
| — | OQ-1 sub-wave split | (pending plan agent) | — |
