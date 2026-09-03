use harness

## SKILL

Read /home/agent/AGENTS.md, repo AGENTS.md, netscript-harness and .llm/harness/evaluator/protocol.md.
You are a fresh independent reviewer, not the generator. Review PR #1982 at exact c487e9273 in
/home/agent/projects/netscript/worktrees/007-eval-1982. Base 94fe507af. Use mise toolchains.

Perform substantive slice review and formal IMPL-EVAL of this bounded tooling-only correction.
Primary coordinator authored it directly after a helper attachment failed; your independent review
must precede any sign-off. Do not self-mutate the source to pass. No merge/publish/labels or comments.
Requested route is approved GLM 5.3 Flash max via checked-in Claude/OpenRouter transport, because
native Fable is monthly spend capped; this does not change any topic supervisor model.

Latest owner instruction explicitly requires all generated LLM run files and transient/temp state
be excluded from Aspire static checks, not treated as framework/core/docs failures. This is an
authorized scan-domain change, NOT deletion of tracked run artifacts. Current patch applies shared
scope policy to version parity, host-port scanner and polling scanner, removes all run rows and
generated agent working copies from manifest generation, and guards against old manifest rows
being read. It preserves maintained framework/docs/shipped generated sources. A narrowly owned
negative-version-guard rule avoids flagging forbidText's own forbidden literal; upgrade guide is
dual-train compat; one package JSDoc is version neutral. No runtime behavior changed.

Read .llm/runs/fix-aspire-parity-context--0.0.7/{plan,research,worklog,drift,supervisor}.md and the
main-relative diff. PLAN-EVAL N/A justified bounded repair; no new architecture. Test the actual
patch and negatives; ensure the helper doesn't suppress core source or erase history. Source scope
is 10 TS files plus generated TSV and AGENTS.md; no need to review old historical run content.

Run focused structured tests for aspire-scan-scope, version-parity, host-ports, resource-polling,
compat-fixtures, plus both parity phases. These are cheap; no Docker/Aspire starts or full E2E,
which is N/A to this leaf and still required on the parent release candidate. Author reports 55
tests PASS, phases 1/2 PASS (867 checked), host-port scan PASS966, 10-file check/lint/fmt PASS.
When linting .llm sources use the root recommended/jsr/no-process-global/no-node-globals rules
without root exclusions, and report coverage honestly. Do not install dependencies or delete locks.

Distinguish implementation correctness from external required CI and PR-body lifecycle metadata:
CI is running and coordinator will reconcile final evidence before ready-merge. Do not certify a
release or fabricate CI PASS. Raise only concrete blocking findings; don't expand this bounded
owner-approved task into a parser/scanner framework redesign. Reasonable advisories may be noted.

Write .llm/runs/fix-aspire-parity-context--0.0.7/evaluate.md in YOUR isolated worktree only with
exact head, requested/observed identity, commands/results, substantive review, concrete findings,
and PASS_IMPL or FAIL_FIX. No source edits, commits, pushes, or GitHub mutation. Return a concise
verdict. Coordinator will preserve your artifact in the author branch after review.
