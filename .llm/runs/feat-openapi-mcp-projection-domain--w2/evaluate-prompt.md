use harness

# IMPL-EVAL: OMB S4 OpenAPI projection domain

You are the independent cloud evaluator for NetScript PR 1195, run
`feat-openapi-mcp-projection-domain--w2`. Evaluate only; do not implement or repair source. Compare
`origin/main...HEAD`, the live issue 1130, the merged RFC PR 1123, the locked harness plan, and the
committed P2 proof inputs. The generator and supervisor are a Codex/OpenAI session; you are the
required separate open-model evaluator.

## SKILL

- `.agents/skills/netscript-harness` — apply the IMPL-EVAL protocol, verdict vocabulary, and tracked run-artifact contract.
- `.agents/skills/netscript-doctrine` — evaluate `packages/mcp` against the full Archetype-2 column and pure-domain boundary.
- `.agents/skills/jsr-audit` — verify the new public subpath, doc surface, slow types, and publish dry-run evidence.
- `.agents/skills/netscript-tools` — use trustworthy scoped gates, raw git/lock evidence, and the review-thread gate.
- `.agents/skills/netscript-pr` — audit taxonomy, acceptance evidence, Definition of Done, and the close-gate without merging.
- `.agents/skills/netscript-deno-toolchain` — use native Deno 2.9 inspection/publish commands and preserve lock hygiene.
- `.agents/skills/rtk` — compress read-heavy git/search output while keeping raw gate verdicts authoritative.
- `.agents/skills/openhands-handoff` — write the tracked evaluator verdict and required OpenHands summary/trace outputs.

Read every selected `SKILL.md` completely, then read the files required by the evaluator protocol,
including:

1. `.llm/harness/workflow/milestone-run.md` § Evaluator protocol.
2. `.llm/harness/evaluator/protocol.md` and `verdict-definitions.md`.
3. `.llm/harness/archetypes/2-integration.md` and the applicable doctrine sections.
4. `.llm/runs/feat-openapi-mcp-projection-domain--w2/{plan.md,plan-eval.md,worklog.md,context-pack.md,drift.md}`.
5. `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P2-verdict.md` and `proofs/evidence/P2-no-db.json`.
6. `.llm/runs/plan-openapi-mcp-plugin--seed/rfc.md` and `design/canonical/03-projection-and-naming.md`.
7. The live PR/issue, commit list, per-slice PR comments, and current review threads.

## Evaluation contract

- The formal PLAN-EVAL row is **composed per milestone-run.md (orchestrator waiver)** by explicit
  owner ruling D6. Verify that waiver record; do not treat the intentionally absent local PLAN-EVAL
  as a process failure.
- Independently inspect all changed source and fixtures. Pay special attention to exact identity
  precedence, case-fold collisions, fuzzy suggestions never resolving, every description rung, the
  exact 3657-byte generated fixture, local-ref cycle/depth behavior, and errors derived only from
  declared non-2xx/default responses.
- Prove the no-database fixture returns exact `{}` errors for all three operations. Any inferred
  envelope is `FAIL_FIX`.
- Confirm pure domain: no I/O, adapters, ports, tools, dependencies, registry changes, or runtime
  activation in the projection module; S5/S6 remain out of scope.
- Confirm `deno.lock` is unchanged against the true base `2c8865e8c4ec60ef080276d327fc75ab32c0cb85`.
  Never modify or commit the lock. Do not use cache reloads.
- Run the smallest independent gates that prove the result. For lint/fmt, pass
  `--config packages/mcp/deno.json`; the root workspace config parse failure is recorded drift.
- Treat the PR's one remaining unchecked DoD item as the self-referential evaluator completion
  step: a PASS verdict authorizes the supervisor to check it after the current review-thread gate.
  All issue acceptance boxes already carry linked evidence. Do not add a closing keyword, merge,
  change labels, or close the issue.
- The prior Augment comment reports unavailable review credits. Record it as external composed-path
  evidence, not as permission to self-certify; state whether the independent open-model audit
  found any substitute blocker for the orchestrator to rule on.

## Required outputs

1. Write `.llm/runs/feat-openapi-mcp-projection-domain--w2/evaluate.md` from the canonical template,
   with evidence in every PASS row and exactly one final verdict: `PASS`, `FAIL_FIX`,
   `FAIL_RESCOPE`, or `FAIL_DEBT`.
2. Write `OPENHANDS_SUMMARY_PATH` with verdict, findings, commands/exit codes, lock status, PR/thread
   status, and any required supervisor action.
3. Write compact trace metadata under `OPENHANDS_TRACE_DIR` as required by the handoff workflow.
4. Commit back only evaluator artifacts/trace. No source, config, fixture, lock, scratch, or unrelated
   file may be committed.
