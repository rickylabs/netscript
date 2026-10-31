# Issue 2390 investigator

- Assignment: #2390, milestone 0.0.9, C1 fixes; coordinator #2474 / mc009e.
- Branch: `orch/divybot-6543850655`; baseline `e4875a56c13e91503b5f168e6fa6d95b093c5a8a` (initial main).
- Implementation: Codex, feature tier, owner-requested high effort.
- Evaluators: separate read-only Claude sessions, `claude-opus-5-5`, high effort, stdin closed. Owner override of the pinned matrix's normal evaluator routes; no same-family evaluation.
- Matrix queried with `deno task agentic:matrix --tier feature --json`: implementation sol/xhigh → muse_spark_1_3/xhigh; plan evaluation glm_5_3/provider_default → fable_5_1/low; implementation evaluation muse_spark_1_3/xhigh → opus_5/xhigh. Policy: 2 plan rounds, 5 implementation rounds; reuse each phase's evaluator session.
- Write surface: this run directory; new issue-2390 reproduction tests/fixtures under `plugins/sagas/tests/runtime/` or `packages/plugin-sagas-core/tests/`; small sagas/streams source fixes only if the fixture proves a remaining defect; dated lesson under `.llm/`. No exports, manifests, labels, milestones, release artifacts, lockfile or consumer application changes intended.
- Local-only scratch/evidence: project runs/artifacts or temporary files under `$TMPDIR`. Final report uses the excluded `.divybot-final-report.md` handoff.
- Scope changes must be recorded in drift.md before edits.
- Stop at READY. Coordinator owns merge and e2e-cli-gate. Local scaffold.runtime is forbidden for this assignment.
- Privacy: public artifacts omit machine identity, concrete local paths, session IDs and service bindings.
