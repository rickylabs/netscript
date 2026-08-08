# Context Pack: typed SDK client contribution RFC

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-rfc-sdk-client-contribution--rfc` |
| Branch | `docs/rfc-sdk-client-contribution` |
| Current phase | `research` |
| Archetype | `2 + 4 + 5 + 6` described; docs-only PR |
| Scope overlays | `SCOPE-docs` |

## Current State

The harness run is activated on the exact requested base. Required skills, RFC process, harness
authorities, doctrine, selected archetypes, relevant debt, and the complete carried-in RFC-A design
pack have been read. No product code or RFC draft has yet been authored.

## Completed

- Exact base/worktree/session/GitHub-auth verification.
- Harness/doctrine/RFC authority read and archetype/overlay selection.
- Bootstrap artifact creation while preserving the launch-generated `implement.md` and
  `codex-thread-ids.md`.

## In Progress

- Initial bootstrap commit, explicit-refspec push, and draft PR opening.

## Next Steps

1. Open the draft PR with the required labels and `status:research`.
2. Re-baseline live issues/PRs and current public/export/test surfaces through `deno doc` and
   focused source reads.
3. Run type probes and upstream primary-source research; lock design and author the RFC.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Keep `0000` and Draft state. | `rfcs/README.md` | Maintainer assigns number at acceptance. |
| Stop at external review handoff. | Owner brief | Generator must not trigger evaluator sessions. |
| No framework source in this PR. | Owner brief | Type probes live only under ignored/non-product `.llm/tmp/`. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/docs-rfc-sdk-client-contribution--rfc/` | new | Mandatory run artifacts plus existing launch records |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | after RFC draft |
| Fitness | planning | union selected from Archetypes 2/4/5/6; docs PR gates to be locked |
| Runtime | N/A for RFC PR | no runtime implementation |
| Consumer | research pending | API/type probes and current consumers |

## Open Questions

- All design forks in the task brief remain open until the re-baseline is complete.

## Drift and Debt

- Drift: runtime-controller identity miss recorded in `drift.md`; launch artifact remains the
  concrete session proof.
- Debt: no new debt; relevant existing entries are summarized in `plan.md`.

## Commits

- See the draft PR's commit list + per-slice PR comments (V3 retired `commits.md`).

