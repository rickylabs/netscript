# Worklog

## Design

1. Public surface: supported `init --db none`, `plugin install --no-db`, generate/doctor, and an opt-in maintainer consumer acceptance command. Existing saga selectors remain authoritative.
2. Vocabulary: KV-only means no DB requirement, env, bootstrap or Prisma model; canonical saga state, query projection and replay are distinct.
3. Ports: existing CLI process boundary, filesystem, Aspire CLI and HTTP endpoints; no new framework port.
4. Constants: installed plugin list and exact logical resource names; existing CLI/runtime constants where accessible.
5. Commit slices: S0 run bootstrap/PLAN-EVAL; S1 consumer fixture/test and scoped defects; S2 runtime evidence/docs/evaluation. File/gate map is in plan.md.
6. Deferred: new CI matrix tier and release/merge; full scaffold.runtime delegated to CI as owner requires.
7. Contributor path: `packages/cli/e2e/fixtures/kv-only/README.md` explains rerunning and extending acceptance.

## Routing override

Owner grant verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”

## Intake

Main baseline verified; earlier PRs deliver partial contracts, not remaining clean-consumer proof. No profiles/ files read. No code implementation begun.

PLAN-EVAL round 1: FAIL_PLAN (proof entrypoint/method, generated-project check/lint, explicit negative controls unspecified). Expanded plan with exact files/commands/workflow reads/detached method and acceptance evidence table. No implementation begun.

## S1 implementation findings

PLAN-EVAL round 2 PASS before implementation (plan-eval-round2.md). Draft PR #2535 opened at bootstrap.
Consumer install/generate/doctor succeeds once the declared streams dependency is included. A DB-free generated project exposes lint failures in empty services/tools helpers and unused database-target parameters; fix those generator paths without suppressions. Workers registry emits unused variant factories; emit only factories actually called. Browser BFF uses an inline std cookie specifier rejected by consumer lint; move that dependency into the consumer import map while preserving authored aliases. These are demonstrated scaffold defects within the capstone acceptance path. Consumer regression authors actual definitions before generated quality; initial empty registry generation/doctor is separately asserted.

Main integrated by merge at c5c3ef3cbd0a534ddc245f9703b5ef527368fe7f (origin/main da815164373a4cf7c24ea2097573440f34e4f98b). The generated asset conflict was resolved by canonical regeneration, preserving main's source changes. No pushed history rewritten.
Additional consumer defect: local service exports were ignored by appsettings; doctor fetched JSR and runtime launched the published release. Local install now selects the real ./services export, and runtime manifest discovery derives its package identity from the local deno metadata. Public versioned JSR behavior is preserved. The consumer asserts every API entrypoint is a real absolute source file.
Local gates: consumer + service/infrastructure generator regressions 65 PASS; local install/runtime registry generation tests 35 PASS; prior focused helpers/browser-auth/workers/saga regressions 98 PASS. Negative source copies: store env ignored, projection selector ignored and duplicate protection removed each pristine exit 0 / mutation exit 1 with one semantic failure; original source never mutated.

S1 independent supervisor review PASS: slice-review.md. The clean consumer proof also completed (runtime-proof.json): 11 runnable resources Running/Healthy, background readiness PASS, 2 completed proof jobs, exact trigger event completed, saga count/version 3 after duplicate/barrier replay and a separately started direct runner; final health rechecked and scoped cleanup PASS. No database env/resources/models. BrowserLogs is an on-demand diagnostic session, excluded from runnable application health. Auth receives the same public test key used by existing auth probes through process environment; no credential literals in generated metadata. External OAuth login is not claimed.
The detached runner initially omitted the optional streams endpoint and logged the existing nonfatal stream-projection warning; KV canonical state and instance projection remained proven. No streams hydration/replay claim is made for that process.
S1 reconcile: main merge retained; only scope-owned changes staged; no deno.lock delta. PR remains draft for documentation and final exact-head evaluation. The full scaffold.runtime CI verdict is still required and not run locally.

## S2 documentation / acceptance

Added the clean KV-only recipe to add-a-plugin.md: init --db none --cache false; required streams dependency; each --no-db --no-samples install; kv-oauth; generate/doctor; auth environment prerequisite; real child readiness and shared saga store/projection configuration. The old separate-release-acceptance note was already absent on main. Canonical docs generation updated only the add-a-plugin page in the MCP-owned compressed prose carrier after the main merge.
Docs source-format, accuracy (214 pages / 111 direct commands), links (0 broken links/anchors/orphans), and MCP export corpus freshness passed. Workers JSR audit exited 0 with dry-run OK and the existing warnings noted in jsr-audit.md. PR thread gate PASS: 0 current unanswered threads. Full scaffold.runtime remains CI-only and unproven here by owner instruction; no new CI tier was added. Smallest proposed CI follow-up: a KV/no-db variant reusing this fixture's install/readiness/workflow checks, omitting SQL provisioning gates, rather than weakening the PostgreSQL/SQLite suites.

IMPL-EVAL round 1 PASS (evaluate-round1.md), including independent S2 sign-off. Reviewer independently corroborated retained consumer configuration/receipt and complete source/doc delta. Required readiness actions: commit S2 then rerun check:assets-barrel (its prior exit1 was solely the intended uncommitted prose carrier), rewrite the PR body, and perform final exact-pushed-head evaluation after ready. The generic shared service context also separately passes the structured generated-project check with no database module present (1 selected file, 0 findings).
S2 reconcile: source implementation unchanged since S1, only requested docs/carrier and sanitized run evidence; no unanswered threads, new CI tier, root lock churn, labels/milestone mutation or merge. Full scaffold.runtime remains a required coordinator-armed CI gate, with no local or future-pass claim.
