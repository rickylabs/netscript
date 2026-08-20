# Worklog — claude-harness-profile-rfc-benchmark-shzhgv--polyglot-protocol-rfc

## Slice log

| Slice | Content | Commit | Gate/evidence |
| --- | --- | --- | --- |
| S1 | Bootstrap: run dir, supervisor identity + owner lane overrides, branch restart on post-#1686 main, draft PR #1687 | 37eee0e | PR open, labels + research phase comment |
| S1b | Charter amendments: corpus destination in run dir, aggregate(Opus)/analyze(Fable) lane split | 232d654 | supervisor.md |
| S2 | Research corpus round 1: 8 source groups (faktory-sidekiq, celery-bullmq, lambda-lsp, temporal-durable, lifecycle-standards, orpc, openapi-codegen, ffi-interop) raw+analysis + engine audit (defect register D-1..D-14) | f621f27 | workflow wf_b44b6de1-078, 18/18 agents, 0 errors; critic gap list produced |
| S2b | Round 2 partial (stop-hook commit): security-scoping raw+analysis, callback-surface analysis, restate/conformance raws | 51060df | workflow wf_421332c6-2d7 in flight |
| S3 | Round 2 complete (restate-spec + conformance-harness analyses) + research.md synthesis | (this commit) | wf_421332c6-2d7, 7/7 agents, 0 errors; S9/S13 ratified with amendments |

## Research gates

| Gate | Result | Evidence |
| --- | --- | --- |
| All planned source groups ratified (8 round-1 + 4 round-2) | PASS | workflow results; failed_groups=[] both rounds |
| Critic pass between rounds (completeness probe) | PASS | round-1 critic verdict drove round-2 scope; weakest pillar (security) now evidenced |
| Every research.md claim cites a corpus file | PASS | research.md §1-§8 |
| Engine audit with file:line cites + defect register | PASS | netscript-engine-audit.md (D-1..D-14) |

## Design

Checkpoint (pre-PLAN-EVAL): plan.md locks L1–L7 (tiers computed from conformance; two-surface
architecture; closed versioned envelope with context; structured errors + terminal discipline;
reserved env namespace + per-attempt opaque token; capability negotiation over version
handshake with yanked registry; auth-blueprint package split). L8 defines six spikes (K1–K6)
with pre-registered decision criteria; L9 pre-registers the RFC's own verdict criteria; the
out-of-scope register applies the completeness-probe correction. Design risks named: K4
overhead bar is the series-credibility gate (protocol must not eat the 6ms exec-wall class);
K5 may legitimately fail (then T1 is signal-only, honestly); K6 must not touch plugin source
(replica harness). All decisions trace to research.md §2–§6 corpus citations.

PLAN-EVAL: **required** — dispatched via `openhands` + `status:plan-eval` on PR #1687. Hard
stop: no L8 spike slice starts before PASS.
