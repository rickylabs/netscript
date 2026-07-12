use harness

## SKILL

- `netscript-harness` — follow the final IMPL-EVAL protocol and write the canonical verdict artifact.
- `netscript-tools` — use scoped, trustworthy validation commands and preserve lock/secret hygiene.
- `netscript-pr` — verify PR phase, taxonomy, close-gate applicability, and evidence comments without mutating the PR.

# Independent IMPL-EVAL: durable OpenRouter agentic lane repair

You are the separate opposite-family evaluator for a Codex-authored implementation. Evaluate only;
do not continue implementation. Work in `/home/codex/repos/ns-fix-agentic-lanes` on branch
`fix/agentic-openrouter-lanes`. PR #696 targets `main`; implementation head before this evaluator
handoff is `1596c32f`. Baseline is `ec61dc78`.

Read completely before judging:

- `AGENTS.md`
- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.llm/harness/workflow/run-loop.md`
- `.llm/harness/evaluator/protocol.md`
- `.llm/harness/evaluator/verdict-definitions.md`
- `.llm/harness/evaluator/anti-pattern-catalog.md`
- `.llm/harness/archetypes/ARCHETYPE-6-cli-tooling.md`
- `.llm/harness/templates/evaluate.md`
- `.llm/harness/debt/arch-debt.md` (or the canonical debt registry path named by the protocol)
- every artifact in `.llm/runs/fix-agentic-openrouter-lanes--codex/` needed to evaluate the run,
  especially `plan.md`, `plan-eval.md`, `worklog.md`, `context-pack.md`, `drift.md`,
  `glm-live-evidence.md`, and `pr-body.md`
- the commit list and per-slice comments on PR #696

Evaluate the complete committed diff from `ec61dc78` through current HEAD against the approved plan.
Independently inspect the implementation and verify these acceptance boundaries:

1. Codex app-server composition never passes the unsupported top-level `--profile`; the launcher
   materializes the supported named Responses-only profile and equivalent isolated `config.toml`.
2. Requested reasoning effort is applied in the authoritative app-server requests and compared with
   observed v0.144 identity; successful sends without a captured thread id remain exit 0, while real
   route mismatches fail closed.
3. The Claude/OpenRouter route is a real isolated launch/resume implementation, not a stub, and the
   redacted evidence proves a non-empty GLM 5.2 agentic tool turn through the checked-in wrapper.
4. Codex/OpenRouter GLM's native namespace rejection is represented as observed, structured,
   test-covered incompatibility rather than fabricated support.
5. Every `OPENROUTER_PRESETS` entry participates in a cheap structured static canary. Default mode
   does not read a credential or spawn a provider, and provider execution requires explicit
   `--live`. CI and the rollout runner consume the correct modes.
6. Model ids/endpoints remain centralized, no credential value was committed, `deno.lock` did not
   churn, and changed TypeScript files meet the applicable CLI/tooling structure gates.
7. The PLAN-EVAL's non-blocking asks are satisfied: explicit F-2/F-4 evidence and F-6 through F-9
   marked N/A for internal tooling.

Run safe read-only validation independently. At minimum, run the full agentic tests, the scoped
check/lint/format wrappers, and the default static canary with provider credential variables unset.
Do not run another live provider turn and do not spend provider credit; assess the committed redacted
live evidence and its implementation path. Verify `git diff --check`, the lockfile delta, changed-file
LOC, and secret-shaped values without ever printing a credential.

The PR intentionally has no resolving issue or closing keyword, so the issue close-gate is N/A.
The last Definition-of-Done box (IMPL-EVAL PASS) is expected to remain unchecked until your verdict;
all earlier boxes must already be complete. This is not a release-cut run, so release gates are N/A.

Write exactly one evaluator-owned artifact:
`.llm/runs/fix-agentic-openrouter-lanes--codex/evaluate.md`, following the evaluate template and
using the stable verdict values. Include process verification, static/fitness/runtime/consumer gates,
anti-pattern review, debt delta, findings, and a single final verdict with concrete evidence for every
PASS. Do not edit source, tests, plans, worklog, PR state, or any other file. If a gate fails, record
the corresponding FAIL verdict and required action; do not fix it.
