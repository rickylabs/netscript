# Research — ci-docs-openhands-gate--docs-accuracy

## Re-baseline

- Carried-in source: owner-ratified slice prompt dated 2026-07-17.
- Re-derived against `origin/main` @ `63b8bae45309e4b16067c1ee6258d6834a123d61` on 2026-07-17.
- The target branch is clean at that SHA and has no remote ref. `.llm/harness/workflow/doc-audit.md`
  is absent, so the requested fallback document is required pending consolidation.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | The approved config value is `minimax/minimax-m3`; OpenHands trigger syntax adds the `openrouter/` provider prefix. | `.llm/tools/agentic/config/models.ts`; `.agents/skills/openhands-handoff/SKILL.md` |
| 2 | OpenHands accepts `@openhands-agent` issue comments only from OWNER/MEMBER/COLLABORATOR and checks out the PR branch for PR comments. | `.github/workflows/openhands-agent.yml` request job |
| 3 | A comment made with the default `GITHUB_TOKEN` cannot chain into the OpenHands `issue_comment` workflow; `PAT_TOKEN` is required. | `AGENTS-handoff.md`; OpenHands handoff skill Token Rule |
| 4 | The existing OpenHands summary marker is `<!-- openhands-agent-summary -->`; it can distinguish an unanswered trigger from a later workflow response. | `.github/workflows/openhands-agent.yml`; `.llm/tools/agentic/lib/agentic-lib.ts` |
| 5 | PR #787 validated Actions changes by parsing workflow YAML and asserting trigger/job structure. | commit `0daa575b`; its run `worklog.md` |
| 6 | `.agents/skills` is authoritative and `deno task agentic:sync-claude` regenerates `.claude/skills`; check mode exists. | `deno.json`; `.llm/tools/README.md` |
| 7 | Owner refinement makes command/snippet/scaffold testing conditional on executable claims; full-file accuracy and hallucination review remain mandatory. | owner message, 2026-07-17 |

## jsr-audit surface scan (package/plugin waves)

- N/A: this is GitHub Actions, prompt, harness documentation, and label-taxonomy work. No package,
  plugin, export map, dependency, or published TypeScript surface changes.

## Open questions

- None. All behavior, route, skip, dedupe, documentation, and prompt obligations are owner-locked.
