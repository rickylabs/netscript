# PR checklist self-reference correction

At current head1acff81, check-close-gate.ts correctly failed because the PR body
contained an unchecked aggregate "required checks green" claim including CI itself.
The claim was authored by this run, not requested as a checkbox by the issue.
Replace it with the precise completed local acceptance evidence (all requested local
static/template/quality gates, plus runtime attempted and honestly UNPROVEN with
verified workflow policy). Do not claim pending remote checks passed. Required CI
remains explicitly required for READY and is enforced by its actual statuses.

This is a PR metadata correction, not a weakened gate, code change or removal of
scope. Same-head rerun will verify the body and answered review threads. No source
push solely to refresh CI; existing jobs remain authoritative.
