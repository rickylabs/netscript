use harness

# Adversarial/Collaborative Review — frontend contribution layer seed design

You are the **stage-2 adversarial reviewer** (Codex GPT-5.6 Sol, effort high) for the seed run
`.llm/runs/plan-frontend-contrib--seed/` on branch `plan/frontend-contrib`. The generator (a
Claude Fable 5 session) produced a design for the missing **plugin frontend contribution layer**.
Your mandate from the owner: **enhance, not ruin** — attack the design hard, but every finding
should either kill a real flaw or make the design stronger. The generator will integrate your
legitimate findings afterwards; you do not edit the design docs yourself.

## SKILL

Read these skills/files before reviewing (in order):

1. `.agents/skills/netscript-harness/SKILL.md` — run mechanics (you are the stage-F analog of a
   seed run; findings only, supervisor integrates).
2. `.agents/skills/netscript-doctrine/SKILL.md` + `docs/architecture/doctrine/07-composition-and-extension.md`
   — layering/extension laws the design claims to honor.
3. `.agents/skills/deno-fresh/SKILL.md` — Fresh 2.x mechanics (islands, routes, vite plugin).
4. The run artifacts, in this order: `research.md`, `plan.md`, `design/canonical/00-overview.md`
   through `06-doctrine-fit.md`, `design/examples/{dashboard,auth,ai,deploy}.md`.

## What to attack (minimum coverage)

1. **Upstream API claims** — the design's load-bearing facts: `App.mountApp(path, app)` semantics
   (basePath/middleware/layout interaction for mounted sub-apps), `fresh({ islandSpecifiers })`
   behavior in `@fresh/plugin-vite@1.0.8` (do dependency-resolved specifiers actually build?
   HMR? css handling? Preact dedupe interactions with the NetScript vite plugin?), lazy route
   modules via `app.route(path, MaybeLazy)`. Verify against the actual jsr sources
   (`https://jsr.io/@fresh/core/2.3.3/...`, `https://jsr.io/@fresh/plugin-vite/1.0.8/...`) or
   local cache — cite what you verify. If a mechanism claim is wrong or riskier than stated, that
   is a BLOCKER-class finding.
2. **Contract family** (`01-contracts.md`) — missing kinds/fields, schema-evolution traps,
   the `ComponentRef`/specifier resolution model, the pointer-axis (D2) vs thinness, zone enum
   design, `PluginHostState` adequacy (sessions, i18n?, CSP nonces?, base-path composition).
3. **Discovery/registry** (`03`) — generated-file set completeness, JSR explicit-exports
   friction, local-source vs jsr resolution differences, uninstall cleanliness, collision rules,
   quarantine mechanics, `deno check` gate realism.
4. **Host runtime** (`04`) — SSR/hydration gaps, the API proxy design (auth header forwarding,
   SSE, security of `/api/plugins/*`), CSS layering/scoping realism, nav integration, error
   containment claims (can a broken zone component really not break the page?), Tailwind
   restriction implications.
5. **DX** (`02`) — is the authoring story actually minimal? Hidden footguns (island props
   serialization, deno.json exports maintenance, dev-loop watch behavior for jsr-installed vs
   local-source plugins)? Would YOU enjoy authoring against this API? Propose concrete
   improvements.
6. **Worked examples** — do they hold against the real backend surfaces they cite
   (auth contracts, ai SSE chat, deploy op set)? Is the live-vs-starter split right for each?
7. **Plan** — wave ordering, gate realism, risk register completeness, owner-fork framing
   (any decision taken that should be a fork? any fork that has an obviously correct answer?).
8. **What's missing entirely** — i18n, a11y, CSP/nonce policy, mobile, versioned asset caching,
   plugin frontend testing story, performance budgets, anything the four consumers will need
   that the contracts cannot express.

## Output contract (findings only — DO NOT edit design docs)

Write exactly one file: `.llm/runs/plan-frontend-contrib--seed/adversarial-sol.md`, structured:

```
# Adversarial Review — Sol high (stage 2)
## Verdict summary        <3-6 lines: overall soundness + top risks>
## Findings
### S-1 <title>  [severity: blocker|major|minor|enhancement]  [area: contracts|discovery|runtime|dx|examples|plan|missing]
Claim under attack: <quote/cite file:line>
Evidence: <what you verified, with citations/urls>
Finding: <the flaw or enhancement>
Proposal: <concrete fix/enhancement the generator can apply>
### S-2 …
## Verified-claims log     <upstream/repo claims you checked and CONFIRMED, one line each>
```

Number every finding. Severity honestly: a `blocker` means the design as written would fail
implementation; `enhancement` means the design works but you propose better.

## Hard constraints

- Do NOT modify any file except creating `adversarial-sol.md` (and nothing under `packages/`,
  `plugins/`, `docs/`, `.github/`).
- No GitHub mutations (no PRs/issues/labels). No `deno cache --reload`. Do not delete lock files.
- Commit exactly once: message
  `plan(frontend-contrib): adversarial Sol findings (stage 2)`, then push with the explicit
  refspec `git push origin HEAD:refs/heads/plan/frontend-contrib`. Never bare `git push`.
- When done, end your final message with `DONE` on its own line. If blocked, end with
  `BLOCKED: <reason>`.
