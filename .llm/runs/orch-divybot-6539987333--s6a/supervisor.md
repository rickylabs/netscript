# S6a Utility delivery

Baseline: `c6bce8f86f5f9e0bf61d1b5bdb228b153de37d59`. Branch: `orch/divybot-6539987333`.
Implementation: Astra, high effort, feature tier. Separate read-only PLAN-EVAL and IMPL-EVAL: Claude Opus 5.5, high effort.

Owner overrides (verbatim):
> Relaunch on Astra (owner request; the earlier Sol trigger was withdrawn).
> PLAN-EVAL and IMPL-EVAL: `claude -p --model claude-opus-5-5 --effort high`, read-only.
> Draft PR, Refs #2419 only. No labels, no session ids.
> Post READY only after `gh pr checks` shows every required check green at that exact head; include the head. STOP at READY; Cockpit merges.

The queried feature matrix selects Sol/Muse for implementation, GLM/Fable for plan evaluation, Muse/Opus for implementation evaluation. Explicit owner selections override those routes; session and vendor separation remain mandatory.

## Authorized write surface

- `deno.lock`: the reviewed syntax-highlighter dependency only.
- `packages/fresh-ui/`: shipped registry CSS/components/blocks, existing contracts if necessary for state coverage, tests, generated registry carriers, README. No gap components from #2488. No Figma-owned token value changes.
- `packages/cli/`: init defaults, app/page/island templates, tests, generated assets.
- `docs/`, `README.md`, `.agents/`: affected default-preset examples and generated documentation carriers only.
- `.llm/tools/`: existing generation/validation tooling only if necessary; visual fixture work stays scoped to this run.
- `.llm/runs/orch-divybot-6539987333--s6a/`: public plan, review summaries, compact visual comparisons, memory and evidence using relative paths.
- Private logs/screenshots outside Git in the project run/artifact storage; final report in the excluded assignment handoff file.

No merge, release, force-push, labels, session ids in public artifacts, or assignment-file commit.

CI repair surface: `tools/fresh-ui-browser/` test matrix, README and reviewed accessibility baseline migration for the new default; no workflow or production changes inferred.
