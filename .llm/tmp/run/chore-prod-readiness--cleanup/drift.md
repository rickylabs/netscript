# Drift Log — chore-prod-readiness--cleanup

Append-only. Severity ∈ {minor, significant, architectural}.

## D-G1-1 — "stray root file" directive vs. reality (significant)

- **Observed:** Handover §3.1's named stray root file `agents-handover.md` does not exist. The
  nearest real file, `AGENTS-handoff.md`, is **load-bearing** — cited by
  `.agents|.claude/skills/openhands-handoff/SKILL.md` (lines 44, 87) and
  `.llm/harness/workflow/agent-handoff.md:26` as the canonical OpenHands trigger protocol.
- **Impact:** Following the directive literally would have deleted a referenced doc and broken the
  `openhands-handoff` skill + harness-workflow references.
- **Resolution (user-directed 2026-06-18 — "if it's still valid then it should be a skill not a root
  .MD file"):** Relocate `AGENTS-handoff.md` content into the canonical
  `.agents/skills/openhands-handoff/SKILL.md`, re-point the 3 refs, delete the root file, regenerate
  the `.claude/skills/` mirror, `validate-claude-surface.ts` green. Atomic **Slice G1-0**; locked as
  plan **PR-4**. Supervisor `scorecard.md`/`phase-registry.md` phantom example corrected.
- **Status:** RESOLVED into plan (slice pending implementation).
