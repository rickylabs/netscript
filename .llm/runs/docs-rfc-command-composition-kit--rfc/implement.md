use harness

# RFC-B implementation brief — production command composition kit

You are the sole generator for a production-grade NetScript RFC. Work autonomously in
`/home/codex/repos/ns-rfc-command-kit` on branch `docs/rfc-command-composition-kit`, based on
`origin/main` at `fac9e339042c`. You are Codex GPT-5.6 Sol at xhigh reasoning, full-access/bypass
permissions. Do not create a rival session or delegate the core RFC authorship.

## SKILL

- `netscript-harness` — activate the full harness and RFC/docs design run; maintain every mandatory
  run artifact.
- `netscript-doctrine` — evaluate the cross-package command seam, runtime boundaries, extension
  axes, layering, anti-patterns, and debt.
- `netscript-pr` — open and maintain a draft RFC PR to `main`, with correct labels, phase comments,
  and no premature merge/closure.
- `netscript-tools` — use repo-native validation and compact evidence tooling.
- `netscript-deno-toolchain` — inspect current database/service/contracts/telemetry APIs through
  native Deno tools.
- `jsr-audit` — assess public export, subpath, slow-type, and publish-surface consequences.
- `netscript-cli` — analyze generated service/schema/worker surfaces and the proposed explicit
  generators without changing them.
- `rtk` — reduce read-heavy command output without changing semantics.
- `codex-wsl-remote` — preserve the daemon-attached, mobile-visible session and explicit-refspec
  push safety.

## Objective

Turn Claude Fable 5's RFC-B proposal into the actual lightweight RFC required by `rfcs/README.md`.
The input is a starting proposal, not ground truth:

- proposal:
  `/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/rfcs/RFC-B-command-composition-kit.md`
- tracking issue: `#1361`
- related filed issues: `#1362`–`#1364`, plus live dependencies named by the proposal
- source roadmap PR: `#1347`

Re-baseline every claim against current `origin/main`, current docs, doctrine, exports, database
adapters, services SDK, contracts, telemetry, workers, sagas, tests, and live issue/PR state.
Determine the smallest honest public composition seam for one-store transactional commands. Prove
where atomicity ends, how optimistic concurrency and idempotent replay compose, how audit/outbox
records share the commit, and how the relay boundary joins workers/sagas without exactly-once
fiction. Resolve or explicitly frame store capabilities, receipt ownership/schema generation,
canonical request hashing, actor/correlation propagation, typed errors, isolation, failure
injection, telemetry cardinality/redaction, adapter portability, and the precise refusal boundary.
No billing-specific vocabulary and no speculative distributed transaction framework.

## Required output

1. Activate a new harness run at `.llm/runs/docs-rfc-command-composition-kit--rfc/` with
   `supervisor.md`, `research.md`, `plan.md`, `worklog.md` (including `## Design`),
   `context-pack.md`, `drift.md`, and a final handoff. Select `SCOPE-docs` plus every underlying
   archetype required by the described service/database/contracts/telemetry/runtime surfaces; read
   the RFC process, doctrine, gate matrix, plan gate, and evaluator protocol completely.
2. Produce `rfcs/0000-command-composition-kit.md` from `rfcs/0000-template.md`, keeping `0000` until
   maintainer acceptance. It must include exact contracts and examples; semantic laws; adapter
   capability matrix; transaction/idempotency/audit/outbox invariants; worker/saga boundary;
   security/privacy; typed failure model; OTEL vocabulary; injected-failure conformance plan;
   compatibility/migration; rejected alternatives; unresolved FCP questions; staged implementation;
   docs/scaffold impacts; and issue/epic decomposition.
3. Challenge Claude's proposal against actual code and primary database/runtime documentation. Use
   focused non-product probes when needed to validate adapter or type claims. Do not implement
   product/framework code in this RFC PR.
4. Make an initial harness/bootstrap commit, push only with an explicit refspec, and open a draft PR
   against `main` in the same session. Reference `#1361` without closing it; carry `rfc`,
   `type:docs`, `area:service`, `area:database`, `priority:p1`, `ci:skip-e2e`, `ci:skip-scaffold`,
   and exactly one lifecycle status. Move to `status:plan-eval` only when ready for Fable review.
   Never assign an RFC number, merge, create/close issues, or mutate milestones.
5. Commit coherent slices with run-artifact updates and PR phase comments. Run applicable docs/RFC
   gates and record exact evidence. Do not trigger PLAN-EVAL/IMPL-EVAL yourself: the root
   orchestrator will steer the existing Claude Fable 5 session for cross-RFC review and then run the
   final Qwen adversarial pass.
6. Finish with `final-handoff.md`: PR URL/number, HEAD SHA, run-dir, locked decisions, unresolved
   questions, validation evidence, board reconciliation proposal, and exact Fable-review handoff.
   Report back to the root orchestrator.

Quality bar: the RFC must make the seam implementable without hiding store limitations, must reuse
existing NetScript primitives, and must preserve contract-first/type-safe/observable composition. It
is a narrow production command kit—not a billing framework, ORM, event-sourcing platform, or
distributed transaction claim.
