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

1. **Deep search — DONE.** OpenHands `gemini-3.5-flash`. Output landed:
   `.llm/tmp/run/docs-root-readme/sota-landing-dossier.md` (347 lines, verified clean — dossier +
   OpenHands trace only, no lock/source churn). Fast-forwarded to `96063906`.
2. **Plan → PLAN-EVAL — DISPATCHED (awaiting).** `research.md` + `plan.md` authored + committed
   (`4bdf9eea`). PLAN-EVAL dispatched to OpenHands `openrouter/minimax/minimax-m3`, 100 iters →
   PR #118 comment 4793750208 (`plan-eval-dispatch.md`). ON LANDING: read `plan-eval.md`; need PASS
   before any authoring slice. FAIL_PLAN → fix plan, re-dispatch (2 cycles then escalate).
3. Author root README (Claude documentation-authoring exception). Not started — GATED on PLAN-EVAL
   PASS. Locked design in `plan.md`: ASCII hero (A), ASCII arch canvas primary, grouped 6-layer
   31-pkg map, badges/voice = shipped PR2 convention.
4. IMPL-EVAL (OpenHands qwen3.7-max, separate session) → merge. Not started.

## Commits

- `fda7f518`: docs(root-readme): PR3 deep-search brief (framework-landing research)
- `4bdf9eea`: docs(root-readme): PR3 research + plan (locked design, pre-PLAN-EVAL)

## Decisions carried in

- 4 locked publish decisions: align all to `0.0.1-alpha.1` (done); slow types accepted; lock regen
  allowed (version-driven only); publish via GH Actions OIDC on tag push.
- Voice doctrine: no "honest/honesty/honestly" or candor/apologetic-alpha framing.
- Authoritative 31-package map embedded in `deep-search-brief.md`.
