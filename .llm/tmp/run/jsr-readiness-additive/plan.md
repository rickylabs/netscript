# PR-A — JSR-readiness ADDITIVE valid set (plan.md)

Run-id: `jsr-readiness-additive`. Branch: `chore/jsr-readiness-additive` (off current `origin/main`).
Scope decision LOCKED by user (2026-06-22): split program; this PR-A is the **non-breaking** half.
PR-B (breaking prod-readiness removals) follows after a consumer-check against main.

## Goal
Promote the additive, non-breaking JSR-readiness improvements from `release/jsr-readiness` onto a
fresh branch off current `main`, dragging ONLY the valid set (re-baselined; old docs site +
run-trace bookkeeping dropped). This advances JSR readiness without changing any public API surface.

## In scope (the additive valid set)
1. **deps-hygiene tooling** (VALID-NEW; main lacks all): `.llm/tools/deps/census.ts`,
   `scan-npm-catalog-compliance.ts`, `scan-jsr-centralization.ts`, `audit-file-link.ts`,
   `bump-version.ts` (+ `_test.ts`), `workspace.ts`; plus doc/readme checkers
   `.llm/tools/docs/check-internal-doc-links.ts` and `check-readme-standard.ts` (verify exact paths
   on the umbrella tip).
2. **deno.json task wiring** (additions in untouched regions): `deps:census`, `deps:check`,
   `deps:check:*`, `deps:audit:file-link`, `deps:version:bump*`, `deps:docs:*`; and
   `ci:quality += deps:check` (main's `ci:quality` == base, clean).
3. **arch:check reconcile** (CONFLICT — main rewrote it to per-auth-package multi-root + added
   `arch:check:repo`): prepend `deps:check &&` to main's CURRENT `arch:check` without clobbering the
   multi-root wiring. Fold in D-5 (prune the stale Fresh dry-run task alias if still present on main).
4. **READMEs (US-9 template)**: 21 VALID-CLEAN package/plugin READMEs + 2 internal
   (`.llm/harness/README.md`, `.llm/tools/README.md`) re-applied byte-clean; 6 DRIFTED READMEs
   (`packages/plugin-sagas-core`, `packages/plugin-workers-core`, `packages/queue`,
   `packages/service`, `plugins/sagas`, `plugins/workers`) re-applied BY HAND over main's current
   content (preserve main's substantive changes; apply only the US-9 structural template).
5. **fresh-ui JSX/doc-lint fixes** (~15 files, base==main, clean): `interactive.ts`,
   `_internal/public-props.ts` (new), and the `.tsx`/`.types.ts` for accordion/dialog/drawer/
   popover/sheet/tabs/tooltip; plus `packages/fresh/deno.json`. Restores interactive JSX prop
   surface + clears `no-explicit-any`/private-type-ref doc-lint.
6. **doctrine/skill docs** (base==main, clean): `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`,
   `AGENTS-handoff.md` (G1-0 relocated OpenHands handoff protocol), doctrine `01-thesis-and-axioms.md`
   + `04-modules-and-helpers.md`, `.agents/skills/jsr-audit/SKILL.md` +
   `netscript-harness/SKILL.md`. `.agents/skills/openhands-handoff/SKILL.md` re-applied by hand
   (main drifted). Regenerate `.claude/skills/` from `.agents/skills/` (do not hand-edit mirrors).

## Out of scope (dropped / deferred)
- **DROP**: all umbrella `docs/site/**` (old Lume site + 22 ref pages — superseded by docs-v4 on
  main); all `.llm/tmp/run/**` + `commits.md`/`worklog.md`/`drift.md` bookkeeping; G1-6 (proof-only);
  G1-1 tracked-scratch deletions (optional hygiene only).
- **DEFER to PR-B**: every breaking prod-readiness removal (G1-2/3a/3b/3c/4/5).
- **DEFER (separate)**: `.github/workflows/pages.yml` — needs rebaseline to the docs-v4 build; Pages
  already deploys fine from `docs/user-site`; not part of JSR readiness.

## Gates
- `deno task check` (with `--unstable-kv` where workspace code is touched) — must be green.
- `deno task lint` — green (the fresh-ui fixes specifically target doc-lint).
- `deno task fmt:check` scoped to touched source (`--ext ts,tsx`) via `.llm/tools/run-deno-fmt.ts`.
- `deno task deps:check` (the newly-wired scanners) — must pass on the branch itself.
- `deno task arch:check` — green after the reconcile.
- README doc-lint via `check-readme-standard.ts` — green for all touched READMEs (and type-check any
  TypeScript fences: the prior `Property 'users'` error was already fixed at umbrella tip; re-verify
  the 6 hand-reconciled READMEs).
- NOT required for PR-A: full `scaffold.runtime` e2e (no scaffold/DB/Aspire surface touched) — but CI
  on the PR will run it anyway; expect green.

## Commit slices (each commits + pushes + appends commits.md)
- S1: deps-hygiene tools (`.llm/tools/deps/**` + 2 doc/readme checkers) — net-new files.
- S2: deno.json task block + `ci:quality += deps:check`; arch:check reconcile; D-5 prune.
- S3: 21+2 byte-clean READMEs.
- S4: 6 drifted READMEs re-applied by hand.
- S5: fresh-ui doc-lint fixes + `packages/fresh/deno.json`.
- S6: doctrine/skill docs + regenerate `.claude/skills/`.

## Zero-cast invariant
Only the 2 accepted casts allowed (centralized contract `as unknown as`, top-level router `any`).
The fresh-ui fixes clear `no-explicit-any` — they must NOT introduce new casts.

## Lock hygiene
Do NOT churn root `deno.lock`; do NOT `deno cache --reload`. New `.llm/tools/deps/*` scripts use std
imports already in the graph where possible; if a genuinely new import is required, record it and
get approval before lock changes.

## Archetype + surface
Mixed, non-API-changing. Touched surfaces: repo tooling (`.llm/tools/deps/**`, doc/readme checkers)
— no published surface; `deno.json` task graph — no published surface; package/plugin READMEs —
docs only; `@netscript/fresh-ui` — restores/clarifies the EXISTING interactive JSX prop surface
(net export additions of already-intended types, no removals). Closest archetype overlay:
`SCOPE-docs` (READMEs/doctrine) + tooling; ARCHETYPE for fresh-ui is the UI package archetype but
PR-A makes no breaking export change. **No public API is removed or renamed in PR-A** (all removals
are deferred to PR-B).

## Open-decision sweep
- Pages workflow (`pages.yml`): DEFERRED — safe to defer (Pages deploys from `docs/user-site` today;
  no rework, it's an independent follow-up requiring a docs-v4 rebaseline).
- 6 drifted READMEs reconcile strategy: RESOLVED NOW — apply only the US-9 structural template over
  main's current content, preserving main's substantive changes (deferring would force a re-do).
- `arch:check` reconcile shape: RESOLVED NOW — prepend `deps:check &&` to main's current multi-root
  `arch:check`; do not clobber `arch:check:repo` or per-auth-package wiring.
- Whether fresh-ui export additions could collide with main's auth-era fresh-ui changes: must be
  verified at impl time per-file (base==main was confirmed in research, so low risk) — not a
  deferral that forces rework.
- No open decision would force rework if deferred.

## Risk register
- **R1 fresh-ui export surface drift** — main may have touched fresh-ui since research. Mitigation:
  re-confirm base==main per file before applying; if drifted, hand-reconcile like the 6 READMEs.
- **R2 deno.json merge** — task block must land in an untouched region; `arch:check` is a CONFLICT.
  Mitigation: targeted edit, then `deno task arch:check` + `deps:check` must be green on the branch.
- **R3 lock churn** — new `.llm/tools/deps/*` imports could touch `deno.lock`. Mitigation: prefer
  std imports already in the graph; if a new import is unavoidable, record it and get approval before
  committing a lock change.
- **R4 README type-fence** — the historical `Property 'users'` error. Mitigation: type-check every
  touched README's TS fences; already resolved at umbrella tip, re-verify the 6 hand-reconciled ones.
- **R5 doc-lint regressions** — the fresh-ui fixes target `no-explicit-any`/private-type-ref; verify
  `deno task lint` is green and no NEW casts were introduced (zero-cast invariant).

## Gate set (from archetype-gate-matrix + overlays)
`deno task check` (+`--unstable-kv` for workspace code), `deno task lint`, scoped `fmt:check`
(`--ext ts,tsx` via `.llm/tools/run-deno-fmt.ts`), `deno task deps:check`, `deno task arch:check`,
README doc-lint (`check-readme-standard.ts`). `SCOPE-docs` overlay for the README/doctrine slices.
Full `scaffold.runtime` e2e is NOT a required PR-A gate (no scaffold/DB/Aspire surface touched) but
CI runs it anyway and is expected green.

## jsr-audit rubric (applied to PLANNED surface)
PR-A changes **no published surface**: tooling and `deno.json` tasks are not exported; READMEs are
docs; the fresh-ui export additions are already-intended public types (clearing private-type-ref
doc-lint = a publishability IMPROVEMENT, not a slow-type risk). No new slow-type / `any` surface is
introduced (zero-cast invariant enforced). The breaking publish-surface reductions (removing compat
shims / deprecated options) that materially change the JSR surface are all in **PR-B**, where the
rubric will be applied to the removed symbols. PR-A is therefore jsr-audit-neutral-to-positive.

## Evaluator
PLAN-EVAL: OpenHands minimax-M3 (separate session), before any impl slice. IMPL-EVAL: OpenHands
qwen3.7-max (separate session), after impl. Generator: WSL Codex daemon-attached (mobile-visible).
