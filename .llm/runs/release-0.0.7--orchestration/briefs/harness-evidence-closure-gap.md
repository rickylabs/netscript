use harness

# #1644 acceptance-guidance completion

Resume the existing `harness-evidence-and-verdict-tooling` implementer in the same Codex thread.
The coordinator interrupted the packaging turn before any commit because final reconciliation found
one exact acceptance gap. Preserve and inspect the current uncommitted packaging artifacts; do not
discard valid work blindly.

## SKILL

Re-read and follow:

- `.agents/skills/netscript-harness/SKILL.md`
- `.agents/skills/netscript-tools/SKILL.md`
- `.agents/skills/netscript-pr/SKILL.md`
- `.agents/skills/netscript-deno-toolchain/SKILL.md`

Coordinator control head `33626b1f4` amends the binding leaf contract. Exactly one additional edit
surface is now authorized: `.agents/skills/netscript-pr/SKILL.md`. Live #1621 explicitly requires
the skill to state plainly that only markdown checkboxes are close-gated and that a plain-bullet
Acceptance section has no mirrorable targets and therefore takes no `acceptance-evidence` block.
Add that concise operator guidance in the existing machine-convention section. Do not edit any
other new product, workflow, tool, or test surface.

Record the coordinator amendment and supersession of the earlier read-only decision in leaf
drift/worklog/context. Update draft PR #1644 so S3 and its matching Definition-of-Done row become
truthful only after the guidance commit exists. Preserve the implementation and Tier-A results.

Treat the already-generated final receipts at `b21424c44` as pre-guidance evidence, not the final
immutable set. Commit the acceptance-complete guidance and run-artifact updates first. Then run
exactly one final structured `check`, `test`, and `quality-job` cycle at that acceptance-complete
implementation head. Package those receipts in one evidence-only commit and push by explicit
refspec. It is expected that receipt `actualGitHead` identifies the validated parent implementation
head while the final branch tip is the evidence-only packaging commit; record that relationship
explicitly. Do not create an infinite receipt/self-reference loop and do not rerun the gates merely
because the receipt-only commit changes HEAD.

Stop at the formal IMPL-EVAL handoff. Do not launch Claude, Fable, OpenRouter, DeepSeek, Minimax, or
any substitute evaluator. The formal opposite-family gate is held until the native allowance reset
at Saturday 2026-08-15 00:00 Europe/Zurich. Do not merge, publish, mark ready, or alter central
cluster state. Return the exact implementation head, evidence head, receipt outcomes/durations,
remote reconciliation, and `BLOCKED: awaiting native opposite-family IMPL-EVAL after reset`.
