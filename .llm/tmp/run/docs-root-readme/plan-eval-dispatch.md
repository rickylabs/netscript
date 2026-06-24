use harness

# PLAN-EVAL — PR3 root README (docs/root-readme, PR #118)

You are the **PLAN-EVAL** evaluator for a harnessed docs-authoring run. You are a SEPARATE session
from the generator; do NOT author the README and do NOT implement. Read the plan + research, apply
the plan-gate, and emit a verdict. Run on `openrouter/minimax/minimax-m3`.

## SKILL

Activate and follow these repo skills before evaluating (read each `SKILL.md`; mandatory):

- `.agents/skills/netscript-harness` — the harness phase model, the PLAN-EVAL protocol, and the
  plan-gate you are enforcing. You are the Plan-Gate hard stop before any authoring slice.
- `.agents/skills/jsr-audit` — JSR rendering rules: confirm the plan's hero + diagram + link
  decisions actually survive the JSR scope-page renderer (the root README renders there too).
- `.agents/skills/netscript-doctrine` — package/plugin archetypes + the true public surface, so you
  can check the planned architecture story and 31-package map against reality, not invention.
- `.agents/skills/netscript-deno-toolchain` — `deno doc` / the toolchain, to spot-check any command
  or API the plan says the landing page will surface (e.g. the `@netscript/cli` scaffold command).

## What to read

1. `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md` — your protocol
   and checklist.
2. `.llm/tmp/run/docs-root-readme/research.md` — the re-baseline, ground-truth findings, dossier
   deltas.
3. `.llm/tmp/run/docs-root-readme/plan.md` — the locked design (D1–D5), gates, debt, pipeline. This
   is the artifact under evaluation; the `## Design` section is the core.
4. `.llm/tmp/run/docs-root-readme/sota-landing-dossier.md` — the deep-search research the plan draws
   on (competitor head-to-head, hero/diagram options, grouped package map, JSR-compat toolkit).
5. Spot-check ground truth: `packages/contracts/README.md` (the shipped PR2 convention the plan
   claims to align to) and the authoritative 31-package map in
   `.llm/tmp/run/docs-root-readme/deep-search-brief.md`.

## What to evaluate

- **Scope discipline**: SCOPE-docs — only `/README.md` + run artifacts; no source / `deno.json` /
  `deno.lock`. Confirm the plan does not silently widen.
- **Accuracy of the plan's claims**: Is the 31-package map authoritative and complete (incl.
  `@netscript/queue`)? Does the badge/voice convention actually match `packages/contracts/README.md`?
  Are the dossier deltas the plan flags (docs badge `docs-v1.0` → `docs-rickylabs.github.io-blue`;
  illustrative plugin captions; paraphrased blurbs) correctly identified?
- **JSR-safety of the locked devices**: ASCII hero (D2) + ASCII architecture canvas (D3 primary) +
  absolute-URL links (D5) — do they render on BOTH GitHub and JSR? Is the mermaid `<details>`
  enrichment correctly gated behind an always-visible ASCII precedent?
- **Voice doctrine**: banned tokens enforced; alpha signalled as a factual noun-phrase callout, not
  apologetic framing.
- **Gates adequacy**: are the run gates (scoped `deno fmt` on README, link sanity, package-map
  completeness, voice scan, render check) sufficient to certify the authored output?
- **Debt handling**: is the no-logo-asset finding correctly dispositioned (ASCII hero ships; banner
  is backlog, not a blocker)? Is the `@netscript/queue` reference-page risk reasonably tracked?

## Output

Write your verdict to `.llm/tmp/run/docs-root-readme/plan-eval.md` and post a PR-comment summary on
PR #118. Emit `PASS` or `FAIL_PLAN` with specific, actionable findings (cite plan section IDs
D1–D5 and gate names). Do not author the README. Lock hygiene: do not touch `deno.lock`, source, or
any `packages/`/`plugins/` files; only write `plan-eval.md` under this run folder.
