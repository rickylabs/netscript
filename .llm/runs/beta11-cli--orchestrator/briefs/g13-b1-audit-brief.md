use harness. You are the docs_audit agent (Codex · GPT-5.6 Sol · medium — opposite-family
single-pass CHANGESET audit per `.llm/harness/workflow/doc-audit.md`) for the G13 BATCH-B1
changeset of run `beta11-cli--orchestrator`, supervised by the Fable 5 orchestrator (86d308d5).

## SKILL

Read `.llm/harness/workflow/doc-audit.md` in full. Changeset: the six flagship README rewrites on
branch `docs/815-package-readmes` (this worktree; commits after origin/main, PR #861; packages
fresh, fresh-ui, sdk, service, cli, aspire). Generator evidence:
`.llm/runs/beta11-cli--orchestrator/slices/g13-815-readmes/worklog.md` (exists — verify, then
treat as context only). The generator recorded two drifts — including that issue #815's item 6
(unversioned `deno add`) FAILS on the pre-release line; verify that execution claim yourself and
give your own verdict on the exemplar-form deviation.

## Task — single-pass audit of the ENTIRE six-README changeset

Execute every accuracy gate YOURSELF: run every printed command/example against branch source or
the shipped beta.10 surface (sanctioned min-dep-age equivalents allowed — record which); verify
every API-at-a-glance row against `deno doc`; curl every link; mermaid syntax check; re-run
readme-standard (scoped to the six), tagline, docs:links; internal-wording grep;
cross-README consistency (voice, section order, no contradicting claims between the six and the
audited mcp exemplar on branch docs/814-mcp-readme). Changeset-scope failure modes: baseline
drift, false completeness, cross-page contradictions.

Write the Gate log to `.llm/runs/beta11-cli--orchestrator/slices/g13-815-readmes/audit-b1.md`
(per gate: command → observed → verdict), overall PASS or FAIL + fix list. Commit ONLY that
file, push `git push origin HEAD:refs/heads/docs/815-package-readmes`, comment the verdict on
PR #861. Do NOT edit the READMEs.

## Stop-lines (HARD — read twice)

1. Merge requires CI green + opposite-family eval PASS on the PR. Owner granted standing beta-11
   merge authorization (2026-07-17 in-turn) once that bar is met.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief. A sub-brief without the
   stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
