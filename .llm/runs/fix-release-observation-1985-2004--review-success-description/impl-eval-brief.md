# Independent IMPL-EVAL: PR #2086 review repair

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-pr/SKILL.md`, and `.agents/skills/netscript-tools/SKILL.md`. Follow `.llm/harness/evaluator/protocol.md` and verdict definitions.

## Task

Evaluate only the current two-file fix and its run evidence in this directory. Read research, plan, worklog, context-pack, drift, and gates.log. Confirm the workflow calls the helper after success when a later step fails; confirm precise success/success matching, preserved unknown/failure behavior, GitHub description length, and meaningful mutation evidence. Independently run the structured release-tool test gate and inspect required check/lint/fmt logs. No package/plugin/scaffold/public CLI changes, so package archetypes and release-cut/E2E gates are N/A. SCOPE-docs applies to evidence. No debt delta.

Owner explicitly requires ONE commit AFTER gates and this evaluation, followed by a normal push and a one-or-two sentence thread reply/resolution. This overrides generic bootstrap commits, per-phase comments, and PR relabeling. The evaluated HEAD is the original baseline, with the working diff under review; record `git rev-parse HEAD` exactly AND SHA-256 of the two implementation files in evaluate.md so the final commit can be checked against the evaluated content. Do not falsely claim a clean committed head.

Use an executable temporary directory: set TMPDIR=/tmp for test commands. Stop if MemAvailable is under 6 GiB.

Write ONLY evaluate.md in this run directory, with PASS or a specific failure verdict and evidence, using the evaluator template compactly. No implementation changes, commits, pushes, GitHub comments, or other mutations. Never put operator absolute paths, hostnames, session IDs, or secrets in the artifact; use repository-relative paths and omit prohibited identity fields. State requested/observed evaluator model and effort accurately.
