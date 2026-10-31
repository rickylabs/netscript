# PostgreSQL option normalization — #2367

- Baseline: `4aa734e2b6ca93119462ec2e0cd34b729df51bfd` (main).
- Branch: `orch/divybot-6537761359`; tier: feature; profile: dispatcher-supplied leaf.
- Implementer: Codex, OpenAI family; evaluator/slice reviewer: separate Claude session,
  Anthropic family, owner-directed `claude-opus-5-5`, effort high.
- Owner route override: "Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a
  separate session with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed,
  blockers only."
- Matrix inspected with `deno task agentic:matrix --tier feature --json`: implementation primary
  sol; default evaluator routes superseded by the explicit owner override above. PLAN rounds <=2,
  IMPL rounds <=5; reuse evaluator across implementation rounds; two terminal failures stop.
- Writable surface: `packages/database/adapters/postgres-connection-string.ts`,
  `packages/database/adapters/postgres-connection-string-error.ts`,
  `packages/database/connection-strings/postgres.ts`,
  `packages/database/tests/postgres-connection-string_test.ts`, `packages/database/README.md`,
  and `.llm/runs/orch-divybot-6537761359--2367/**`.
- Research extension before implementation: also regenerate
  `packages/cli/src/kernel/assets/generated/database/postgres-connection-string.ts.template` and
  `packages/cli/src/kernel/assets/embedded.generated.ts`, and extend
  `packages/cli/src/kernel/templates/database/postgres-normalizer_test.ts`.
- PLAN-EVAL scope correction before implementation: `docs/site/reference/database/index.md` and
  `packages/database/CHANGELOG.md`, to keep the public error-reason table and change notice accurate.
- Noncommitted scratch/evaluation output: project run evidence directory; assignment/final report
  files remain excluded. No lock changes, runtime resource launches, merge, labels, or milestones.
- Privacy: public artifacts use repository-relative paths and omit machine/session identifiers.
