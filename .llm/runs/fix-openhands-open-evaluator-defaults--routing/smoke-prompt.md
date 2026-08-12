use harness

# OpenHands transport smoke

Read-only smoke. Do not edit, commit, push, comment, or run product gates. Inspect the checkout
identity and reply with the selected model plus exactly `OPENHANDS_VERDICT: PASS` if the agent can
read the repository and complete one tool-backed turn. Otherwise report the precise blocker and
`OPENHANDS_VERDICT: FAIL_FIX`.

## SKILL

- `openhands-handoff` — apply the cloud evaluator transport and verdict contract.
- `netscript-harness` — preserve evaluator separation and evidence rules.
- `netscript-tools` — use only read-only repository inspection for this smoke.
