# Context Pack — PR3 root README (docs/root-readme, PR #118)

## Goal

Final docs PR of the "road to JSR publish" topology: author the root `/README.md` as a stunning,
enterprise-grade, truthful meta-framework landing page. Branch `docs/root-readme` off `main`
@ `f68fa916` (post PR1 #116 publish-mechanics + PR2 #117 package-README revamp).

## Topology

- PR1 #116 publish mechanics — MERGED (`2e11d655`)
- PR2 #117 package READMEs + /docs removal — MERGED (`f68fa916`)
- PR3 #118 root README — THIS (draft)
- Final: `publish:dry-run` green → release tag push → OIDC `deno publish`

## Branch / upstream landmine

`docs/root-readme` inherited `origin/main` as upstream. NEVER bare `git push` — always
`git push <auth-url> HEAD:refs/heads/docs/root-readme`.

## Pipeline state

1. **Deep search — DISPATCHED (awaiting).** OpenHands `openrouter/google/gemini-3.5-flash`,
   1000 iters, output=pr-comment → PR #118 comment 4790810265. Brief: `deep-search-brief.md`
   (harness-compliant, single-focus framework-landing, seeded by Track-2 in
   `.llm/tmp/run/docs-readme-revamp/sota-readme-dossier.md`, grounded in the real 31-package map).
   Expected output: `.llm/tmp/run/docs-root-readme/sota-landing-dossier.md` committed+pushed to the
   branch. ON LANDING: verify file set (only the dossier under this run folder), no lock/source churn.
2. Plan → PLAN-EVAL (OpenHands minimax-M3, separate session). Not started.
3. Author root README (Claude documentation-authoring workflow). Not started.
4. IMPL-EVAL (OpenHands qwen3.7-max, separate session) → merge. Not started.

## Commits

- `fda7f518`: docs(root-readme): PR3 deep-search brief (framework-landing research)

## Decisions carried in

- 4 locked publish decisions: align all to `0.0.1-alpha.1` (done); slow types accepted; lock regen
  allowed (version-driven only); publish via GH Actions OIDC on tag push.
- Voice doctrine: no "honest/honesty/honestly" or candor/apologetic-alpha framing.
- Authoritative 31-package map embedded in `deep-search-brief.md`.
