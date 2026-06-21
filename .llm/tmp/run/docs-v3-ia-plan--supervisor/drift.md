# Drift log — docs-v3-ia-plan--supervisor

Append-only. Records divergence between plan/intent and reality, and material plan changes.

## 2026-06-21 · baseline confirmation (no drift)
- Plan baselined to `origin/main` @ `5f273355`. Re-verified the auth program (`plugins/auth`,
  `packages/{auth-better-auth,auth-kv-oauth,auth-workos,plugin-auth-core}`, `#103` AS8) is shipped, so
  the first gap agent's "auth packages do not exist" finding was a stale-worktree false positive and is
  discarded. See `research.md` §2.

## 2026-06-21 · adversarial hardening panel (severity: significant)
- The unoriented WSL Codex panel (commit `1cbe1875`, `codex-panel-findings.md`) returned **"not ready to
  drive a production-grade build"**: 3 blockers, 6 majors, 1 minor.
- The OpenHands minimax-M3 PLAN-EVAL run (comment 4762333961) **crashed** before rendering a verdict
  ("Agent failed … workflow failure, not a task verdict", run 27907934927). No PASS/FAIL_PLAN was
  produced; it must be re-dispatched after this hardening pass.
- **Resolution:** the plan was an intent document, not an executable IA contract. This hardening pass
  closes the panel's punch list before re-running PLAN-EVAL. Changes folded in:
  - B1 → added mandatory harness artifacts (`worklog.md` w/ `## Design`, `drift.md`, `commits.md`), an
    explicit open-decision sweep, and converted WS1–WS8 into ordered commit slices (≤30) with touched-file
    sets and proving gates. (`plan.md` §3a/§4 + this file + `worklog.md`)
  - B2 → added `surface-inventory.md`: complete export-map of every `@netscript/*` package/plugin with each
    public subpath classified (narrative / how-to / explanation / generated-reference-only / testing-only /
    deferred-with-debt). WS3 acceptance now binds to that matrix.
  - B3 → added `tutorial-proof-plans.md`: Tracks B (auth/workspace) and C (ERP/polyglot) are NOT
    playground-grounded (the showcase has no user-auth and no demonstrated non-TS tasks). Each track now has
    an explicit grounding source + a pre-authoring proof gate (scaffold command, APIs, smoke check) that must
    pass before any prose is authored.
  - M4 → locked the open foundation decisions (diagram render mode, xref surface + key namespace, Pagefind
    index scope, version UI) in the open-decision sweep.
  - M5 → replaced slogan gates with an executable gate table (exact commands, roots, expected outputs, owner)
    plus a deterministic leakage-scanner spec (pattern set + allowlist) and the SCOPE-docs overlay gates.
  - M6 → added `hub-content-contracts.md`: per-capability content contracts for the 8 complex hubs.
  - M7 → decided `archetype` is internal contributor doctrine; removed from public IA/glossary/tutorial
    vocabulary entirely (not relabeled). `explanation/plugin-system` no longer frames archetypes publicly.
  - M8 → `marketplace publish|search` documented as alpha/stub (status badge + current "coming soon"
    behavior), excluded from the "full CLI surface" claim; CLI smoke check captures actual output.
  - M9 → deployment scope split: first build run documents local + Aspire-orchestrated deploy (with an exact
    env/secrets/migration/health contract); full cloud-production deployment is deferred to debt, tracks no
    longer claim cloud-prod.
  - m10 → added a reproducibility section (exact `docs/user-site` ref, checkout path, scan commands,
    `reference/**` exclusion) so reviewers can reproduce the leakage/diagram/gap counts.
