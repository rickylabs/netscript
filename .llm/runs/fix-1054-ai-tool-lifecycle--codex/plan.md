# Plan: #1054 AI tool lifecycle

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1054-ai-tool-lifecycle--codex` |
| Branch | `fix/1054-ai-tool-lifecycle` |
| Phase | `plan` |
| Target | `plugins/ai` CLI compiler and prod E2E diagnostics |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Archetype and Doctrine

Archetype 6 is controlling because this defect is in a published resource-command/scaffold flow;
the plugin concern is folded into the larger CLI archetype. Current doctrine verdict is usable with
known debt; this slice adds no structural abstraction. A7 (platform APIs first), A8 (one concern),
A10 (composition root), A13 (failure boundary), and A14 (tests preserve doctrine) apply.

## Goal and Scope

Replace scaffold-time module execution with deterministic static source selection; remove the
identity exclusion; add real-stub regression coverage; expose failed prod E2E report details.
Only the four owner-approved files are expected because `ProjectFiles.readTextFile` already exists.

## Non-Scope

- Generated registry runtime resolution helpers remain unchanged.
- No AST dependency, filename-specific rule, version bump, canary dispatch, or release action.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Lex source while skipping comments and strings | deterministic, dependency-free, false-positive resistant |
| D2 | Accept only exported const/default initializers starting with the builder, including arrays and import aliases | separates ready definitions from factories |
| D3 | Treat malformed/unrecognized source as excluded | selection must never throw |
| D4 | Preserve runtime helpers in generated code byte-for-byte | they execute in the app's resolvable graph |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Parser dependency | safe to defer | owner selected a lexical scan; no workspace AST dependency |
| Broader expression analysis | safe to defer | minimum accepted source shapes are explicit |

## Commit Slices

1. Static selection + real-stub regressions + exclusion removal; proven by targeted RED/GREEN tests,
   local CLI reproduction, scoped quality gates, and paired E2E gates; touches compiler, test, manifest.
2. Prod E2E failure detail; proven by workflow comparison/format gate; touches prod workflow.
3. Harness evidence and PR handoff; proven by substantive diff review and remote SHA equality.

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Comments/strings false-positive | lexer skips their contents; add focused assertions |
| Factory-body false-positive | only exported initializer roots qualify; actual mcp stub test |
| Alias/multiline regression | recognize imported builder alias; whitespace-independent tokens |
| One gate fixed by breaking another | run both named E2E gates in one reported suite |

## Anti-Patterns / Gates

- Avoid AP-2/AP-6 reinvention and AP-8 hidden I/O; pure selector is isolated and documented.
- Required evidence: targeted tests; plugin/package check+test as applicable; scoped check/fmt/lint/
  doc-lint; `quality:scan`; `arch:check`; JSR dry-run audit; local plugin CLI reproduction; one-pass
  scaffold runtime report containing both named gates.
- Debt implication: none expected.

## Deferred Scope

- Published JSR lane proof occurs after publication; PR will distinguish it from local proof.
