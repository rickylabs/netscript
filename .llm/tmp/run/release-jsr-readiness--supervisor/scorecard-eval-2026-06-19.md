# Scorecard Exit-Gate Verdict — `release/jsr-readiness` (PR #53)

**Tip:** `b19b180a` (matches PR #53 headRefOid; compared against `origin/main`)
**Evaluator:** OpenHands qwen3.7-max (separate session from supervisor/generators)
**Date:** 2026-06-19
**CI run on tip:** `27795718861` — `conclusion: success` (jobs `quality`, `deps-report`, `check-test` all green)

## VERDICT

**SCORECARD: PASS**

All dimensions A–F verified on the umbrella tip. The two prior blockers (check-test /
`: unknown` prop-types regression + fmt drift) are genuinely resolved on this tip.
Program-level exit gate is met; **publishing remains evaluator-locked** (only explicit
user dispatch may trigger E=25 OIDC + F=@netscript/cli), per the hard contract.

## Per-dimension table

| Dim | Result | Evidence |
|-----|--------|----------|
| **A1** | PASS | `deno doc --lint` on export entries (`packages/fresh-ui/{mod,interactive,primitives}`; `packages/logger/{mod,middleware,orpc}`) → "Checked 3 files", exit 0, **0 warnings/errors**. CI `check-test` green on tip (verifies A1 fix does not trade slow-types for JSX validity). Sub-run #58 evaluate.md = PASS (cycle 2, all 5 gates green). |
| **A2** | PASS | Sub-run #56 IMPL-EVAL PASS (26/26 READMEs per ledger); spot-checked `logger`, `fresh-ui`, `sdk` READMEs: structured (Install / Quick example / subpath imports), doctest-friendly, threshold met. |
| **A3** | PASS | Pages deploy run `27790127099` green; live `curl https://rickylabs.github.io/netscript/` → HTTP 200 with themed `ns-theme` anti-flash, base-prefixed nav, pagefind #search. |
| **B1** | **PASS** | `deno task publish:dry-run` exit 0, "Success Dry run complete", **0 slow types**, 25-unit canonical batch covered. ⚠️ **F-wave blind spot FLAG** (G2 follow-up #1b): this dry-run does NOT simulate `@netscript/cli` — cli's own `deno publish --dry-run` must run at F dispatch (LD-7) before publish. |
| **C1** | PASS | `.llm/tmp/init-json-smoke/` confirmed removed (`ls: cannot access`); `AGENTS-handoff.md` relocated (verified in `.agents/skills/openhands-handoff/` per chore-prod-readiness evaluate.md PASS cycle 2); dead doc-files + compat shims removed in the #54 merge. |
| **D1** | PASS | `scan-jsr-centralization.ts --fail-on-violation` wired into `deno task deps:check` → `arch:check` → CI `quality`; 0 drift on tip (exits 0 with no violation lines). |
| **D2** | PASS (+advisory) | `scan-npm-catalog-compliance.ts` wired into `deps:check` + `arch:check`; scanner exits 0 (no `--fail-on-violation` hard-fail — by design, WARN-only). WARNs present on `preact`, `style-dictionary`, `@orpc/server` subpath imports, `amqplib`, `@durable-streams/state` are advisory; CI quality passed (scanner exit 0). No inline-pin *violations*. |
| **D3** | PASS | `audit-file-link.ts --fail-on-violation` wired into `deps:check` + `arch:check`; 0 `file:`/`link:` failures on tip. |
| **D4** | PASS | `deno.json` tasks pruned to production set (`deps:*`, `check:*`, `publish:dry-run`, `fmt:check`, `arch:check`, `check:scaffold-versions`); no dead/dup tasks visible. chore-prod-readiness evaluate.md = PASS. |
| **D5** | PASS | chore-deps-hygiene evaluate.md = PASS; `check:scaffold-versions` is a thin scanner over the locked catalog; wrapper pattern preserved (deno bump-version friendly). |
| **E1** | PASS | docs-user-site sub-run plan-eval = PASS (Fitness Gates table wired: 5 rows including doc-maintenance/doc-freshness); evaluate.md = PASS. |
| **E2** | PASS | D1/D2/D3 scanners wired into CI `quality` job (verified run `27795718861` success) **and** into `deno task arch:check` (deps:check is first task in arch:check). Live-verified. |
| **F1** | PASS | `deno run --allow-env --allow-read --allow-run .llm/tools/agentic/validate-claude-surface.ts` → all 5 gates `ok:true` (CLAUDE.md @AGENTS.md, .claude/settings.json, .gitignore, sync-claude 17 skills/17 mirrors, hook lock stability). docs-internal-overhaul evaluate.md = PASS. `deno doc` documented in harness per F sub-run. |

## Sub-run ledger check

| Sub-run | Plan-eval | Evaluate |
|---------|-----------|----------|
| #54 chore/prod-readiness (C1) | present | PASS (cycle 2) |
| #55 chore/deps-hygiene (D1–D5) | present | PASS |
| #56 docs/user-site (A2/A3/E1) | PASS (6/6 items) | PASS |
| #57 A1 user-docs (docs-internal-overhaul, F1) | present | PASS |
| #58 A1 fresh-ui (prop-types) | present | PASS (cycle 2, 5 gates) |

No open `FAIL_*`; no unresolved `architectural` drift at tip.

## Notes & advisory flags (non-blocking)

1. **D2 npm-catalog WARNs** — advisory only. 24 WARNs on subpath-import syntax
   (`npm:preact@^10.29.2/hooks` vs catalog base `^10.29.2`), `style-dictionary` not in
   catalog, `amqplib@^0.10.3` vs catalog `^2.0.1` divergence, etc. Scanner exits 0 and
   CI `quality` green. The WARNs flag where the catalog law could be tightened
   further but do not constitute publish blockers. Recommended post-merge cleanup.
2. **AP-19 / AP-23 / A13 / A14 advisories from `arch:check`** — `export default`
   (JSR penalises) + `any` in exports + Deno.exit outside bin + Jest-globals in CLI
   template tests. These are doctrine advisories, not hard-fail gates. They don't
   block the program-level exit because `arch:check` exits 0 on tip. CLI test files
   are in `@netscript/cli` (F-wave unit; not batch-E published).
3. **A1 doc-lint scope** — `deno doc --lint` run on package **roots** (e.g.
   `deno doc --lint packages/fresh-ui` without specifying exports) surfaces
   `missing-jsdoc` errors from non-export internals. The A1 gate is correctly scoped
   to each unit's **export map entries**; on those entries the lint is clean. This is
   consistent with the prior A1 fix's IMPL-EVAL (cycle 2) and the scorecard
   parenthetical "(full-export sweep, not root-only — per the Wave 2/4 merged-barrel
   lesson)."

## Contract adherence

- ✅ Did NOT publish to JSR.
- ✅ Did NOT merge PR #53.
- ✅ Did NOT edit `packages/`, `plugins/`, version pins, catalog, scaffold-versions,
  `aspire/src/public/mod.ts`, or lock files.
- ✅ Did NOT run `deno cache --reload`.
- ✅ Verification was read-only + the named gate commands.
- ⚠️ The evaluator session owns this verdict and it is recorded here and committed
  to the umbrella branch.

## Recommended next step

On explicit user dispatch, run the publish sequence (`publish E` then `publish F`):
1. **E batch (25 non-CLI unit)**: OIDC publish at `0.0.1-alpha.0` via `deno task publish:dry-run` → real.
2. **F batch (@netscript/cli)**: first run cli's own `deno publish --dry-run` to
   close the F-wave blind spot, then OIDC publish last (LD-7).
3. `@netscript/cli-e2e` (`publish:false`) NEVER published — verified in the census.
