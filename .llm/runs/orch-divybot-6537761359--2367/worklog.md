# Worklog

## Design

1. Public surface: `@netscript/database/connection-strings/postgres` retains its function/class
   exports; its error reason union gains `duplicate-key`. README and function JSDoc define refusal,
   TLS spellings and decimal port canonicalization; URI pass-through remains unchanged.
2. Domain vocabulary: canonical option = one of the existing `OPTION_KEYS` targets; duplicate = a
   second spelling of that canonical option, regardless of its value; refusal = typed credential-safe error.
3. Ports: existing pure tokenizer and Web Platform encoding only; no new port or IO dependency.
4. Constants: reuse `OPTION_KEYS` and `SSL_MODES`; add two finite SSL spellings. New union member
   `duplicate-key` follows existing refusal vocabulary, without adding an unnecessary abstraction.
5. Commit slices: bootstrap plan/run docs; one tested implementation across the declared database and
   generated CLI files; final reviewed evidence/handoff docs. Each slice updates this file and context.
6. Deferred scope: URI normalization, driver behavior, other engines, package debt and new aliases.
7. Contributor path: read `packages/database/adapters/postgres-connection-string.ts` to extend the
   option/TLS maps and translator, then follow its public tests and regenerate CLI assets.

## Routing override (owner verbatim)

"Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with
claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only."

Implementation remains OpenAI-family; evaluator is Anthropic-family, separate session. Matrix and
feature loop bounds recorded in supervisor.md. Public records omit private evaluator identifiers.

## Bootstrap reconcile

Live #2367 and PR search checked; no covering PR. Main equals baseline. Operator-specific directives
override generic assignment template: PR starts with Refs and has no closing keyword; coordinator
owns labels/milestones/merge. Canonical final issue report uses the excluded file publication handoff.
PLAN-EVAL pending; no implementation has begun.
