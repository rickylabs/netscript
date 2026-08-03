# Context Pack — feat-milestone-orchestrator-artifacts--authoring

**Task**: author the three #1120 artifacts — orchestrator skill (role), milestone-run profile
(run), canary cadence (schedule) — against the ratified design doc
`.llm/harness/design/milestone-orchestrator-and-canary-cadence.md`. One draft PR, `Closes #1120`,
milestone 0.0.5. Effort low: authoring, not design.

**Hard constraints**:
- Skill = role, profile = run, cadence = schedule; a paragraph appears once, referenced elsewhere.
- `[observed]` (0.0.4 cut-trace) vs `[asserted]` markers carried into the artifacts; never promote
  an assertion into an earned rule.
- No publish mechanics (netscript-release owns), no routing tables (lane-policy owns), no label
  mechanism internals (`release:canary-label`, #1122, owns).
- Every gate specified: firing evidence (negative case) + explicit did-not-run distinguishability.
- Honesty rule: unticked criteria move with their issue (#1092/#1146 precedents); observational
  criteria → verification issue (#1090 pattern; one to file in 0.0.6).
- #1119 collision: do not deepen; "canary" in these docs = release canary.
- `.claude/skills/` stays generated (`deno task agentic:sync-claude`), then `agentic:check-claude`.

**State**: S0 done (run dir + plan.md outline). Next: draft PR, then S1 cadence → S2 profile →
S3 skill+mirror+validation → S4 verification issue + acceptance evidence.
