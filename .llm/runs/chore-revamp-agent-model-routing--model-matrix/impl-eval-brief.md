use harness

# IMPL-EVAL: agent model routing and subscription expense policy revamp

Evaluate draft PR #1989 at exact head `1f02dde27` against its approved plan and the architecture
IMPL-EVAL protocol. This is a separate evaluator session. The generator is OpenAI-family; you are
Grok 4.6 (xAI family) at xhigh through OpenCode Go.

Read `AGENTS.md`, `.llm/harness/evaluator/protocol.md`, the run's `plan.md`, `plan-eval.md`,
`worklog.md`, `context-pack.md`, `drift.md`, the selected Archetype 6 guidance, and the complete
diff from `a2d7f5f6f686115b5c31bab085692df6e1582aa7` through the exact head. Validate the matrix,
different-family composition, provider order, secure credential boundary, expense watcher,
documentation parity, legacy boundary, and test evidence. Spot-check live catalog claims where
useful without printing credentials.

The full repository test produced 5,263 passes and two failures only because its unchanged browser
fixtures were created on the NAS no-exec `/ephemeral` mount; those exact files are byte-identical to
main and the complete 31-test file passes under executable `TMPDIR=/tmp`. Decide whether that is
adequate environment classification rather than assuming either PASS or failure.

Do not edit implementation files. Write the verdict to
`.llm/runs/chore-revamp-agent-model-routing--model-matrix/evaluate.md` using the evaluator template.
Emit exactly `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT`, with concrete evidence and bounded
findings. Do not commit or push.

## SKILL

- `netscript-harness` — enforce run artifacts, gate evidence, and evaluator separation.
- `netscript-tools` — interpret structured check/test/lint/fmt outputs without raw-noise mistakes.
- `netscript-pr` — verify PR lifecycle, exact-head evidence, and review/close gates.
- `netscript-doctrine` — assess architecture boundary and debt implications.
