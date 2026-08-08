use harness

# RFC-A implementation brief — typed SDK client contribution seam

You are the sole generator for a production-grade NetScript RFC. Work autonomously in
`/home/codex/repos/ns-rfc-sdk-client` on branch `docs/rfc-sdk-client-contribution`, based on
`origin/main` at `fac9e339042c`. You are Codex GPT-5.6 Sol at xhigh reasoning, full-access/bypass
permissions. Do not create a rival session or delegate the core RFC authorship.

## SKILL

- `netscript-harness` — activate the full harness and RFC/docs design run; maintain every mandatory run artifact.
- `netscript-doctrine` — evaluate the proposed public SDK/plugin extension seam against axioms, extension-axis law, layering, anti-patterns, and debt.
- `netscript-pr` — open and maintain a draft RFC PR to `main`, with correct labels, phase comments, and no premature merge/closure.
- `netscript-tools` — use repo-native validation and compact evidence tooling.
- `netscript-deno-toolchain` — inspect current public APIs through `deno doc` and native dependency/package tools rather than assumptions.
- `jsr-audit` — assess export and publish-surface consequences of the proposed SDK seam.
- `rtk` — reduce read-heavy command output without changing semantics.
- `codex-wsl-remote` — preserve the daemon-attached, mobile-visible session and explicit-refspec push safety.

## Objective

Turn Claude Fable 5's RFC-A proposal into the actual lightweight RFC required by `rfcs/README.md`.
The input is a starting proposal, not ground truth:

- proposal: `/home/codex/repos/netscript-fable5-remediation-plan/.llm/runs/plan-fable5-remediation-roadmap--seed/fable-5-remediation-plan/rfcs/RFC-A-sdk-client-composition.md`
- tracking issue: `#1348`
- related filed issues: `#1349`–`#1353`, plus live dependencies named by the proposal
- source roadmap PR: `#1347`

Re-baseline every claim against current `origin/main`, current docs, doctrine, exports, tests, and
live issue/PR state. Deeply analyze the type system and prove the proposed extension axis is both
general and minimal. Auth/headers are the first dogfood consumer, not a hardcoded special case;
prove a second non-auth contribution. Resolve or explicitly frame every design fork: contribution
ordering, conflict/duplicate policy, async request context, redaction, transport ownership,
generated-client ergonomics, oRPC alignment, plugin discovery, compatibility, failure modes,
inference budgets, and migration. Do not invent a parallel framework when an existing seam can be
unhidden or composed.

## Required output

1. Activate a new harness run at `.llm/runs/docs-rfc-sdk-client-contribution--rfc/` with
   `supervisor.md`, `research.md`, `plan.md`, `worklog.md` (including `## Design`),
   `context-pack.md`, `drift.md`, and a final handoff. Select `SCOPE-docs` plus every underlying
   package/plugin archetype the RFC describes; read the RFC process, doctrine files, gate matrix,
   plan gate, and evaluator protocol completely.
2. Produce `rfcs/0000-sdk-client-contributions.md` from `rfcs/0000-template.md`, keeping `0000`
   until maintainer acceptance. The RFC must be decision-complete enough to implement: motivation,
   terminology, exact public/type-level surface with realistic examples, invariants, composition
   and ordering law, security/privacy and redaction, compatibility/migration, rejected alternatives,
   unresolved questions safe for FCP, staged implementation plan, conformance/fitness gates,
   docs/scaffold implications, and issue/epic decomposition.
3. Treat Claude's prose as a design pack to challenge. Cite repository paths/symbols and primary
   upstream sources where relevant. Use focused type probes or non-product scratch proofs when they
   materially validate inference/ergonomics; do not implement framework code in this RFC PR.
4. Make an initial harness/bootstrap commit, push only with an explicit refspec, and open a draft PR
   against `main` in the same session. The PR must reference `#1348` without closing it, carry `rfc`,
   `type:docs`, `area:sdk`, `area:plugins`, `priority:p1`, `ci:skip-e2e`, `ci:skip-scaffold`, and
   exactly one lifecycle status. Move it to `status:plan-eval` only when the RFC is ready for Fable
   review. Never assign an RFC number, merge, create/close issues, or mutate milestones.
5. Commit in coherent slices with run-artifact updates and PR phase comments. Run the docs/RFC gates
   that actually apply and record exact evidence. Do not trigger PLAN-EVAL/IMPL-EVAL yourself: the
   root orchestrator will steer the existing Claude Fable 5 session for the cross-RFC review, then
   run the final Qwen adversarial pass.
6. Finish with a concise `final-handoff.md` containing PR URL/number, HEAD SHA, run-dir path,
   decisions made, unresolved questions, validation evidence, board reconciliation proposal, and
   exact instructions for the Fable reviewer. Then report back to the root orchestrator.

Quality bar: this must be a real architecture RFC that a maintainer can ratify and an implementer
can execute without guessing—not a lightly edited copy of Claude's draft. Preserve NetScript's
mission: maximum end-to-end type safety, thin composable seams, generated ergonomics, plugin-owned
extensions, observable failure, and no hidden magic.

