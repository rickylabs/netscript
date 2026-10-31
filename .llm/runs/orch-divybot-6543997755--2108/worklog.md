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
