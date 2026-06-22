# PR-A research — JSR-readiness umbrella disposition (re-baselined vs current main)

Merge-base `cc3b8731` (2026-06-18). Umbrella tip `eebeb5a6` (+135). Main tip `9c229624` (+233).
Method: each umbrella source file's pre-image blob compared to main's blob; base==main ⇒ the umbrella
change re-applies with zero conflict. Read-only git inspection only.

## Why this is a fresh re-land, not a branch merge
`release/jsr-readiness` carries 135 commits since the base; the bulk are run-trace bookkeeping and
the OLD Lume docs site (superseded by docs-v4 already on main via #110). Merging the branch whole
would drag bookkeeping + a stale docs tree + breaking removals onto main at once. Per the locked
decision we cut a fresh branch off current main and re-apply ONLY the valid set, split into a
non-breaking PR-A (this run) and a breaking PR-B (follow-up after a consumer-check).

## Valid set classification (additive half = PR-A)
- **deps-hygiene tooling** — VALID-NEW; main has only audit/latest/outdated/prod-install/why. Adds:
  `.llm/tools/deps/{census,scan-npm-catalog-compliance,scan-jsr-centralization,audit-file-link,bump-version(+_test),workspace}.ts`
  + doc/readme checkers `check-internal-doc-links.ts`, `check-readme-standard.ts`.
- **deno.json tasks** — new block added in an untouched region (VALID-CLEAN); `ci:quality +=
  deps:check` clean (main==base). `arch:check` is CONFLICT (main rewrote to per-auth-package
  multi-root + `arch:check:repo`) → prepend `deps:check &&`, don't clobber. D-5 prunes a stale Fresh
  dry-run task alias.
- **READMEs (US-9 template)** — 21 package/plugin + 2 internal are VALID-CLEAN (main==base). 6
  DRIFTED on main (auth/sagas/idempotency work): `plugin-sagas-core`, `plugin-workers-core`, `queue`,
  `service`, `plugins/sagas`, `plugins/workers` → re-apply the US-9 structure by hand over main's
  content.
- **fresh-ui doc-lint fixes** (~15 files, base==main) — restore interactive JSX prop surface, add
  `_internal/public-props.ts`, clear `no-explicit-any`/private-type-ref. + `packages/fresh/deno.json`.
- **doctrine/skill docs** (base==main) — AGENTS/CLAUDE/CONTRIBUTING/AGENTS-handoff, doctrine 01/04,
  jsr-audit + netscript-harness SKILL.md. `openhands-handoff/SKILL.md` drifted → by hand. Regenerate
  `.claude/skills/` mirrors from `.agents/skills/`.

## Deferred / dropped
- DEFER to PR-B (breaking): G1-2 compat shims, G1-3a db conn-string alias, G1-3b MSSQL JSON alias,
  G1-3c MSSQL integrated auth, G1-4 Fresh deprecated options, G1-5 workers `schedule()` recurring API.
  All source pre-images are byte-identical to main ⇒ zero-conflict re-apply, but they change the
  public surface and need a main-consumer check first.
- DROP: old `docs/site/**`, all `.llm/tmp/run/**` bookkeeping, G1-6 (proof-only), optional G1-1.
- DEFER (separate): `.github/workflows/pages.yml` (needs rebaseline to docs-v4; Pages deploys from
  `docs/user-site` today).

## CI drift notes
- `define-fresh-app.ts` fmt drift belongs to PR-B (G1-4), not PR-A.
- README `Property 'users'` type-fence error already resolved at umbrella tip; re-verify only the 6
  hand-reconciled READMEs.

Provenance: full disposition + per-item classification produced by a read-only git research pass on
2026-06-22; the umbrella's G1/G2 work already carried IMPL-EVAL PASS + scorecard-eval PASS on
`release/jsr-readiness`, but the re-baseline reconciles (arch:check, 6 READMEs, openhands-handoff
SKILL) are new vs current main and are the focus of this run's evaluation.
