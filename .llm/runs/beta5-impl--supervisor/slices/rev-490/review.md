use harness

## SKILL

Read these repo skills before reviewing (under `.agents/skills/<name>/SKILL.md`):
- `netscript-harness` — review-phase context
- `netscript-doctrine` — package archetype + public-surface law
- `netscript-cli` — the CLI deploy surface under review
- `aspire` — Aspire deploy/publish semantics
- `rtk` — prefix read-heavy git/grep with `rtk`

## Role

You are an **unoriented adversarial reviewer** for draft PR #490 (`feat/347-deploy-s11`,
head 27b2c8b2) in rickylabs/netscript. You did NOT implement it; approach it as a skeptic
trying to find real defects. READ-ONLY: never commit, push, or edit files.

Your clone: `/home/codex/repos/netscript-rev490` (fetch the PR branch yourself:
`git fetch origin feat/347-deploy-s11 && git checkout feat/347-deploy-s11`).

The PR claims to land **issue #346's sibling, issue #347 (Deploy S11 — CI/CD templates)**.
Read `gh issue view 347` and PR #490's body/comments for the claimed scope.

Attack surfaces to probe (non-exhaustive — find your own):
- **Issue acceptance vs. delivery**: map each S11 acceptance item to the diff. List anything
  the PR summary claims that the code doesn't do.
- **Template honesty**: generated CI/CD templates (GitHub Actions or otherwise) — are the
  referenced actions/versions real, do the workflow YAMLs parse, do referenced repo tasks/
  commands actually exist (`deno task …` names, CLI verbs, paths)? Dry-run whatever is
  dry-runnable.
- **Scaffold codegen law**: if templates are emitted by `netscript` scaffolding, is the
  emission typesafe codegen where mandated (no string-template drift), and is output
  deterministic?
- **Config/type surface sync**: new config keys validated + typed + documented consistently;
  cast law (only the two sanctioned casts).
- **Test honesty**: would a typo'd template name / target / task name fail any test?
- **Sibling-scope bleed**: #346 (S10 cloud targets, PR #491) and #348 (S12) — flag file-level
  collisions or scope theft; #491 head is 33a87944.
- **Docs claims**: documented flags, env keys, and secrets names match code exactly.

Re-run relevant tests + scoped wrappers yourself. Do not trust the PR's claims.

Verdict: post ONE PR comment on #490 titled `**[PHASE: ADVERSARIAL-REVIEW] [Codex]**` with
verdict `CLEAN` or `CAVEATS` (numbered, each with file:line evidence and why it's a real
defect, not style). Style nits don't count.
