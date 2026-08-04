# Brief: reframe the 18 remaining caveat call-outs (#1288)

Worktree: /home/codex/repos/ns005-reframe, branch docs/caveat-reframe (NO upstream).
Documentation-authoring lane: touch only Markdown under docs/. Never packages/, plugins/, .llm/.

## What this is

The caveat burn-down's kill list is done — the limitations that were fixable got fixed and their
call-outs deleted. What remains is 18 markers across 6 debt ids that are TRUE and will stay true:
they are v1 design boundaries or roadmap-scale work, not defects.

Find them: grep -rn "caveat: arch-debt:" docs/site
  seamless-auth-roadmap (6) · auth-single-active-backend-boundary (4) ·
  workers-non-deno-task-sandbox-boundary (3) · streams-manifest-helpers-unsupported (3) ·
  cli-deploy-artifacts-missing (1) · fresh-hosted-example-sandboxes (1)

Read each debt entry in .llm/harness/debt/arch-debt.md first — it states WHY the boundary exists.
That reasoning is the raw material for the rewrite.

## The job

Each call-out currently reads as an apology: "not supported", "currently cannot", "unfortunately".
Rewrite it as a design statement that says three things: what the boundary IS, why it is drawn
there, and what is on the other side of it (roadmap, or the supported alternative today).

Example of the transformation (illustrative, not text to paste):
  BEFORE — "Note: the manifest stream helpers are not supported and throw."
  AFTER  — "Stream producers run through @netscript/plugin-streams-core, which serves a real
            durable runtime. The manifest-level defineStreamProducer/defineStreamConsumer helpers
            are deliberate stubs that fail loud rather than silently half-working: a generic topic
            pub/sub transport is a feature-scale design still open. Use the core API directly;
            consumption is HTTP/SSE."

Rules that make this honest rather than spin:
- Never delete a call-out whose limitation is still true. You are changing tone and framing, not
  removing information.
- Keep every `<!-- caveat: arch-debt:<id> -->` marker and every debt-entry link exactly where it
  is. The marker is the audit trail; the cut-time checklist counts it.
- Never introduce a capability claim the code does not support. If you cannot state the boundary
  accurately from the debt entry and the surrounding docs, leave that call-out alone and say so in
  the PR — an un-rewritten honest warning beats a confident wrong sentence.
- Match each page's existing voice. Six debts across many pages does not mean one paragraph pasted
  eighteen times; if two call-outs on the same page say the same thing, that is a signal to write
  one good statement and cross-reference, not to duplicate.

## Deliverable

Commit to the branch (conventional docs message). Push explicit refspec:
git push origin docs/caveat-reframe:docs/caveat-reframe
Open a DRAFT PR (gh pr create --repo rickylabs/netscript --draft --base main), body containing
`Closes #1288`, a fenced ```acceptance-evidence``` block using **box-index** entries (not box text —
text keys break once boxes are ticked with citations), and a per-marker table: debt id, file, verdict
(rewritten / left-as-is), one-line reason. Honest verdicts; "left as is because I could not state it
accurately" is a legitimate row.
