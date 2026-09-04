# Context Pack: GitHub Copilot cloud lane for the NetScript harness

## Run Metadata

| Field          | Value                                            |
| -------------- | ------------------------------------------------ |
| Run ID         | `feat-copilot-cloud-harness--copilot-cloud-lane` |
| Branch         | `feat/copilot-cloud-harness`                     |
| Current phase  | implementation                                   |
| Archetype      | `6 - CLI / Tooling`                              |
| Scope overlays | docs, GitHub workflow                            |

## Current State

Harness run activated from `origin/main` at merge commit `1c9eeef1`. The owner requested research,
plan, review, and then a harnessed Copilot integration. Independent PLAN-EVAL passed at `c12796b85`;
implementation is authorized.

## Completed

- Clean worktree and branch created without touching the canonical clone's user-owned `deno.lock`.
- New typed matrix read from the merged head.
- Feature-tier deep-research route selected: Gemini 3.8 Flash high through native `agy`.
- Research generated in a separate native `agy` session, then corrected against current primary
  GitHub and OpenCode documentation.
- Copilot cloud capability preflight passed: `copilot-swe-agent` is assignable to this repository.
- Owner-ratified route: OpenCode GitHub Copilot first for every Copilot-supported matrix model
  except OpenAI, Anthropic, and Gemini; those remain on native Codex/ChatGPT, Claude, and Google
  `agy` subscriptions by default. Catalog-attested Copilot Gemini is allowed only after native `agy`
  is unavailable. Cloud Agent Tasks remains a measured implementation canary; no immediate OpenHands
  removal.
- OpenCode GitHub Copilot device OAuth is complete. Live catalog attestation exposed exact IDs
  `github-copilot/claude-fable-5.1`, `github-copilot/gemini-3.8-flash`, `github-copilot/kimi-k3`,
  and `github-copilot/grok-4.6`. Fable through Copilot is a same-model plan fallback only after the
  native Claude subscription returned its terminal limit; it does not change the default route.

## In Progress

- S7 guarded launch implemented; tests PASS 26/26, check PASS, Tier-A review PASS.
- Coordinator-approved closeout combines S8/S9 and S10/S11/S12; no live tasks or extra research.

- S6 credit decision/reservation implemented; tests PASS 20/20, check/lint PASS; Tier-A review PASS.
  Ledger lives outside the repository and valid prior-month accounting resets to zero.

- S5 exact catalog preflight implemented, scoped tests PASS 10/10, Tier-A review PASS.
- Fresh API entitlement correction: Agent Tasks live create is not available to Pro+ under current
  docs; coordinator requires Pro+/unknown to fail closed before network. Generic dry-run/status
  remain in scope; no cloud model support is inferred from OpenCode catalog. See drift.

- S1 pushed as `f4afe80c0`, PR comment posted; config tests PASS (5/5).
- S2 pushed as `38f213c8f`, matrix tests PASS (12/12), coordinator review PASS.
- S3/S4 combined with coordinator approval; resolver, profile, credential and parity tests green;
  substantive review PASS and tests 53/53. S5 catalog attestation is next. Implementation session `/root/copilot_harness_impl`
  (`gpt-6-astra`, low), starting head `ea31286ab`.

- Execute S1-S12 from `plan.md`; incorporate the six bounded notes in `plan-eval.md` without
  widening scope.

## Next Steps

1. Dispatch feature implementation through Astra low, preserving per-slice commits and proof.
2. Run the selected static, docs, and GitHub workflow gates, then separate-session IMPL-EVAL.
3. Live Copilot canary only after static gates and explicit owner authorisation (`plan.md` D9).

## Drift and Debt

- Drift: declared Fable→Muse plan route was unavailable; plan generated on the owner-authorised
  same-model Copilot Fable fallback (see `drift.md` 2026-09-04 plan-generation entry).
- Debt: none accepted.
