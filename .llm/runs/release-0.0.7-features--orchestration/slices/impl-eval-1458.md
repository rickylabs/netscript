use harness

## SKILL

- `netscript-harness` — apply the formal IMPL-EVAL protocol and verdict vocabulary.
- `openhands-handoff` — publish one machine-readable OpenHands verdict.
- `netscript-tools` — run the smallest decisive repository-native gates without mutating source.
- `netscript-doctrine` — apply package/plugin doctrine when the changed surface requires it.

Act as the formal IMPL-EVAL session for this pull request. Do not edit files, create commits, push,
or repair findings. The trigger metadata supplies the trusted base SHA and immutable head SHA: read
the evaluator protocol, verdict definitions, and selected profiles from that base commit, then
evaluate the PR body, linked issue #1458, run artifacts under
`.llm/runs/feat-fresh-chat-response-mode--1458/`, final diff, review threads, and architecture debt
at the immutable head. Verify the recorded `PLAN-EVAL: N/A` justification, acceptance criteria,
static/consumer gates, public surface, lock hygiene, and false-done states.

Slice-specific points this evaluation must decide, each with evidence:

1. **Ceiling honesty.** The PR claims a two-file product ceiling. Confirm `git diff` against the
   trusted base, outside `.llm/runs/`, is exactly `packages/fresh/src/runtime/ai/create-chat-connection.ts`,
   its `_test.ts` sibling, and the regenerated MCP export corpus — nothing else.
2. **Upstream fidelity.** `mode` and `waitUntil` are claimed to match
   `@durable-streams/tanstack-ai-transport@0.0.8`'s own `toDurableChatSessionResponse` field names and
   types. Verify against the pinned dependency's actual source, not the PR's paraphrase.
3. **Both seams.** Prove the two fields reach the default transport path *and* the pluggable
   `toResponse` seam, and that omitting `mode` leaves it `undefined` at the wrapper rather than
   defaulting locally (the transport owns the default).
4. **Behavioral claims.** The tests assert awaited `200` success, awaited failure propagation, and
   immediate-mode `202` with background failure only logged. Judge whether they prove that against the
   real dependency rather than a stub that could pass vacuously.
5. **Integration correctness.** `main` `584caa03f` was integrated at `520573e1f`; the only conflict was
   the generated MCP export corpus, resolved by regeneration from tooling. Confirm the carrier is
   genuine tool output (`deno task check:mcp-export-corpus` reproduces it) and that the integration
   moved no product source.
6. **Receipt integrity.** Four receipts under `receipts/` are cut at the integrated head. Check
   `gitHead == actualGitHead` and **non-empty `stdout.bytes`** on each — this repository has a known
   trap where `deno task`-level caching returns `PASS` / exit 0 with zero-byte stdout, describing a run
   that never happened.

E2E, Aspire, Docker, and browser gates are protocol-prohibited for this no-lease leaf; do not run them
and do not treat their absence as a finding.

Return concise, severity-ranked findings with exact evidence and required action. End with exactly
one supported verdict line using `OPENHANDS_VERDICT: PASS`, `OPENHANDS_VERDICT: FAIL_FIX`,
`OPENHANDS_VERDICT: FAIL_RESCOPE`, `OPENHANDS_VERDICT: FAIL_DEBT`, or
`OPENHANDS_VERDICT: FAIL_PLAN`. Write the same verdict to `OPENHANDS_SUMMARY_PATH`.
