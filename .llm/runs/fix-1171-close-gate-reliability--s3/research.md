# S3 research — reliable close-gate mechanics

Date: 2026-08-03

## Question

Can NetScript adopt or wrap a maintained checklist action for at least 80% of the close-gate, or
does its cross-issue acceptance/evidence contract require a focused rebuild?

## Survey

### `mheap/require-checklist-action`

- The action fails when an issue or pull-request body/comments contain incomplete Markdown
  checklists. It supports requiring a checklist, skipping descriptions by regex, struck-through
  inapplicable items, and mutually exclusive radio groups. Its documented triggers include
  `pull_request` `opened`, `edited`, and `synchronize` and issue edits.
- It is maintained: the repository was not archived and GitHub reported a latest push on
  2026-04-23 during this research.
- It evaluates one issue/PR number. It does not discover issues from closing keywords, select only
  acceptance/gate sections, map PR evidence to boxes in other issues, emit body hashes/`updatedAt`
  provenance, or perform race-aware mirroring.
- Sources: [repository and README](https://github.com/mheap/require-checklist-action),
  [Marketplace entry](https://github.com/marketplace/actions/require-checklist).

### Other checklist actions

- [`AhmedBaset/checklist`](https://github.com/AhmedBaset/checklist) detects checked/unchecked boxes
  in PR descriptions, but its advertised surface remains PR-body checklist detection rather than
  cross-issue acceptance evidence.
- [`adriangodong/actions-todo-bot`](https://github.com/adriangodong/actions-todo-bot) updates a
  status check from a PR TODO checklist, but does not advertise closing-issue discovery, evidence
  provenance, or issue mutation.
- [`wyozi/contextual-qa-checklist-action`](https://github.com/wyozi/contextual-qa-checklist-action)
  generates filename-contextual QA checklists; it solves checklist selection, not proof that
  acceptance criteria in closing issues have evidence.
- Marketplace/repository searches found maintained checklist helpers, but none covering the four
  NetScript-specific joins: PR closing keyword -> issue acceptance subset -> structured evidence ->
  provenance-safe mirror.

### GitHub-native task lists, issues, and sub-issues

- Markdown task lists render clickable boxes and expose completion progress in GitHub UI, but the
  issue REST representation still exposes the body as Markdown; arbitrary checkbox text/evidence
  is not a first-class acceptance object.
- Native sub-issues provide explicit parent/child relationships, state, and progress. The REST API
  can list/reprioritize/add/remove sub-issues, but this represents issue hierarchy, not acceptance
  boxes or evidence attached to individual boxes. Migrating acceptance criteria into one issue per
  box would materially change repository process and still would not supply evidence provenance.
- Sources: [About task lists](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/about-tasklists),
  [Adding sub-issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-sub-issues),
  [Sub-issues REST API](https://docs.github.com/en/rest/issues/sub-issues),
  [Issues REST API](https://docs.github.com/en/rest/issues/issues).

### Kubernetes Prow approval plugins

- Prow separates `/lgtm` review from `/approve`, derives approval authority from versioned OWNERS
  files, requires every changed file to be covered, and removes `lgtm` when the PR receives a new
  commit. It recomputes current intent from comments and exposes a continuously updated explanatory
  status/comment.
- This is not an acceptance-checklist implementation to adopt. Its applicable design lesson is to
  bind a verdict to current state, invalidate it when relevant state changes, retain an audit trail,
  and explain the missing requirement precisely.
- Sources: [Prow reviewers and approvers](https://docs.prow.k8s.io/docs/components/plugins/approve/approvers/),
  [Prow plugin overview](https://docs.prow.k8s.io/docs/components/plugins/).

## GitHub Actions failure modes and documented controls

### Re-runs retain the original run identity

GitHub documents that a re-run uses the same `GITHUB_SHA` and `GITHUB_REF` as the original event.
More generally, an Actions run is created from an event payload; re-running is not a new label/edit
event. Therefore the close-gate must use the payload only to locate `{repo, pr number}` and fetch
the PR, labels, comments, and issues through the API at execution time. A re-run can then observe
body/label edits even though its triggering event is old.

Source: [Re-running workflows and jobs](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/re-run-workflows-and-jobs).

### Trigger the state transition that matters

GitHub supports activity-type filters on `pull_request`, including `labeled`, `unlabeled`,
`edited`, and `synchronize`. The ready label transition must trigger a fresh run; label state used
inside the job must still be fetched live rather than trusted from `github.event.pull_request`.

Sources: [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows),
[Workflow syntax: activity types](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onevent_nametypes).

### Serialize competing runs, but still detect write races

GitHub's `concurrency` key groups runs and `cancel-in-progress: true` cancels an older run when a new
one supersedes it. A PR-number-scoped group prevents simultaneous close-gate workflows from racing.
It does not prevent a human issue edit between GET and PATCH, so the mirror must re-fetch
immediately before mutation, compare the expected body hash, and retry once from the new body.

Source: [Control workflow/job concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).

## Adoption comparison

| Candidate | Checklist completeness | Cross-closing issues | Structured evidence | Live API reads | Provenance | Race-aware mirror | Estimated coverage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `mheap/require-checklist-action` | yes | no | no | same issue/PR | no | no | <30% |
| GitHub task lists/sub-issues | UI/state primitives | hierarchy only | no | API available | issue timestamps only | no box mutation contract | <25% |
| Prow approve/lgtm | approvals, not boxes | no | approval comments | webhook/client state | audit comments/labels | invalidates on commit | conceptual only |
| Existing NetScript tools, rebuilt | acceptance subset | yes | yes | can require | can require | can require | 100% |

No maintained candidate covers at least 80%. Wrapping `mheap` would retain nearly all custom logic,
add a Node action/supply-chain dependency, and risk two parsers disagreeing about the gated subset.

## Decision record: REBUILD the focused mechanism

Rebuild the existing three validation tools around one shared contract rather than adopt or wrap a
third-party action.

Locked consequences:

1. Fetch PR/labels/comments/issues live at execution time; event context supplies identifiers only.
2. Parse fenced `acceptance-evidence` YAML into explicit issue + exact box text or `box-index`
   mappings. Retain the legacy em-dash list for one transition release with a deprecation warning.
3. Put `{headSha, evaluatedAt, issues: [{number, updatedAt, bodySha256}]}` on gate and mirror
   verdicts.
4. Treat `[post-merge]` boxes as visible non-blocking notices.
5. Make mirroring optimistic and idempotent: re-fetch before PATCH, compare hashes, retry once after
   a mid-air edit, and deduplicate one provenance comment by a stable marker.
6. Keep the `status:close-gate-override` escape hatch and make every failure state the exact repair.

This is a narrow rebuild, not a generalized Markdown/task engine. Shared parsing and provenance
live in `acceptance-evidence.ts`; the gate remains an independent read-only verifier after the
optional mirror.
