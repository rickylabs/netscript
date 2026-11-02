# Plan & Design — READY FOR REVIEW

Archetype 6 with service/frontend scope overlays. The owner approved the supplied issue contract and all implementation work. PLAN-EVAL: N/A: bounded sample expansion on existing CRUD, template and loader seams; no unresolved architecture decision or new public framework contract. Mandatory independent IMPL-EVAL remains selected.

## Locked decisions

- Model: id, reference, name, ownerName, ownerEmail, status, amount (integer minor units), currency, createdAt, updatedAt. Portable String status, narrowed to pending/awaiting_payment/paid/shipped/refunded/cancelled at the contract boundary. Database defaults preserve the existing name-only create flow.
- Seed: 40 unique REC references, realistic sample labels/owners, six statuses, varied USD amounts, 60 UTC days relative to an injectable anchor. Upsert by reference, update empty, so reruns preserve edits. Memory uses the same seed source and its existing transport envelope.
- List: stable sorting, status filtering, existing pagination; counts use the same where clause.
- Projection: server-only pure arithmetic with explicit clock, UTC calendar buckets, two adjacent 30-day windows including today, currency-separated totals/averages/deltas, zero-filled daily counts/amounts, all-time status counts and latest N. Zero baseline delta is null unless both values are zero. Never mix currencies or turn partial/error responses into success.
- Keep layouts/CSS unchanged. Extend existing table cells to reference, owner, status and amount; expose projections for the subsequent design run.

## Slices

1. Bootstrap plan and draft PR.
2. Contract/model/seed, then projections and minimal page adaptation, then semantic tests and runtime probe. Focused wrapper tests/check/lint/fmt and quality/architecture; independent read-only review before sign-off commit. Carriers regenerated in dependency order.
3. Final gate evidence, independent evaluation repairs if needed, current-head checks and READY handoff.

## Gates

Focused source check/test/lint/fmt wrappers; quality:gate; applicable CLI JSR audit; carrier chain; every root check:* task under Deno 2.9.7 (review-threads receives PR arguments). Live seeded generated app; canonical `deno task e2e:cli run scaffold.runtime --cleanup --format pretty` in CI through existing manual dispatch (draft PR/no-label policy otherwise skips PR jobs). Run root check/lint/fmt as applicable. Record all unproven or policy-skipped results honestly.

## Risks, decisions and debt

Currency mixing: aggregate per currency. Page truncation: separate complete projection loader with bounded fail-closed pagination. Default schema drift: verify placeholders and actual generated workspaces. Engine portability: use only Prisma String/Int/DateTime fields and engine-neutral seed operations. Large amounts: contract bounds and tests. Boundary math: fixed UTC tests. No open must-resolve decisions. No new architectural debt expected; legacy CLI layering unchanged.

Deferred: page design, new mutation UX, true event history, exchange conversion and arbitrary analytics query APIs. Latest records feed the existing records view; a new event store is outside the issue.
