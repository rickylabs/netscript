# JSR-Readiness Scorecard — umbrella exit gate (`release/jsr-readiness`)

**This is the umbrella exit gate.** Publishing (program steps E + F) is blocked until
**every dimension below PASSES**. The verdict is **evaluator-owned** (a separate
OpenHands session — never self-graded by the supervisor or any generator). Each of the
four sub-runs *additionally* passes its own PLAN-EVAL and IMPL-EVAL; the scorecard is the
final program-level gate that confirms the sub-runs together produced a publishable repo.

> Denominator note (reconciled 2026-06-18 to the locked census — US-5 + G2 eval follow-up #1):
> **27 members declare `name`+`exports`**; the canonical `deno task publish:dry-run` simulates
> **25**. The real **publish denominator = 26** = **batch E = 25 non-CLI** (OIDC, `0.0.1-alpha.0`)
> + **batch F = `@netscript/cli`** (last, LD-7). **`@netscript/cli-e2e` (`publish:false`) is NEVER
> published** and is excluded. Reference-doc depth is per unit *class* (library packages/plugins get
> full reference; `examples/`/`apps/` get appropriate-level docs). Per-dimension denominator pinned
> in `docs/user-site` research/plan. (Prior text said "E = 26 non-CLI / all 27" — stale; superseded.)

## Dimensions

### A — User reference & onboarding docs (`docs/user-site`)
- [ ] **A1** Every library package/plugin has reference docs meeting the standardized
      template, and `deno doc --lint` is **0 warnings** for that unit (full-export sweep,
      not root-only — per the Wave 2/4 merged-barrel lesson).
- [ ] **A2** Every such unit's **README** meets the standard (structure + threshold +
      doctested examples that compile).
- [ ] **A3** A **conceptual onboarding** doc set exists and covers the ecosystem
      (Diátaxis: tutorial + explanation + how-to recipes), built with **Lume → GitHub
      Pages** and deploying green.

### B — Publishability (carried from S1; must not regress)
- [ ] **B1** `deno task publish:dry-run` passes with **0 slow types** for the canonical
      **25-unit** simulation on the umbrella branch (already green on `main` — the umbrella must
      hold it). NOTE the F-wave blind spot (G2 eval follow-up #1b): the batch dry-run does not
      emit a `@netscript/cli` simulation, so the **F dispatch must run cli's own
      `deno publish --dry-run`** before the real publish.

### C — Repo cleanliness (`chore/prod-readiness`)
- [ ] **C1** **Zero** dead code, temp/garbage/build cruft, and stray root files; **all**
      backward-compat shims/aliases removed (functional workarounds excluded); `AGENTS-handoff.md`
      relocated into the `openhands-handoff` skill and the root file deleted; dead doc
      *files* deleted. No doc *content* rewrites (owned by the docs sub-runs).

### D — Dependency hygiene & catalog law (`chore/deps-hygiene`)
- [ ] **D1** **0 JSR-version drift** across members: the JSR-dep centralization **scanner**
      is green (any `jsr:` dep used by >1 member must agree on version) and wired into the
      CI quality job **and** `arch:check`.
- [ ] **D2** **0 inline-npm-pin violations** of the catalog law: the npm catalog-compliance
      **scanner** is green (any `npm:` dep used by >1 member, or not bound to a single
      member, must be a `catalog:` ref) and wired into CI + `arch:check`.
- [ ] **D3** **0 `file:`/`link:` specifiers** in any publishable unit (audit green, wired in).
- [ ] **D4** `deno task` set pruned to production-grade tasks only (no dead/dup tasks).
- [ ] **D5** Version-bump tooling is a **thin wrapper over `deno bump-version`**
      (Conventional-Commit-derived), replacing the bespoke internal bump tool, preserving
      structured output.

### E — Durability (harness integration; docs + deps shape can't rot)
- [ ] **E1** A **doc-maintenance gate** + **doc-freshness fitness gate** are wired into the
      harness gate set so docs cannot silently rot.
- [ ] **E2** The D1/D2 scanners + D3 audit are wired into the **quality job + `arch:check`**
      so the dependency shape self-enforces as new deps land.

### F — Internal/contributor docs (`docs/internal-overhaul`)
- [ ] **F1** Internal docs (harness, doctrine, `.llm/` architecture, `AGENTS.md`/`CLAUDE.md`
      surface, root ops docs) consolidated, de-duplicated, prod-ready; `deno doc` documented
      properly in the harness + `jsr-audit` skills; `validate-claude-surface.ts` green.

## Exit rule

- All A–F boxes checked, each with **evaluator-verified** evidence (raw command output,
  not a generator's self-report).
- Every sub-run shows `plan-eval.md = PASS` **and** `evaluate.md = PASS`.
- No unresolved `architectural` drift; no open `FAIL_*` verdict.

Only then is publishing (E = **25** non-CLI via OIDC at `0.0.1-alpha.0`, then F = `@netscript/cli`
last) unblocked — and only on **explicit user dispatch** (publishing is permanent/outward).
