# Tier-A review — #1355/#1360 repaired plan (pre-cycle-2)

Reviewer: `topic-features-0.0.7`, native Claude Opus 5 · high · Remote Control, session
`19621a0b-c6a0-47c6-b826-93c1634a6875`. Opposite-family to Codex author
`01a004f9-f033-7592-a0bc-63927753fb43`.

Subject: repaired plan at head `f7225be98c01b38f86712c1df0782aec06e34445`.

Verdict: **`PASS`** — all six required fixes discharged; cycle 2 may dispatch.

## Head and scope

| Check | Result |
| --- | --- |
| Author process | terminal |
| Tree | clean |
| local == remote == PR #1664 head | all `f7225be98c01b38f86712c1df0782aec06e34445` |
| PR | open **draft** |
| Diff `ed34105e2..f7225be98` | **run artifacts only** — `plan.md`, `research.md`, `worklog.md`, `drift.md`, `context-pack.md` |
| Full range `3fc0f2f92..f7225be98` | **no** `packages/**`, `plugins/**`, `docs/**`, or `deno.lock` |

No implementation leaked into a plan-repair turn.

## The six fixes, each verified against the file

| # | Required | Verified |
| --- | --- | --- |
| 1 | Record the fork ruling | **D8** at `plan.md:105` locks `{ queryKey: <svc>Queries.list.clientKey() } as const` defined after `<svc>Queries`, with the reasoning — not just the conclusion — carried at `:34` (A6: identity wrapper adds no policy) and `:105` (would require SDK 0.0.7). Open-decision row `:111` marked resolved. S1 `:200` restated to keep the SDK type surface unchanged: stale-doc correction, `clientKey()` JSDoc pointer, and match/mismatch semantic tests at `:124-126` |
| 2 | Lock generator-owned output paths | `:79`, `:113`, `:133` — owns exactly `apps/<app>/lib/<service>.ts`; the route-example `(_lib)/service-query.ts` is explicitly **init-owned**, and scenario 1 at `:266` restated against that boundary |
| 3 | `service generate` compatibility | `:82`, `:114` — `--dry-run` and `--force` govern client modules **and** Aspire helpers as one command; `:51` adds no-partial-write failure when a contract is absent |
| 4 | Name the documentation home | `:56`, `:112` — CLI contract/migration in `packages/cli/README.md`, hydration age in `packages/fresh/README.md`, "never `docs/**`"; both appear in S3's file list `:202` |
| 5 | Tighten scenario 3 | Rewritten: settle hydration/refetch first, **record a baseline** `users.list` count, then require the count to equal baseline **plus exactly one** after the mutation response settles, with the server-confirmed DOM value. Retains "merely spying on `invalidateQueries` is insufficient" |
| 6 | Housekeeping | Per-slice file lists now itemised for S1/S2/S3 (`:200-202`); the `workspace-mutator.ts` citation is qualified with line numbers at `research.md:65` |

Note **N3** is also discharged — `:55`, `:116`, `:140` record that the generator emits and documents
the current query-factory (L1/L2) dialect, with the L3 change explicitly unnecessary for identity
correctness.

## Two things the author did beyond the instruction

Both are worth recording because they show the ruling was internalised rather than transcribed.

1. **S2 (`:201`) adds an "SDK-0.0.6 compatibility" negative test.** The cycle-1 ruling turned on a
   case the original plan had not enumerated — a 0.0.7 CLI generating into a project pinned to
   `sdk@0.0.6`. The repair does not merely adopt direct emit; it adds a test that would fail if a
   future change reintroduced the coupling. That converts a one-time ruling into a standing
   guarantee.
2. **`packages/cli/src/kernel/assets/embedded.generated.ts` appears in both S2 and S3 file lists.**
   Template-only edits leave the shipped scaffold stale because the embedded barrel is what actually
   ships; including the regenerated barrel is the difference between a fix that works in the repo and
   one that works for users.

## Determination

Tier-A **PASS**. The plan is complete against the cycle-1 findings, no code was touched, and the
scenarios remain falsifiable. Cycle 2 dispatches on immutable head `f7225be98`.
