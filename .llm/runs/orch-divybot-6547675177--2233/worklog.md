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

## Implementation slice

PLAN-EVAL: PASS before implementation (see plan-eval.md).
Restored historical labels with `sha256:<decoded corpus digest>` and `release:<version>`.
Private adapter change only; no carrier aggregate, sidecar, dependency, export, or runtime wiring change.
Strict expected full manifest is independent of production renderer, decoded from canonical carrier
and compared as Uint8Array against real generator and real installed output. Clock-only
variation verifies stable provenance. Four mutation controls fail the same equality assertion.

All 45 scoped tests pass. Structured check/lint/fmt pass for both owned TS files.
Quality and four carrier freshness gates pass via durable runner. JSR audit/native publish
dry-run succeeds with existing warnings. See validation.md for exact commands, source hashes,
and per-gate evidence. Separate pre-commit IMPL-EVAL pending; final pushed-head review follows.

Reconcile: changed files remain inside declared scope; no lock or generated-carrier churn.
Issue metadata remains coordinator-owned; no scaffold/runtime E2E required for this scope.

## Slice sign-off

Separate Anthropic IMPL-EVAL returned PASS (read-only, blockers only), inspecting the
actual adapter, independent expected manifest, real installer, and validation evidence.
Requested and observed model for both PLAN-EVAL and IMPL-EVAL: `claude-opus-5-5`, effort high.
See evaluate.md. This external review is the substantive slice review before sign-off.
All four provenance mutations failed as expected; restored source hashes match validation.md.
The implementation slice is approved for commit and push. Final exact pushed-head review
will be recorded on PR #2546 and in the canonical READY report without moving that head.

Reconcile: no new review threads; thread gate PASS (zero threads). No issue metadata changes.
Only the three declared product/test/docs files and scoped run artifacts are included.
