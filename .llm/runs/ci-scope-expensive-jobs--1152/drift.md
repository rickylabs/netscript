# Drift — ci-scope-expensive-jobs--1152 (append-only)

- 2026-08-03 `minor` — #1151 was executed outside a run dir, per the owner brief's explicit
  "you may just fix, verify and push" waiver; its trail lives on PR #1153 (body + evidence
  comment) instead of harness artifacts.
- 2026-08-03 `minor` — PLAN-EVAL not yet dispatched: the evaluator lane (separate open-model
  session per `lane-policy.md`) is supervisor-triggered; this session stopped at the plan report
  as the brief requires ("Report your plan before implementing #1152").
- 2026-08-03 `significant` — **PLAN-EVAL superseded by direct owner ratification**: the owner
  reviewed the reported plan and instructed "reviewed and approved by me proceed and make the PR
  pass ci green so we can merge them; release cut for 0.0.4 is waiting". Recorded here as the
  owner-authorized fallback for the formal evaluator pass (release urgency). D5 (scaffold-static
  IS the deno-only tier; no third suite) is ratified implicitly by the approval.
- 2026-08-03 `minor` — Slices S1 and S2 were implemented as ONE commit (the intermediate
  S1-only state was throwaway); trail is otherwise per plan.
- 2026-08-03 `minor` — Scope addition by owner mid-run: bump all version-tagged actions to
  Node 24 majors (checkout/upload-artifact/download-artifact/setup-dotnet v5, pages trio
  latest). SHA-pinned third-party actions left pinned.
- 2026-08-03 `minor` — `quality` gate widened from plan's `needs_deno` to
  `needs_deno || needs_docs`: a docs-only PR still needs fmt/docs-accuracy — the plan's
  needs_docs step-level idea was dropped as unsafe (code changes can break docs accuracy too).
  `needs_docs` excludes agent-context Markdown (`.llm/`, `.agents/`, `.claude/`) so the #1055
  class skips everything.
