use harness

# IMPL — JSR-readiness additive valid set (PR-A, 6 slices)

You are the WSL Codex **implementation generator** for PR-A of the JSR-readiness umbrella promotion.
PLAN-EVAL PASSED (OpenHands minimax-M3, run 27978098382). Implement the 6 additive, **non-breaking**
slices below onto branch `chore/jsr-readiness-additive`. Commit + push + comment per slice. Do NOT
implement any breaking prod-readiness removal (those are deferred to PR-B).

## Ground truth
- Work branch: `chore/jsr-readiness-additive` (off current `origin/main`). NO upstream — push only
  via explicit refspec `git push origin HEAD:refs/heads/chore/jsr-readiness-additive`.
- Source of the umbrella file contents: `origin/release/jsr-readiness` (tip `eebeb5a6`). For every
  VALID-CLEAN file the umbrella version applies onto main with zero conflict (base==main verified),
  so `git checkout origin/release/jsr-readiness -- <path>` is the correct way to bring each in.
- Read `.llm/tmp/run/jsr-readiness-additive/research.md`, `plan.md`, and `plan-eval.md` (esp. §G
  gate-mapping and the 3 non-blocking notes) BEFORE starting.

## PLAN-EVAL notes you MUST honor
- **(C) Checker path:** the two doc/readme checkers live at `.llm/tools/check-internal-doc-links.ts`
  and `.llm/tools/check-readme-standard.ts` (ROOT of `.llm/tools/`), NOT under `.llm/tools/docs/`.
  Bring them in at the root path the umbrella's `deno.json` task wiring expects. Verify with
  `git ls-tree origin/release/jsr-readiness -- .llm/tools/` before checkout.
- **(H) Do NOT touch main's docs-v4 checkers:** `.llm/tools/docs/check-caveat-refs.ts` and
  `.llm/tools/docs/check-internal-links.ts` were added by docs-v4 (#110) AFTER the umbrella tip.
  They are NOT in the umbrella. Do not delete, move, or overwrite them.
- Gate-mapping: see `plan-eval.md` §G for the per-slice proving gate.

## Slices (commit + push + PR comment + append commits.md after EACH)
- **S1 — deps-hygiene tools.** `git checkout origin/release/jsr-readiness --` the net-new files:
  `.llm/tools/deps/{census,scan-npm-catalog-compliance,scan-jsr-centralization,audit-file-link,bump-version,bump-version_test,workspace}.ts`
  + the 2 root checkers from note (C). Gate: `deno task check` on the new tool files (with
  `--unstable-kv` if they import workspace code). Prove they parse/type-check.
- **S2 — deno.json task wiring + arch:check reconcile.** Add the umbrella's new task block
  (`deps:census`, `deps:check`, `deps:check:*`, `deps:audit:file-link`, `deps:version:bump*`,
  `deps:docs:*`) and `ci:quality += deps:check` into main's CURRENT `deno.json` in untouched regions.
  `arch:check` is a CONFLICT: main rewrote it to a per-auth-package multi-root form + `arch:check:repo`
  — PREPEND `deps:check &&` to main's current `arch:check` value WITHOUT clobbering the multi-root
  wiring or `arch:check:repo`. Fold in D-5 (prune the stale Fresh dry-run task alias if still present
  on main). Gate: `deno task deps:check` AND `deno task arch:check` must be green on the branch.
- **S3 — byte-clean READMEs.** `git checkout origin/release/jsr-readiness --` the 21 VALID-CLEAN
  package/plugin READMEs + 2 internal (`.llm/harness/README.md`, `.llm/tools/README.md`). These are
  base==main so they apply clean. Gate: `deno run ... .llm/tools/check-readme-standard.ts` green;
  type-check any TS fences.
- **S4 — drifted READMEs (BY HAND).** For the 6 DRIFTED READMEs — `packages/plugin-sagas-core`,
  `packages/plugin-workers-core`, `packages/queue`, `packages/service`, `plugins/sagas`,
  `plugins/workers` — do NOT clobber main's content. Apply ONLY the US-9 structural template
  (headings/sections/ordering) over main's CURRENT content, preserving main's substantive auth/sagas/
  idempotency changes. Gate: `check-readme-standard.ts` green + type-check TS fences (the historical
  `Property 'users'` error — verify these 6 specifically).
- **S5 — fresh-ui doc-lint fixes.** `git checkout origin/release/jsr-readiness --` the ~15 fresh-ui
  files (base==main): `interactive.ts`, `_internal/public-props.ts` (new), and the `.tsx`/`.types.ts`
  for accordion/dialog/drawer/popover/sheet/tabs/tooltip; plus `packages/fresh/deno.json`. These
  restore the interactive JSX prop surface + clear `no-explicit-any`/private-type-ref. Re-confirm
  base==main per file first (`git diff origin/main origin/release/jsr-readiness -- <path>` reasoning);
  if any file drifted on main, hand-reconcile. Gate: `deno task lint` green + `deno task check`
  (`--unstable-kv`). ZERO new casts (only the 2 accepted casts repo-wide).
- **S6 — doctrine/skill docs + regen mirrors.** `git checkout origin/release/jsr-readiness --` the
  base==main docs: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `AGENTS-handoff.md`, doctrine
  `docs/architecture/doctrine/01-thesis-and-axioms.md` + `04-modules-and-helpers.md`,
  `.agents/skills/jsr-audit/SKILL.md` + `.agents/skills/netscript-harness/SKILL.md`. The
  `.agents/skills/openhands-handoff/SKILL.md` DRIFTED on main → re-apply the umbrella's structural
  change BY HAND over main's content. Then REGENERATE `.claude/skills/` from `.agents/skills/` via
  `.llm/tools/agentic/sync-claude-skills.ts` (do NOT hand-edit the mirrors). Gate: `validate-claude-surface.ts`
  + `deno task fmt:check` scoped to touched files.

## Final gate (before reporting done)
Run on the branch: `deno task check` (+`--unstable-kv`), `deno task lint`, scoped `fmt:check`
(`--ext ts,tsx` via `.llm/tools/run-deno-fmt.ts`), `deno task deps:check`, `deno task arch:check`,
README doc-lint. Record results in `.llm/tmp/run/jsr-readiness-additive/worklog.md`. Append every
commit to `commits.md`. Then comment a final summary on PR #111 (commit shas + gate results).

## Hard rules
- NO breaking removals (no compat shims removed, no MSSQL/Fresh/workers API removals — those are PR-B).
- Do NOT churn root `deno.lock`; do NOT `deno cache --reload`. If a new import forces a lock change,
  STOP and record it in `worklog.md`/`drift.md` for approval.
- Zero-cast invariant: only the 2 accepted casts repo-wide; the fresh-ui fixes must remove `any`,
  not add casts.
- Push only via explicit refspec `HEAD:refs/heads/chore/jsr-readiness-additive` (NO upstream by design).
- Use `git -C <abspath>` for all git in WSL.

## SKILL
Activate and follow these repo skills before and during implementation (read
`.agents/skills/<name>/SKILL.md` directly if no `.claude/skills/<name>/` mirror exists). Be generous:
- `netscript-harness` — run loop, commit-per-slice contract, run artifacts, gate matrix, evaluator separation.
- `netscript-deno-toolchain` — `deno task`, `deno doc`/`deno why`, the `.llm/tools/deps/` wrappers and their gotchas.
- `netscript-tools` — repo tooling, scoped check/lint/fmt wrappers, raw git verification, lock-hygiene decisions.
- `netscript-doctrine` — package/plugin public-surface rules (fresh-ui exports, README scope, doctrine 01/04).
- `jsr-audit` — publishability rubric; confirm no new slow-type/`any` surface in the fresh-ui fixes.
- `netscript-cli` — only if a touched README/task references CLI/scaffold behavior.
- `rtk` — prefix read-heavy `git`/`grep`/`ls` to cut output tokens.

If a named skill does not exist, note it and proceed — do not block.
