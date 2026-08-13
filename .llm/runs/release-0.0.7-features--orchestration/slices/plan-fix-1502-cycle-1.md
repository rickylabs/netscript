use harness

# #1502 plan-fix cycle 1

Resume the existing `docs-rfc-plugin-cli-contribution--1502` author run in the same Codex thread.
PLAN-EVAL cycle 1 evaluated `a02f9690154b7384ca8e6503ea91d644b397368a`, returned `FAIL_PLAN`,
and pushed verdict-only commit `d71b78c3116db4ec3aaaa0447dd527fcd4867f6f`. Read the complete
`plan-eval.md` before acting. This turn repairs the plan and evidence only; do not author the RFC or
implement the CLI seam.

## SKILL

Re-read the task-relevant parts of these skills and follow them:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-doctrine/SKILL.md`
- `.agents/skills/netscript-deno-toolchain/SKILL.md`
- `.agents/skills/jsr-audit/SKILL.md`

The scope resolution is authoritative:

1. The user's dispatch explicitly says #1502 is an RFC document plus its own PLAN-EVAL, proposing a
   later implementation epic; it does **not** implement the CLI seam now. Preserve that boundary.
2. The coordinator-approved leaf contract remains binding for evidence. Treat `packages/cli/`,
   `packages/plugin/`, RFC 0003, and RFC 0005 as inspection/audit surfaces, not mutation authority.
   Do not edit package/plugin source or the central contract.
3. Record the tension and this dispatch resolution as significant drift in the leaf `drift.md` and
   cite the exact coordinator contract path/key. State that a code-scope expansion would require a
   coordinator amendment and new plan; it is not inferred here.
4. Do not waive the immutable proving gates. Revise the plan so final #1502 evidence includes
   structured `check`, `test`, `publish-dry-run`, `arch-check`, `docs-source-format`, and
   `docs-accuracy`. Run the smallest trustworthy, receipt-preserving versions appropriate now where
   the evaluator requires evidence; plan final reruns after RFC authoring. Never run
   `scaffold.runtime`. `quality:gate` remains N/A because the actual leaf diff does not touch
   `packages/**` or `plugins/**`.
5. `jsrAudit.applicable` is true. Use the repo's JSR/Deno tooling to audit the contracted CLI/plugin
   publish surfaces, including exports, exact internal `@netscript/*` dependency pins,
   isolated-declaration publish-dry-run behavior, and runtime asset/`import.meta` reads. Preserve
   JSON receipts and distinguish measured baseline failures from introduced failures. Add the
   missing `import.meta` risk explicitly.
6. Correct `supervisor.md`: the topic launcher proves requested and observed author effort `high`.
7. Address evaluator notes N-3 and N-4: name the docs terminology check using the live glossary and
   enumerate the full applicable Archetype-4 fitness gates in the future implementation roadmap.
8. Keep `Closes #1502`: the user's dispatch makes this RFC leaf the completion of #1502, while the
   later implementation epic is a separate proposal and is not filed here. Explain this resolution
   in the plan/worklog so the PR cannot be mistaken for closing the future epic.

Use structured NetScript checks, preserve JSON receipts, and keep lock hygiene. Reconcile raw Git
truth before committing. Commit the plan-fix slice in one reviewable commit, push only with
`git push origin HEAD:refs/heads/docs/rfc-plugin-cli-contribution`, and post one concise PLAN-UPDATE
comment on draft PR #1651 pinned to both the failed plan head and repaired head. Keep exactly one
`status:plan-eval` label. Stop after the repaired plan is pushed and return the exact head, gates,
receipts, and `BLOCKED: awaiting PLAN-EVAL cycle 2`. Do not self-evaluate, request ready-for-review,
merge, publish, mutate #1348, or alter central cluster state.
