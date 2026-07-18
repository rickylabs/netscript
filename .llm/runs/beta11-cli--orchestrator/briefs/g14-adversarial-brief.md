use harness. You are LANE 5 (Codex · GPT-5.6 Sol · xhigh — the adversarial pass of issue #816's
owner-ratified pipeline) for the G14 main-README run of `beta11-cli--orchestrator`. Hostile by
design: your job is to break the README, not to like it.

## SKILL

Target: the root `README.md` on this branch (`docs/816-main-readme`, commit 2414293e, draft PR
#862). Generator evidence: `.llm/runs/beta11-cli--orchestrator/slices/g14-816-main-readme/worklog.md`
(`## Lane 4` claim→citation map) + the four fact sheets + `findings.md` in the same dir — verify
existence, then treat ALL of it as context only; every verdict comes from what YOU execute.

## Task — issue #816's lane-4 contract, executed hostile

1. **Hallucinated claims/verbs/flags**: execute EVERY command in the README verbatim in a clean
   temp dir (fresh scaffold; where the min-dep-age wall bites use the sanctioned
   `--minimum-dependency-age=0` equivalent and record it). Any command that doesn't run as
   printed is a finding.
2. **"Does the quickstart actually work on a clean machine"**: run the full quickstart start to
   finish, timing it — the README claims <5 minutes; verify or find against.
3. **Overpromising vs shipped truth**: check every capability sentence against the shipped
   surfaces (`deno doc`, `--help`, the audited package READMEs) — flag anything the beta.10 line
   doesn't actually deliver, and any missing honest-limitation line (Windows manual apply,
   unsigned installers, pre-release pinning).
4. **Broken/missing links**: curl every URL; verify every relative link resolves on GitHub
   rendering rules; the 35-row package map's links must hit the reworked #815 READMEs.
5. **Consistency**: no contradiction with the #814 mcp README, the #815 set, or the docs site
   (spot-check the five tutorial tracks + Start links); mermaid parses; tagline ≤250B; zero
   internal vocabulary (grep).

Write severity-tagged findings (BLOCKER/MAJOR/MINOR + PASS-notes) with per-finding evidence to
`.llm/runs/beta11-cli--orchestrator/slices/g14-816-main-readme/adversarial.md`, overall verdict
PASS or FAIL + fix list. Commit ONLY that file, push explicit refspec
(`git push origin HEAD:refs/heads/docs/816-main-readme`), comment the verdict on PR #862. Do NOT
edit the README.

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
