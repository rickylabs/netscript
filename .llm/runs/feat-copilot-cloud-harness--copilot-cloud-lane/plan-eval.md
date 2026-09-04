# PLAN-EVAL — feat-copilot-cloud-harness--copilot-cloud-lane

- Plan evaluator session: `ses_f9213f890ffelYPJ3h8zaNa8O4`, `glm_5_3` @ `provider_default` (zhipu
  family), separate from the Fable 5.1 generator (`ses_f92227a5affeSmWoi4FJ4jgLm7`); 2026-09-04
- Run: `feat-copilot-cloud-harness--copilot-cloud-lane` (draft PR #1991)
- Surface / archetype: repo-internal agentic suite `.llm/tools/agentic/` — Archetype 6 (CLI /
  Tooling) shape, not a published package
- Scope overlays: `SCOPE-docs` (touched Markdown) + GitHub workflow (labels, canary protocol)
- Route record: workload row `feature` (unprivileged); requested evaluator
  `glm_5_3@provider_default` per the `feature` PLAN-EVAL cell, first different-family candidate from
  generator `fable_5_1` (anthropic); same-family Fable fallback skipped. OpenCode Go failed closed
  before spawn with `provider_rate_limited`; the same logical GLM 5.3 evaluator ran through
  OpenRouter as the transport fallback. Evaluated at exact head `c12796b85` on
  `feat/copilot-cloud-harness`; working tree clean; branch diff vs `origin/main` was docs-only (this
  run dir only, 6 files).

## Checklist results

| Plan-Gate item                          | Result | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Research present and current            | PASS   | `research.md` exists, re-derived against `main` @ `1c9eeef1a` (2026-09-04); head nuance recorded in `drift.md` ("plan brief named research head `552ca9433`; later head authoritative"). Tree spot-checks all verified at exact cited lines: `MODEL_TRANSPORTS`/`MODEL_TRANSPORT_PRIORITY` (`runtime/delegation-matrix.ts:41-49,197-204`), deep-research gate (`:246-256`), transport bindings (`runtime/routing-policy.ts:106-128`), unavailability mechanism (`:78-81,143-157`), guard/parity tests, suite targets. Live re-proof: read-only `suggestedActors(CAN_BE_ASSIGNED)` GraphQL returns `copilot-swe-agent` for `rickylabs/netscript` today. |
| Decisions locked                        | PASS   | `plan.md` §2 D1–D14, each with rationale; owner rulings recorded in `supervisor.md` ("Owner routing ruling — 2026-09-04") and research §2/§4/§5/§7; attested connector IDs recorded in `worklog.md` receipts (2026-09-04T19:15Z). D1's single-insertion precedence verified against the actual resolver (`routing-policy.ts:150-156` sorts capabilities by transport priority; claude/codex/agy precede `github_copilot`, which precedes go/ollama/openrouter).                                                                                                                                                                                        |
| Open-decision sweep                     | PASS   | `plan.md` §3 OD1–OD10, each resolved or safe-to-defer with reason; evaluator-run sweep below found no unflagged rework-forcing decision.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Commit slices (< 30, gate + files each) | PASS   | `plan.md` §4: 12 slices, ordered config → matrix → resolver/prose → profiles/credentials → attestation → expense → receipts → dispatch → status/watch → wiring → instructions/canary → close; each names what it proves, the proving gate, and touched paths; largest slice ≤ 5 named paths (S9 fixtures keep it well under 30 files). All named target files verified to exist; `copilot/` group, `.github/copilot-instructions.md` correctly absent (created by S8/S11).                                                                                                                                                                             |
| Risk register                           | PASS   | `plan.md` §5: catalog drift, ledger under-count, wrong-family routing, deep-research leak, accidental billable dispatch, CI without review, secret leakage, parity/guard breakage, scope creep — each with a mapped mitigation (D4/D6/D1/D3/D9/D10/D7/S1/S3, D11/D13).                                                                                                                                                                                                                                                                                                                                                                                 |
| Gate set selected                       | PASS   | `plan.md` §6 from `gates/archetype-gate-matrix.md`: scoped static gates (check/lint/fmt/test over `.llm/tools/agentic` via the repo wrappers), universal F-subset + F-CLI-\* as `PENDING_SCRIPT` with manual/structural evidence per Phase A reporting, docs overlay (scoped fmt), GitHub workflow overlay with explicit label plan, runtime/consumer gates `n/a` (no scaffold/generated output), release-gate class `n/a` (matrix §"Release Gates" — no release cut, no scaffold/plugin/DB/Aspire/CLI-publish surface touched).                                                                                                                       |
| Deferred scope explicit                 | PASS   | `plan.md` §7 lists every deferral with its owning decision (D11, OD8, OD2, OD9, ruling 1, ruling 9, live canary execution). None force rework: all are additive later surfaces, not changes to S1–S12 outputs.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `plan.md` §6 and `research.md` §"jsr-audit surface scan": no `packages/**`/`plugins/**` export surface changes; all touched paths are `.llm/tools/agentic/**`, `.llm/harness/**`, `.github/**`, `.agents/skills/**`, root `deno.json`. Verified against the slice table.                                                                                                                                                                                                                                                                                                                                                                               |

## Open-decision sweep (evaluator-run)

Decisions I probed beyond the plan's own OD1–OD10:

- **Transport precedence mechanics** — verified, not open: the resolver sorts per-model capabilities
  by `MODEL_TRANSPORT_PRIORITY` (`routing-policy.ts:150-156`), so D1's single global insertion after
  `agy` realizes all five owner precedence rules without per-model orderings.
- **Family-aware deep-research eligibility** — verified, structurally sound: D3's family argument is
  derivable at both call sites (`resolveRouteChain` knows `definition.family`;
  `assertWorkloadModelAllowed` knows `MODEL_CATALOG[route.model].family`), and with no OpenAI
  Copilot capability (D2) the gate also makes Fable/Copilot deep-research structurally impossible.
- **Catalog attestation** — verified: `RouteAvailability.unavailableTransports`
  (`routing-policy.ts:78-81,143-157`) is the existing, tested unavailability mechanism D4 reuses;
  the guard test (`config/no-hardcoded-volatile_test.ts` Layers A/B) enforces the single-home rule
  for the new Copilot literals (Layer B catches `fable-5`, `gemini-3.8`, slug shapes outside
  `config/`).
- **Credential boundary** — verified: `lib/provider-credential.ts` and
  `runtime/provider-profiles.ts` (clearKeys) support "load no Copilot key, clear rivals"; the
  profile/policy types need only slice-level accommodation already flagged in `plan.md` §4 note and
  `drift.md` ("symbol-level shapes not read during planning").
- **Expense ledger semantics** — see bounded note 2 below; not rework-forcing (D5's data carries
  `resetUtcDay: 1`, and the fail-closed direction matches research §3).
- **Agent Tasks dry-run/live authorization** — verified: D9's three-flag live gate plus S8's
  "default is dry-run with zero fetch" test is the right fail-closed shape; no billable surface can
  be reached before the S11 canary protocol's owner authorization. Bounded note 1 below folds in
  research's token-capability preflight.
- **Deferred items** — none force rework: native Copilot CLI (D11), cancel/steer (OD8), CI-approval
  relaxation (OD2), promotion/retirement (OD9), OpenAI-via-Copilot,
  `.github/skills`/`.github/agents`, and live canary execution are all additive future surfaces;
  none invalidate S1–S12 outputs.

None of the probe results would force rework when deferred.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

N/A — every Plan-Gate box is checked.

## Notes

Bounded, non-blocking corrections for the implementation slices (none change a locked decision or
the slice structure):

1. **Token-capability preflight (S8 or S10).** Research §4 requires "a non-billable permission
   preflight before any dispatch", but no slice explicitly allocates it. Fold a read-only capability
   probe (or `gh-token` capability check) into S8's live path / the S10 `agentic:copilot-preflight`
   tool so the first authorized canary fails closed on missing permissions before any billable POST.
2. **Ledger month-rollover semantics (S6).** D5 lists "missing/stale/malformed ledger" as block
   conditions; S6 must distinguish stale-because-rolled-over (entries older than `resetUtcDay: 1`
   re-zero) from malformed, so the guard fails closed on genuine anomalies without wedging every
   launch after the monthly reset. D5's `resetUtcDay: 1` already implies this; make it explicit in
   the S6 tests.
3. **`lane-policy.md` deep-research prose (S3).** S3's parenthetical names "provider order +
   paid-route section"; D3 also changes the truth of the "Deep-research route" prose section
   (Copilot Gemini allowed for the `google` family), which the parity test does not cover (it checks
   only the two generated tables). Include that section in S3's touch so prose parity actually
   holds.
4. **PR-body DoD reconciliation (S12).** The PR #1991 body's DoD still says "steering, cancellation
   … paths are automated and tested", which D10/OD8 defer (no public stop or typed steering
   endpoint; UI stop / `@copilot` comments are recorded human actions). "Run closes truthfully"
   requires S12 to reconcile the PR-body DoD wording with the ratified boundary.
5. **Artifact currency / hygiene (supervisor-side).** `supervisor.md`'s plan-route-attempts closing
   line ("No generator produced plan content … PLAN-EVAL remains blocked") is stale at head
   `c12796b85` — `drift.md` and the `plan.md` header record the actual Fable-via-Copilot generation;
   update on the next supervisor touch. PR label `area:agent-tooling` is not in `.github/labels.yml`
   (canonical: `area:tooling` per `plan.md` §6); the docs-only draft should carry
   `ci:skip-e2e`/`ci:skip-scaffold` with the selection recorded in the phase comment, and an
   explicit milestone. These are outside this review's write scope.
6. **Cosmetic.** `plan.md` §2 D8's row is malformed (unescaped pipes split the cell); the decision
   is unambiguous via S8/S9, D9/D10, and `worklog.md` "Commands"
   (`agentic:copilot-task dispatch|status|watch`). The plan's numbered "ruling" references are
   shorthand; their substance is recorded (research §2/§4/§5/§7, `supervisor.md` owner ruling) and
   was verified during this sweep.
