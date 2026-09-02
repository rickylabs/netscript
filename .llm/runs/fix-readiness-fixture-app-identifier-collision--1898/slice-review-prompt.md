use harness

## SKILL

- `netscript-harness` — enforce the pre-sign-off slice review gate.
- `netscript-cli` — assess the CLI E2E generated-module contract.
- `netscript-tools` — treat structured wrapper output as the gate evidence.
- `netscript-doctrine` — apply AP-18 semantic-test expectations; the nested E2E workspace is not a published doctrine root.

Act as the separate opposite-family ordinary reviewer for the uncommitted GREEN diff for issue
#1898 in `/home/agent/projects/netscript/worktrees/007-leaf-1898`.

Read the issue contract from
`.llm/runs/fix-readiness-fixture-app-identifier-collision--1898/implement.md`, the plan/design/worklog,
and `git diff HEAD`. This is a read-only review: do not edit files, commit, push, or change GitHub.

Review correctness of the fixture-specific identifier rewrite, especially identifier boundaries,
all suffixed references, real-generator test construction, emitted-module type-checking, resource
registrations, reinjection failure, ceiling compliance, and `deno.lock` hygiene. The generator is
out of scope and must remain unchanged. The structured final gates already report tests 120/120,
check 190 files, fmt 190 files, and focused lint 36 files, all exit 0.

Return exactly one of `PASS` or `CHANGES_REQUESTED`, followed by concise evidence/findings. Do not
self-identify as IMPL-EVAL; this is the pre-sign-off slice review only.
