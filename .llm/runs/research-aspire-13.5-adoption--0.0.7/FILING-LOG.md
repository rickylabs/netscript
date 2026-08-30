# FILING-LOG — Aspire 13.5 epic (filed 2026-08-29 after coordinator ratification on research head `0ba8c2fcf`)

> After filing, GitHub is the single source of truth for titles, labels, milestones, and state; run
> docs keep their planning record (authority banner). Label `epic:aspire-13-5` created live and
> added to `.github/labels.yml`.

| Draft                              | Issue | Milestone | Labels                                                                                                        |
| ---------------------------------- | ----- | --------- | ------------------------------------------------------------------------------------------------------------- |
| epic-draft.md                      | #1712 | 0.0.7     | type:umbrella, epic:aspire-13-5, area:aspire, area:cli, area:tooling, priority:p0, status:triage              |
| 01-pin-bump-and-parity-gate.md     | #1713 | 0.0.7     | area:aspire, area:cli, area:tooling, epic:aspire-13-5, priority:p0, status:triage, type:chore                 |
| 02-runtime-verification-pass.md    | #1714 | 0.0.7     | area:aspire, area:tooling, epic:aspire-13-5, gate:e2e, priority:p0, status:triage, type:test                  |
| 03-fixture-recapture.md            | #1715 | 0.0.7     | area:telemetry, area:tooling, epic:aspire-13-5, priority:p1, status:triage, type:test                         |
| 04-generator-revalidation.md       | #1716 | 0.0.7     | area:aspire, area:cli, epic:aspire-13-5, priority:p1, status:triage, type:fix                                 |
| 05-literal-ports.md                | #1717 | 0.0.7     | area:aspire, area:cli, area:plugins, epic:aspire-13-5, priority:p0, status:triage, type:fix                   |
| 06-real-health-checks.md           | #1718 | 0.0.7     | area:aspire, area:cli, area:database, epic:aspire-13-5, priority:p1, status:blocked, status:triage, type:feat |
| 07-teardown-leak-check.md          | #1719 | 0.0.7     | area:agentic, area:tooling, epic:aspire-13-5, priority:p1, status:triage, type:fix                            |
| 08-typed-resource-commands.md      | #1720 | 0.0.7     | area:aspire, area:cli, area:database, epic:aspire-13-5, priority:p1, status:triage, type:feat                 |
| 09-skills-corpora-mcp-alignment.md | #1721 | 0.0.7     | area:agentic, area:cli, area:docs, epic:aspire-13-5, priority:p1, status:triage, type:fix                     |
| 10-e2e-gate-upgrades.md            | #1722 | 0.0.7     | area:cli, area:tooling, epic:aspire-13-5, gate:e2e, priority:p1, status:triage, type:test                     |
| 11-public-docs-refresh.md          | #1723 | 0.0.7     | area:aspire, area:docs, epic:aspire-13-5, priority:p2, status:triage, type:docs                               |
| 13-stale-surface-cleanup.md        | #1724 | 0.0.7     | area:agentic, area:cli, area:tooling, epic:aspire-13-5, priority:p2, status:triage, type:chore                |
| 12-next-wave-spikes.md             | #1725 | 0.0.8     | area:aspire, area:cli, epic:aspire-13-5, priority:p2, status:research, type:feat                              |
| plan.md D-5                        | #1726 | 0.0.8     | type:feat, epic:aspire-13-5, area:aspire, area:database, priority:p2, status:triage                           |

## Existing-issue actions (per `existing-issue-map.md`)

- #1280: unblocked by S6 #1718 (TS custom health checks are GA in 13.5) — relabel
  status:blocked→status:triage; milestone → 0.0.7 (ok)
- #1366: Aspire-side registration hook lands in S6 #1718; the framework half stays here (0.0.8) (ok)
- #1372: partial coverage via S10 #1722; the residual (compensation status, streams) stays here (ok)
- #1675: S9 #1721 depends on this landing first (ok)
- #319: upstream aspire#16218/#18627 are milestone 13.6; re-anchored by S4 #1716 and S12 #1725 (ok)
- #320: CommunityToolkit Deno TS projection spike = S12 #1725 (0.0.8) (ok)
- #413: 13.5.3 telemetry fixture arrives in S3 #1715 (ok)
- #411: resource-command vocabulary follows S8 #1720 (ok)
- #1507: author after S5 #1717 / S6 #1718 land (ok)
- #825: compile against the SDK pinned by S1 #1713 (ok)
- #1365: will be closed by the S5 PR (#1717) (ok)
- #1370: will be closed by the S5 PR (#1717) (ok)
- #979: pulled into S5 #1717 (OF-3a) (ok)
- #1371: will be closed by the S4 PR (#1716) (ok)
- #1429: will be closed by the S7 PR (#1719) (ok)
- #863: closed by S6 #1718 + S8 #1720 together (ok)
- #1642: will be closed by the S11 PR (#1723) (ok)
- #1000: will be closed by the S11 PR (#1723) (ok)
- #1280 relabel/milestone: ok
- 2026-08-30 — #1742 filed: Garnet executable host port 6379 (S5 IMPL-EVAL F-5 follow-up), labels
  type:fix area:cli area:aspire priority:p2 epic:aspire-13-5 status:triage, milestone Backlog /
  Triage.
