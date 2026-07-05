use harness

# Adversarial review brief — PR #471 (seed-run profile)

You are an **unoriented adversarial reviewer**. Your job is to attack this change, not to like
it. Do NOT implement fixes; produce findings only. Work read-only except for the single findings
file described at the end.

## SKILL

Read these first (they define the system you are auditing):

- `.agents/skills/netscript-harness/SKILL.md`
- `.llm/harness/workflow/lane-policy.md`
- `.llm/harness/workflow/run-loop.md`
- `.llm/harness/workflow/activation.md`
- `.llm/harness/workflow/supervisor.md` (the existing sibling run shape)
- `.agents/skills/netscript-pr/SKILL.md` (GitHub filing rules the new doc references)

## Subject

Branch `harness/seed-run-profile` (you are on it), 3 commits over `main`:

- `.llm/harness/workflow/seed-run.md` — NEW: "seed run" v3 run shape (stage contracts A–I for
  planning-only runs that end in owner-ratified GitHub filing).
- `.llm/harness/templates/supervisor.md` — NEW: template for the mandatory run-identity file.
- Wiring edits: `workflow/activation.md`, `.llm/harness/README.md`,
  `.agents/skills/netscript-harness/SKILL.md` + `.claude/skills/` mirror.
- Run artifacts under `.llm/runs/harness-seed-run-profile--codify/` (supervisor.md, research.md,
  plan.md, worklog.md, drift.md, context-pack.md).

Inspect the full diff: `git diff main...HEAD`.

## Attack surfaces (non-exhaustive — find what we did not think of)

1. **Contradictions with existing harness law.** Does seed-run.md contradict lane-policy.md,
   run-loop.md, activation.md, supervisor.md (workflow), evaluator protocols, or the
   netscript-pr filing rules anywhere? Quote both sides.
2. **Restated bindings.** The doc claims lane/model bindings live ONLY in lane-policy.md. Find any
   place it (or the wiring) restates a model binding, evaluator model, or lane routing that could
   drift.
3. **Executability by a fresh agent.** Could a fresh supervisor actually execute stages A–I from
   this doc alone? Find ambiguous contracts, undefined terms used before definition, missing
   proof criteria, circular references.
4. **The G→H boundary.** Is the "zero GitHub mutation before owner ratification" boundary
   watertight as written, or are there loopholes (labels? milestones? comments? the draft PR
   itself?) where an agent could argue mutation is allowed?
5. **Template soundness.** Does `templates/supervisor.md` cover everything lane-policy § Supervisor
   identity demands? Does activation.md's new Mandatory Artifacts entry conflict with any other
   doc that enumerates run artifacts (README, SKILL, run-loop, templates/)?
6. **Broken/ambiguous references.** Every relative link and file mention in the new/changed files —
   verify each resolves and points at the right concept.
7. **Mirror integrity.** `.claude/skills/netscript-harness/SKILL.md` must be byte-identical in
   content to the `.agents` source per the sync tool's rules.
8. **Overclaims.** Anything the docs assert as fact that the repo does not support (e.g. tool
   names, task names, file paths, PR/issue numbers).

## Output contract

Write findings to `/home/codex/seed-profile-adversarial-findings.md` as a table:
`| # | Severity (blocker/major/minor/nit) | File:anchor | Finding | Evidence (quote both sides) |`
followed by a one-paragraph overall verdict. Severity is your honest judgment; do not inflate.
If you find nothing at a severity level, say so explicitly. Do not edit any repo file.
