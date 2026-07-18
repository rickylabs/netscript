# Context Pack — beta11-cli--orchestrator

Resume point for the beta-11 shipping-wave supervisor (session
`86d308d5-c761-4e5d-a41f-8be959bc46d2`, Fable 5 · low).

- **Mission**: ship milestone 13 (`0.0.1-beta.11`) — Desktop Frontend wave #840 (#841/#842/#843,
  #452/#456/#457), #826, seed run #824, docs track #814/#815/#816, CLI fixes #804/#802/#818.
- **State**: Wave CODE-COMPLETE (7 groups merged into feat/desktop-frontend). 4 issues closed on main (#826 #802 #804 #818). BLOCKED ON OWNER: decision 1 (upstream-gap option A/B — upstream-op-verify-decision.md + -history.md) gates the wave→main PR; seed-run Stage-H ratification (PR #850) gates the #824 board. Docs: #858 in Sol audit; G13/G14 queued. Then release-cut prep (owner merges).
- **Branch topology**: integration `feat/desktop-frontend` for the wave; direct-to-main branches
  for independent groups; `plan/unified-runtime` for the #824 seed run; supervisor run-dir commits
  on `plan/beta11-shipping-wave`. Baseline `origin/main` @ ca72db14.
- **Stop-lines**: see `supervisor.md` § Stop-lines — repeated verbatim in every sub-brief; no
  main-merge without CI green + opposite-family PASS; release publish / milestone close = owner
  in-turn only; #824 drafts-only until owner ratification.
- **Routing**: all lanes from `.llm/harness/workflow/lane-policy.md`; Codex limit reset
  2026-07-17 (unrestricted); formal evals on OpenRouter Qwen open model only.
