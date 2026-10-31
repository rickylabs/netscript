# Worklog

## Design

1. Public surface: `agent init --with-docs` restores two MANIFEST compatibility rows.
2. Vocabulary: prose content identity = SHA-256 of canonical decoded corpus;
   extraction label = deterministic framework release. API clock remains distinct.
3. Ports: existing AgentDocsGenerator, AgentDocsCommandRunner, init filesystem port;
   Web Crypto digest. No new ports.
4. Constants: existing schema 1 / release constants; `sha256:` and `release:` formats.
5. Commit slices: bootstrap; implementation + tests + docs + evidence; final handoff.
   File/gate list in plan.md.
6. Deferred: redesign and runtime smoke, already proved or out of scope.
7. Contributor path: `.llm/tools/docs/generated-carriers.md`.

## Routing override (verbatim owner grant)

"Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."

Matrix feature routing inspected; explicit evaluator override above supersedes it.

## Bootstrap reconcile

Main equals intake baseline. #2234 does not cover remaining manifest gap.
Owner-specific `Refs` requirement overrides generic closing template; labels and milestone
remain coordinator-owned. Final issue report uses Orchid file handoff per assignment.
