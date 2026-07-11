# Plan — issue #665

## Profile and scope

- **Archetype:** 6 (internal CLI/tooling flow).
- **Overlays:** none.
- **Doctrine verdict:** no package/plugin architecture is changed; apply the existing contract-first
  runtime/tooling shape locally.
- **Debt:** none expected.
- **Relevant anti-patterns:** AP-2 (duplicated logic), AP-6 (side effects without seams), AP-21
  (command logic without focused tests).

## Locked decisions

1. Treat authoritative app-server child/turn metadata as observed identity; do not relabel daemon
   defaults as requested values.
2. Apply effort at the per-message/turn input consumed by app-server, because empirical evidence
   proves the generic config override is not propagated by `send-message-v2` on CLI 0.144.1.
3. Launches fail closed on `pending` or `mismatch`, return non-zero, and print a concrete operator
   action. `--allow-route-mismatch` is the explicit default-off escape hatch.
4. Keep parsing/comparison/escalation pure and unit-testable; process and filesystem effects remain
   in the launcher boundary.

## Open-decision sweep

- Must resolve now: exact app-server invocation shape for per-turn effort; prove it empirically.
- Safe to defer: upstream Codex CLI issue/report and historical artifact repair.

## Commit slices

1. **Prove applied route and fail-closed escalation.** Change agentic launcher/runtime helpers and
   focused tests; gate with runtime unit tests plus scoped check/lint/fmt. Update run artifacts.

## Risk register

- Custom protocol handling could drift from Codex CLI: minimize the delta and pin transcript tests.
- Opt-out could become accidental default: parse only an explicit flag and test default-on behavior.
- Missing identity could falsely pass: retain `pending` as enforced failure.

## Gates

- Focused runtime/launcher unit tests, including mismatch escalation.
- Scoped wrapper check, lint, and format for `.llm/tools/agentic`.
- Full agentic runtime unit suite.
- Release/JSR/consumer gates: N/A; internal tooling only.

## Deferred scope

- No PR, upstream Codex change, historical thread artifact rewrite, or unrelated beta-7 I10/I12 work.
