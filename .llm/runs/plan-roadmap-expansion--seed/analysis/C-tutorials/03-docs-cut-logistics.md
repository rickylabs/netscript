# Docs-cut logistics — what a Topic-C rewrite actually touches

Answers the topic-spec/task-prompt requirement to establish "what a docs-only beta.7 release cut
touches (site build, check:links, nav), and what #232 currently contains."

## Build/verify pipeline (`docs/site/deno.json`)

```json
"tasks": {
  "lume": "echo \"import 'lume/cli.ts'\" | deno run --unstable-temporal -A -",
  "build": "deno task lume",
  "check:links": "deno run --allow-read ../../.llm/tools/docs/check-internal-links.ts _site",
  "check:caveats": "deno run --allow-read ../../.llm/tools/docs/check-caveat-refs.ts .",
  "verify": "deno task build && deno task check:links && deno task check:caveats",
  "serve": "deno task lume -- -s",
  "diagrams:render": "deno run -A _diagrams/render.ts",
  "diagrams:check": "deno run -A _diagrams/render.ts --check"
}
```

`deno task verify` (build → check:links → check:caveats) is the minimum gate any tutorial rewrite
must pass before merge. Root `deno.json` additionally exposes `docs:links`, `docs:maintenance`,
`docs:readme:check` tasks. `diagrams:render`/`diagrams:check` only matter if a rewritten chapter adds
or changes a Mermaid/diagram source — known to be Windows-broken (render in WSL; see memory
`docs-diagram-render-wsl-workaround`), not CI-enforced (`diagrams:check` is not wired into CI today,
per memory `framework prime-time pivot` notes — verify this is still true before assuming it's a free
pass at rewrite time).

## Nav blast-radius — tutorial chapters are wired into 8 capability hubs, not just the Tutorials lane

`docs/site/_data.ts` (`navSections`, 242 lines) cross-links individual tutorial **chapter** URLs
(not just track index pages) as the "Quickstart" anchor for 8 unrelated capability-hub sections:

| Capability hub | Quickstart anchor points at |
|---|---|
| Web Layer | `live-dashboard` (track index) |
| Services & SDK | `storefront/02-catalog-service` |
| Background Processing | `erp-sync/03-polyglot-transform` |
| Durable Workflows | `storefront/04-checkout-saga` |
| AI & Agents | `chat` (track index) |
| Data & Persistence | `storefront/03-cart-contracts` |
| Identity & Access | `workspace/02-auth` |
| Orchestration & Runtime | `quickstart` (not a tutorial track — the standalone quickstart page) |
| Observability | `concepts` (not a tutorial track) |

**Consequence for the rewrite:** renaming, merging, splitting, or removing any of the 6 chapter slugs
in the middle column requires a corresponding `_data.ts` edit in the *unrelated* hub section that
references it — this is not visible from inside `docs/site/tutorials/` alone. A rewrite plan that
only diffs the tutorials folder will silently break nav links. This should be an explicit checklist
item in Stage D's design and Stage F's adversarial review, not discovered at merge time.

## GitHub issue #232 — current actual content (fetched via `gh issue view 232`)

#232 today is titled as a docs accuracy/coverage debt umbrella. Its checklist as fetched covers:
Run-2 storefront tutorial grounding fixes, DataGrid/Dropzone component reference-depth gaps, Aspire
telemetry doc gaps, streams-scoping documentation, workers-verification documentation debt. **None of
this checklist overlaps with "ground-up narrative rewrite."** The topic spec's instruction ("land
under #232") therefore requires an explicit **rescope decision**, not a simple additive edit:
options are (a) rescope #232's title/body to become the rewrite umbrella and re-file its current
accuracy-debt checklist as a new, separate issue, (b) keep #232 as the accuracy-debt umbrella and
open a **new** issue for the ground-up rewrite (referencing #232 without a closing keyword, since
neither fully resolves the other), or (c) nest the rewrite as a sub-issue of #232 reframed as a
parent epic. This is a genuine open question for Fable, not resolved here — see
`context/C-tutorials/open-questions.md` Q3.

## Milestone state (fetched via `gh api repos/rickylabs/netscript/milestones`)

Existing milestones at fetch time: `0.0.1-stable`, `Backlog / Triage`, `0.0.1-beta.3`,
`0.0.1-beta.4`, `0.0.1-beta.5`. **No `0.0.1-beta.6` or `0.0.1-beta.7` milestone exists yet**, even
though `specs/01-ratified-decisions.md`'s milestone train places the docs cut at beta.7. Fable/whoever
executes the milestone-mapping obligation from `AGENTS.md` (every issue needs a milestone) will need
to create `0.0.1-beta.7` before any Topic-C issue can be correctly filed — currently a blocking
logistics gap, not merely a note.

## Release-mechanics note

`.agents/skills/netscript-release`'s `release:cut` flow is a **package-version** release (bumps every
`@netscript/*` deno.json + republishes to JSR) — it is not, on its face, a "docs-only" release
mechanism. Memory note `main-missing-jsr-readiness-umbrella` and `docs-authoring-lane-claude-workflows`
both establish the existing practice: docs land as their own docs-only PR/wave merged to `main`
independent of a package version cut, to avoid dragging framework churn into a docs merge. The "beta.7
docs cut" in the ratified decisions should be read as "docs complete and merged by the time beta.7 is
cut," not as docs themselves being the trigger for a `release:cut` invocation — flagged as an
assumption for Fable to confirm, not verified against an explicit statement in `specs/01`.

## Locked tone/voice obligations that gate any rewritten prose

From `docs/site/_plan/08-decisions-locked.md` and `specs/01-ratified-decisions.md` (restated in full
in `research/C-tutorials/medusa-inspired-writing-style-contract.md`): warm "we", no hype adjectives,
no body emoji, "Alpha, API subject to change" maturity framing, and the hard ban on
"honesty/candor" framing. Every rewritten chapter's prose is gated on these, independent of Medusa
tone-matching.
