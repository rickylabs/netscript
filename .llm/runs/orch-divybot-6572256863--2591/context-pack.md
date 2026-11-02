# Resume — issue 2591

PR: https://github.com/rickylabs/netscript/pull/2592 (draft; Refs #2591).
Branch `orch/divybot-6572256863`; baseline `6766130bbafbe78a9bb5870f704987cb0743c5e6`.
S1 commit `321eca9b9c53d7ac7b12e832d09b9c43c861bde7`; repaired source candidate
`41fb51d1bcf48094b57265c87020654725ed2784`. This final sign-off commit changes run evidence only.

S1 and S2 independently PASS, same separate cross-family Opus session throughout. See
s1-review.md and s2-review.md. Event-driven post-seed observation uses existing durable
idempotency; plugin install --service persists managed service links and preserves manual links.
The documented block includes explicit stream service selection and detached Aspire startup.

behavior.documented-scaffold runs after static init and before all link/restart repair fixtures.
It reads the actual docs and runs skip-seed-handoff, drop-link and restored in pristine Postgres
workspaces. It requires real seed-correlated completion, actual stream/HTML Activity, stable
resident worker PID and exact AppHost/container cleanup. Read-side retries are test observation
only. The first live candidate exposed a public DTO mismatch; see memory-runtime-contract.md.

Deno 2.9.7: 191 focused test/step results PASS, all 21 owned-source check/lint/fmt files covered,
root check 4206 files PASS, broader quality PASS, CLI/workers JSR audits PASS with existing
warnings. Four carrier generators and all 15 root check tasks PASS with no generated drift.
See validation.json for source hashes and actual local summaries. RTK and local Docker unavailable.
No full local runtime claimed. Owned local reproduction AppHost stopped; foreign resources left alone.

Next: run canonical one-pass scaffold.runtime CI at this sign-off head; require both controls RED
for their precise symptoms and restored PASS, plus canonical cleanup. Complete all remote checks
and same-session independent evidence review, then put final exact-head evidence on PR 2592.
Keep head fixed once accepted. Write READY with the full SHA by atomic ignored final-report file
handoff only; file creation queues publication, not confirmation of posting. Never commit the
assignment or final report. Preserve draft/no-merge canary hold; Cockpit reviews and merges.
No rebase or force push. Public artifacts use repo-relative paths. No accepted product debt.

Latest steering: 650fb2e runtime CI passed the seed control/Activity/exact cleanup, then failed
recursive scratch deletion with PermissionDenied. The S3 repair retains generated workspaces and
reduces repeated success logs to preserve all variant receipts. See memory-runtime-workspace-retention.md.
Final acceptance is still pending; the latest PR head and exact CI run supersede earlier candidates.

S3 source review now PASS (s3-review.md). Independent rerun: 31 focused tests plus changed-file
check/lint/fmt; broader quality also passes. The sign-off commit retains generated scratch after
exact runtime cleanup, with all acceptance assertions unchanged. Run the final one-pass CI at
this next pushed head and use its full SHA, never an earlier failed candidate, for READY.
