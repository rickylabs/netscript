# Context Pack — beta11-cli--orchestrator

Resume point for the beta-11 shipping-wave supervisor (session
`86d308d5-c761-4e5d-a41f-8be959bc46d2`, Fable 5 · low).

- **Mission**: ship milestone 13 (`0.0.1-beta.11`) — Desktop Frontend wave #840 (#841/#842/#843,
  #452/#456/#457), #826, seed run #824, docs track #814/#815/#816, CLI fixes #804/#802/#818.
- **State**: PLAN-EVAL PASS (f4666eee). Wave 1 ACTIVE: G1 #826, G2 #841, G4 #452 daemon-attached Codex threads (ids in phase-registry.md). Plan PR #846. Next: G2/G4 group plan-gates on their READY-FOR-REVIEW signal; G1 slice review on landing; then G3/G9/G10 + seed-run G8 kickoff.
- **Branch topology**: integration `feat/desktop-frontend` for the wave; direct-to-main branches
  for independent groups; `plan/unified-runtime` for the #824 seed run; supervisor run-dir commits
  on `plan/beta11-shipping-wave`. Baseline `origin/main` @ ca72db14.
- **Stop-lines**: see `supervisor.md` § Stop-lines — repeated verbatim in every sub-brief; no
  main-merge without CI green + opposite-family PASS; release publish / milestone close = owner
  in-turn only; #824 drafts-only until owner ratification.
- **Routing**: all lanes from `.llm/harness/workflow/lane-policy.md`; Codex limit reset
  2026-07-17 (unrestricted); formal evals on OpenRouter Qwen open model only.
