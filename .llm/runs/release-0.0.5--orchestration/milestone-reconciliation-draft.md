# 0.0.5 milestone reconciliation — DRAFT (not executed)

Owner instruction 2026-08-09: retain only earned stable blockers; move non-release work to its
already-intended future milestone **with recorded rationale**; do not cut stable with an open
milestone. To be executed **after** the #1404 S1–S3 merge and the S4/S5 completion chain, since
those change the picture.

20 issues open at drafting time (the owner counted 19 before #1411/#1413 were filed).

## A. In flight — resolve, do not move (3)

| # | Why it stays |
| --- | --- |
| #1102 | S1–S3 merging as #1404; S4/S5 completion PR is the approved next slice. Owner ruled it stays in 0.0.5. |
| #1411 | #1412 merging; **closed by #1404** once the regenerated corpus proves `failures=0`. |
| #1413 | #1414 at green-CI/merge. Release prerequisite, sequenced before the next canary. |

## B. Earned stable blockers — retain (6, proposed)

These are defects in the **public surface a 0.0.5 consumer touches**, or in the machinery that
produces a correct cut.

| # | Why it is earned |
| --- | --- |
| #1356 | Every `ui:*` command writes to the workspace root instead of `apps/<app>` — and the E2E gate asserts the wrong root, so the gate confirms the bug. A stable CLI that writes to the wrong directory is a shipping defect. |
| #1359 | `appRoutes.crudExample` aliases `serviceExample`, so `/examples/crud` is unreachable in every scaffolded app — and a template test asserts the alias. Same shape: the test encodes the defect. |
| #1373 | The golden path names three different client modules and two incompatible query APIs, and the quickstart points at a CSS entry. This is the first path a new user walks. |
| #1333 | The default scaffolded app is the product's first impression; `p0`. |
| #1379 | `packages/fresh-ui` is excluded from root check and lint and runs in no workflow — a published package with no gate. Same class as #1403/#1408: a gate that does not look where the code lives. |
| #1166 | Canary payload misses work landing behind a release PR via a merge commit. This can make a **canary note factually wrong**, and cadence membership is content-derived — it bears directly on C18's correctness. Assess against the actual C18 derivation before deciding; if C18's payload derives correctly, this can move. |

## C. Move to 0.0.6 with rationale (11, proposed)

| # | Rationale |
| --- | --- |
| #1343 | **Self-declared future work** — the title is literally `verify(0.0.6): …` and its provenance records relocation into 0.0.6 by owner decision on 2026-08-07. Its acceptance is already evidenced green against `0.0.5-canary.17` (raw exit 0, 76/76, zero leaks). The stable cut's own installed-consumer verification is a **release gate**, not this issue. |
| #1090 | Post-ship observational verification (six agents per arm) of whether the shipped agent surface changes agent behaviour. Cannot be answered before the thing ships. |
| #1137 | `[openapi-mcp S11]` — a wave slice of a larger epic, `status:plan`, no consumer-facing defect. |
| #1138 | `[openapi-mcp S12]` — docs for the same epic, `p2`. |
| #1197 | 0.0.4 retrospective on agent-init harness adoption. Agentic tooling, not public framework surface; owner has repeatedly ruled harness chores off the stable path. |
| #1338 | `chore(agentic)` evaluator default — internal routing config, no public surface. |
| #1108 | `docs(tooling)` verifying generated package references against live export maps — valuable, not a shipping blocker. |
| #1332 | Docs enhancement (generated DB schemas as normative predecessor). Additive. |
| #1334 | Docs enhancement (capability story on the landing page). Additive. |
| #1208 | Tutorial coverage of the page builder. `p0` by label, but additive documentation: no shipped surface is wrong without it. Flag to owner — this is the most debatable move in this table. |
| #1004 | Canary same-semver republish path after a mid-publish 503. Resilience improvement for a failure that has not occurred in this milestone; a wasted canary N is recoverable by cutting N+1. |

## D. Honesty constraints on execution

- Every move gets a comment on the issue stating **why**, referencing this reconciliation — no silent
  re-milestoning. That is the standard already applied to the nine-issue move receipt in `plan.md`.
- Nothing moves to make the milestone look finished. If an issue is an earned blocker, it stays and
  the cut waits.
- #1208 and #1166 are explicitly flagged as debatable and go to the owner rather than being decided
  unilaterally.
- Recount and re-read the live milestone from `gh` immediately before executing — not from this
  draft, which will be stale.
