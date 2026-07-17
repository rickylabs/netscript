use harness

## SKILL

- `netscript-harness` — perform the Amendment A1 substantive slice review before sign-off.
- `netscript-tools` — independently inspect the diff and validation evidence with lock hygiene.
- `openhands-handoff` — verify the trigger, token, model, prompt, output, and dedupe contracts.
- `netscript-pr` — verify label taxonomy, mirror consistency, PR trail, and phase metadata.
- `rtk` — keep read-heavy git and search output compact.

Act as the separate opposite-family review session for Codex-authored slice 1 in
`/home/codex/repos/b10-docsgate`, branch `ci/docs-openhands-gate`, run
`.llm/runs/ci-docs-openhands-gate--docs-accuracy/`, draft PR #806.

Read the approved plan and PLAN-EVAL, the full uncommitted diff against `HEAD`, the workflow, prompt,
audit note, label taxonomy, source/mirrored PR skill, worklog, and context pack. Independently assess:

- trigger events and `type:docs` OR `area:docs` applicability;
- explicit attributed `docs-eval:skip` summary with no dispatch steps running;
- exact open-only Minimax model guard and PAT-only chained comment semantics;
- trusted-base prompt loading and prompt/output contract;
- exact-body + head-SHA dedupe only while no later OpenHands summary exists;
- quick executable-claim tests, per-file verdicts, and blocking hallucinated verb/flag/path findings;
- schema/mirror/docs-overlay alignment, security risks, workflow expression validity, and scope drift.

Re-run focused read-only checks if useful. Do not commit, push, comment, dispatch OpenHands, or modify
any file except `.llm/runs/ci-docs-openhands-gate--docs-accuracy/slice-review.md`. Write a concise
review with findings ordered by severity and end with exactly `PASS` or `FAIL_FIX`.
