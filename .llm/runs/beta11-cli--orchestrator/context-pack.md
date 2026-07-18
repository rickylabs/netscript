# Context Pack — beta11-cli--orchestrator

Resume point for the beta-11 shipping-wave supervisor (session
`86d308d5-c761-4e5d-a41f-8be959bc46d2`, Fable 5 · low).

- **Mission**: ship milestone 13 (`0.0.1-beta.11`) — Desktop Frontend wave #840 (#841/#842/#843,
  #452/#456/#457), #826, seed run #824, docs track #814/#815/#816, CLI fixes #804/#802/#818.
- **State**: Wave SHIPPED (e193e018) + #858 merged. Remaining to cut: #815 B2–B5 (task 1), #816 in-cycle after #815 (task 2), #824 rev2→Sol·max adversarial→re-lock→owner ratify→file (task 3), then release-cut prep + HARD STOP (task 4). Autonomous lead authorized.
- **Branch topology**: integration `feat/desktop-frontend` for the wave; direct-to-main branches
  for independent groups; `plan/unified-runtime` for the #824 seed run; supervisor run-dir commits
  on `plan/beta11-shipping-wave`. Baseline `origin/main` @ ca72db14.
- **Stop-lines**: see `supervisor.md` § Stop-lines — repeated verbatim in every sub-brief; no
  main-merge without CI green + opposite-family PASS; release publish / milestone close = owner
  in-turn only; #824 drafts-only until owner ratification.
- **Routing**: all lanes from `.llm/harness/workflow/lane-policy.md`; Codex limit reset
  2026-07-17 (unrestricted); formal evals on OpenRouter Qwen open model only.
