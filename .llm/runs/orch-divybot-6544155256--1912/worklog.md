# Worklog

## Design

1. Public surface: opt-in generated-surface-only production workflow dispatch, exact published-version input, four JSON parity checks with exit codes.
2. Domain vocabulary: current (clean parity), drift (hostile byte change), generated output, authored input.
3. Ports: published JSR CLI via Deno.Command; filesystem byte mutation; GitHub Actions Windows runner.
4. Constants: approved CLI version input, current/0, drift/1, plugins and aspire generators, fixed scaffold fixture name.
5. Commit slices: bootstrap run artifacts (read-only research); shared smoke script and workflow (Linux smoke + scoped gates); Windows evidence and evaluator handoff (Windows dispatch + independent IMPL-EVAL). Files are limited to supervisor.md's allowed surface.
6. Deferred scope: no product code, extra hostile variants, full release qualification, labels/milestones, merges or tags.
7. Contributor path: `.github/scripts/check-published-generated-surface.ts` describes and executes the complete scenario.

## Bootstrap

Matrix resolved with --tier straightforward --json. Owner's Claude evaluator model/effort override and medium implementation effort recorded in supervisor.md. PLAN-EVAL: N/A, bounded CI evidence task with explicit acceptance and no architecture decisions. Prior run memory consulted. RTK unavailable.

Reconcile: coordinator's missing box is still open; existing merged implementation PRs do not supply this evidence. Explicit operator no-closure/no-taxonomy rules override generic templates.
