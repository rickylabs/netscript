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

PLAN-EVAL: cycle 1 FAIL_PLAN (checklist-form; 6 fixes applied in f4ae089) → cycle 2 **PASS**
(run 32343592955, head f4ae089, all 8 plan-gate boxes; no required amendments). Hard stop
lifted; slice trail proceeds S5→S9. Mirror: plan-eval.md.

## Spike slices (post PLAN-EVAL PASS)

| Slice | Spike | Verdict (pre-registered criteria) | Evidence |
| --- | --- | --- | --- |
| S5 | K1 frame transport | **ADOPT sentinel-stdout** — 10/10 reps, 200/200 frames recovered (go + python3), 10000 log lines intact, deterministic malformed-diagnostic count (2504 planted lookalikes), ~125 MB/s demux over 1.25 GB hostile output/rep. Spec rule derived: demux MUST sentinel-scan the byte stream (line-anchored v1 lost 8–44 frames/rep to frames embedded in unterminated >PIPE_BUF log lines — kept as v1-lesson row). fd-3 branch **infeasible on Deno host** (Deno.Command has no extra-fd API) — socket transports (K3) are the alternative. | results/raw/k1.jsonl |
| S5 | K2 token delivery | **ADOPT env-pointer + bootstrap token for T0/T1** — /proc environ mode 0400 (same-uid-only); Deno clearEnv+env delivers exact allowlist (canary not leaked; only runtime-self-set LC_CTYPE appears — CPython PEP-538); stdin-first-frame verified (python3 27.5 ms p50 incl. interpreter start, sh 2.1 ms — final raw; IMPL-EVAL finding 2 fix) as T2 per-dispatch mechanism. Bonus finding: sandboxed deno tasks cannot read /proc at all (--allow-all gate, run-1 D-6 lineage) — further limits environ snooping from sandboxed tasks. | results/raw/k2.jsonl |
| S6 | K3 loopback | **ADOPT TCP 127.0.0.1 default** — sandboxed deno task with exact-port `--allow-net=127.0.0.1:PORT` reaches the bearer-gated surface (401 without token; token flow works; progress round-trip 0.49 ms p50 / 1.06 ms p95); wrong-port scope denied via NotCapable (per-task net scoping gates the surface); python3 client 0.67 ms p50. UDS: Deno unix listener + python3 client work at short paths, but Deno fetch() has no UDS support (deno-type tasks excluded) AND deep workspace paths exceed SUN_LEN (~108 chars) — UDS demoted to optional capability. Docker/Aspire survival untested in-container (recorded limitation). | results/raw/k3.jsonl |
| S6 | K5 stdin duplex cancel | **PASS → ADOPT T1 in-band stdin cancel** (optional capability) — cancel-ack during blocking MINSTD compute: go 3.5 ms p50 / 5.8 ms p95, python3 30.2 ms p50 / 43.1 ms p95 (GIL chunk granularity), 30/30 cancelled outcomes each, no runtime-specific flags. OS signals remain the non-cooperative backstop. | results/raw/k5.jsonl |
| S7 | K4 protocol overhead (REAL dispatch path) | **PASS all bars** — 6 series (BASE-go vs T1-go × direct/queue-c1/queue-c16), 1920/1920 executions, 0 failures, exact acc identity. T1 exec-wall delta +0.41 ms worst case (queue c1: 8.00 vs 7.59; direct −0.35 = noise) vs ≤1.0 ms bar; in-path host protocol cost (Zod envelope validate + sentinel demux + result validate) 0.06–0.10 ms p50 vs ≤0.5 ms bar; e2e c=16 delta −14% (noise-dominated) vs ≤5% bar. Envelope rode the EXISTING TASK_PAYLOAD mechanism — the D-1 fix shape needs no engine change to prove. | results/raw/k4_*.jsonl |
| S7 | K6 progress chain (replica) | **PASS** — steady 10 ev/s: 30/30 delivered, 92 ms p50 / 93.9 ms p95 (throttle-window dominated) vs ≤500 ms bar; burst 100 ev/s: 9.5× latest-wins coalescing, 12 ms p95, KV record bounded (84 B). Honesty rows recorded: KvExecutionState has NO progress mutation today (D-12 confirmed at API level — create/complete/get only); durable-stream producer requires the Aspire-hosted streams service → loopback sink stood in (transport cost bounded by K3 ~0.5 ms); SSE endpoint not exercised. | results/raw/k6.jsonl |
| S8 | Spike synthesis | results/results-spikes.md script-generated (report-spikes.ts); drift R5-D-1..6 recorded; **G1 PASS** (all six spikes on primary criteria, 0 unexplained failures, results script-generated) | results/results-spikes.md, drift.md |
| S9 | RFC authored | rfcs/0000-polyglot-task-protocol.md (319 lines): tiers/two-surfaces/envelope/errors/security/observability/packages/conformance + defect map D-1..D-14 + staged migration. **G2 PASS**: fmt-clean (deno fmt --check), zero TBD, every quantitative claim cites corpus file or spike result; L9 criteria honored — L9-1 tiers as specified (K4 held), L9-2 in-band T1 cancel included (K5 passed both testees), L9-3 loopback recommended all tiers (K3 sandbox-compatible), L9-4 no TaskType vocabulary change, L9-5 UNVERIFIED register carried into Unresolved questions. | rfcs/0000-polyglot-task-protocol.md |
| S10 | RFC revision (owner review R5-D-7) | Full reference-level redesign to the accepted-RFC bar (template + RFC 0001 precedent): wire schemas as normative Zod code, ports as TS interfaces (auth-blueprint composite+narrow+registry), package map with file-level placement, per-seam engine integration table (file:line + defect linkage + preserved-unchanged list), `withTaskProtocol` decorator code, builder API extensions with bound generics, outcome union type-safety story, citizen-surface oRPC contract + route/capability table, security algorithm, lifecycle state machine, T2 handshake, conformance case grammar, extension model (6 axes), edge-case resolution table, five-wave staged implementation plan with acceptance bars, evidence demoted to Appendix A. 319 → 803 lines, 3 → 26 code fences. G2 re-run: FMT-CLEAN, zero TBD. | rfcs/0000-polyglot-task-protocol.md |
| S10b | IMPL-EVAL cycle-2 fixes (FAIL_FIX, run 32358375889) | F1 corpus count 34→32 (RFC Summary + Prior art + PR body); F2 context-pack resume point refreshed to the S10/eval-cycle state; F3 PR body rewritten for the S10 head with the DoD verdict box re-opened; F4 full-path seam cite. Evaluator's design verdict on S10: "substantively sound and reference-complete" (Zod snippets hand-tested, seam cites verified, spike figures re-checked). Cycle-3 re-dispatch requested. | rfcs/0000-polyglot-task-protocol.md, context-pack.md, evaluate.md |
| S10c | IMPL-EVAL cycle-3 fix (FAIL_FIX, run 32359981617) | Single moderate finding F-1: Summary retirement claim "D-1..D-10/D-12/D-13" contradicted the RFC's own wave/seam tables — corrected to "D-1..D-9, D-12, D-13, D-14" with an explicit deliberately-outside note for D-10 (buffer capping = supervisor-side engine bug; frame cap/artifacts route reduce exposure only) and D-11 (out-of-scope item 10) under the wave table. Cycle-3 also confirmed all four cycle-2 fixes applied and re-verified every seam cite + spike figure. **Eval loop at its two-failure limit → escalated to owner** per evaluator/plan-protocol.md instead of a silent fourth dispatch. | rfcs/0000-polyglot-task-protocol.md |
