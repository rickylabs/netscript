use harness

# IMPL-EVAL: agent model routing and subscription expense policy revamp

Evaluate draft PR #1989 at exact head `74c6299b006c8662514e9f1f2a77e970681b0ade` against its
approved plan, the owner's post-evaluation corrections in `drift.md`, and the IMPL-EVAL protocol.
This is cycle 4 in the same separate evaluator session used for cycle 3. The generator is
OpenAI-family; you are native Claude Opus 5 xhigh (Anthropic family), the matrix's declared fallback
for `feature/implementation_evaluation`. OpenCode Go remains live-rate-limited, and the primary Meta
route was rejected before inference by its endpoint policy. Neither `complex` nor `architecture` is
authorized for this run.

Read `AGENTS.md`, `.llm/harness/evaluator/protocol.md`, the run's `plan.md`, `plan-eval.md`,
`worklog.md`, `context-pack.md`, `drift.md`, the selected Archetype 6 guidance, and the complete
diff from `a2d7f5f6f686115b5c31bab085692df6e1582aa7` through the exact head. Validate the matrix,
different-family composition, provider order, secure credential boundary, expense watcher,
documentation parity, legacy boundary, and test evidence. Spot-check live catalog claims where
useful without printing credentials.

The repaired exact head has structured green evidence: 187 agentic files checked with zero
diagnostics; 583 agentic tests passed; 3,140 repository files checked with zero diagnostics; and
5,278 repository tests passed with zero failures and 19 intentional ignores under executable
`TMPDIR=/tmp`.

Cycle 3 found one high and one low bounded finding. Verify that all four owner-unstated DeepSeek
efforts now use `provider_default`, that direct tests pin those four cells, that the generated human
matrix matches, and that the README identifies `agentic:claude-openrouter` as a compatibility-only
surface outside active matrix selection. The coordinator reran 59 focused tests (all pass), the
187-file agentic check (zero diagnostics), a 23-test matrix/parity subset (all pass), and
changed-file format (zero findings). Do not reopen already-closed findings without contradictory
evidence.

Pay particular attention to the post-evaluation corrections: authenticated Go usage acquisition,
model-adjusted effective windows, fail-closed response handling before spawn, matrix-cell model
membership, and explicit owner/milestone-coordinator authority for privileged rows. Verify that the
live blocked receipt and the `Vs5ukzqK` cost trace are represented honestly without credentials.

Do not edit implementation files. Write the verdict to
`.llm/runs/chore-revamp-agent-model-routing--model-matrix/evaluate.md` using the evaluator template.
Rewrite the existing historical evaluation in place while preserving the earlier verdicts as
history. Emit exactly `PASS`, `FAIL_FIX`, `FAIL_RESCOPE`, or `FAIL_DEBT` for this new cycle, with
concrete evidence and bounded findings. Do not edit implementation files, commit, or push.

## SKILL

- `netscript-harness` — enforce run artifacts, gate evidence, and evaluator separation.
- `netscript-tools` — interpret structured check/test/lint/fmt outputs without raw-noise mistakes.
- `netscript-pr` — verify PR lifecycle, exact-head evidence, and review/close gates.
- `netscript-doctrine` — assess architecture boundary and debt implications.
