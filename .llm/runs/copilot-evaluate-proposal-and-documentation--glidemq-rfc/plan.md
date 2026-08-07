# Plan — copilot-evaluate-proposal-and-documentation--glidemq-rfc

Research/RFC run (evaluation-only, no framework code). Shape documented in
`.llm/harness/workflow/research-rfc-run.md` (authored by this run per the owner's request).

## Scope (from the owner's proposal, deliverables extracted)

1. Evaluate GlideMQ (avifenesh/glide-mq + docs + examples + dashboard) against NetScript's
   queue/KV seam architecture and plugins.
2. Map compatibility with backends NetScript must keep: Garnet, Deno KV, Redis, RabbitMQ,
   Postgres — "adapter layer maybe? You tell me".
3. Produce an exhaustive research corpus in the run dir; verdict → RFC (if positive) or rejection
   rationale.
4. Author a benchmark-reintroduction issue (legacy `netscript-start/benchmark` has no successor).
5. Review and document the naturally-followed workflow in `.llm/harness/workflow/`.

## Archetype / overlays

No package archetype is implemented; the evaluation *reasons about* Archetype 2 (queue/KV
integration seams) and Archetype 5 (plugins). Overlay: `SCOPE-docs.md` in spirit — all outputs are
run-dir markdown plus one workflow doc.

## Locked decisions

- **LD1** Evaluation verdict is **conditional-positive**: GlideMQ enters only as an adapter behind
  `MessageQueue` + as port vocabulary + design harvest; never a seam replacement (F1–F3).
- **LD2** All GitHub-facing outputs (RFC, issue) are drafts pending owner ratification and a
  separate-session PLAN-EVAL (blocked evaluator lane recorded).
- **LD3** The workflow doc freezes stage contracts, not the exemplar's folder tree (seed-run
  precedent).

## Open-decision sweep

OQ1 (Deno NAPI spike) — must resolve before Track A; gates nothing in this run. OQ2 (Aspire Valkey
resource) — safe to defer. OQ3 (port home package) — must resolve before Track B implementation;
safe to defer past this run. OQ4 (span naming) — safe to defer into #399 T1.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Sandbox cannot run OpenHands evaluators | recorded as blocked lane; RFC header carries pending-PLAN-EVAL status |
| glidemq.dev unreachable | source-of-truth repo docs read directly; mapping recorded in research.md |
| legacy benchmark repo 404 | recorded in drift; issue draft scopes the successor from first principles |

## Debt implications

None — no framework code touched. The RFC names future debt-avoidance rules (no GlideMQ types on
public surfaces).

## Deferred scope

Filing the issue; running the Deno spike; any adapter/port implementation; PLAN-EVAL of the RFC.
