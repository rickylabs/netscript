# Close-gate while required CI is running

check-close-gate.ts evaluates unchecked authoritative PR-body boxes even when
there are no closing issue references. A Refs-only PR can therefore fail close-gate
while its required-checks checkbox honestly remains open. Do not delete or relocate
the checkbox to evade the gate. Wait for substantive required checks to finish,
update the evidenced acceptance claim, run the live checker locally, then rerun the
failed close-gate job on the same head. Body edits are fetched live by the checker;
a source push is unnecessary and would invalidate current-head evidence.

Runtime opt-in policy is independent of draft status in e2e-cli.yml. A non-draft,
unlabeled event provides clean evidence of the cost-policy skip. Draft-only skips
for required ci.yml jobs do not supply implementation acceptance.
