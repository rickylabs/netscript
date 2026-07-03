# NetScript 0.0.1 Release Roadmap

NetScript ships on an **incremental-beta cadence**. Small bets land one at a time and each is
published as its own prerelease — exactly how the alpha line ran (`v0.0.1-alpha.1` …
`v0.0.1-alpha.19`, 19 prereleases cut over ~8 days via `deno task release:cut` +
`deno task release:publish`). The beta line mirrors that shape:

```
0.0.1-beta.1 → 0.0.1-beta.2 → 0.0.1-beta.3 → … → 0.0.1-stable
```

There is **no big-bang jump** from the first beta to stable. Betas may run for many iterations over
months; stable is reached incrementally.

## How to read a milestone

GitHub milestones hold the *bets* per beta; the *cadence* is the tag/release stream. A beta milestone
is "done" when its scoped bets land green, at which point a `beta.N` prerelease is cut. New betas
(`beta.4..N`) are inserted freely as further bets are scoped.

## Current milestones

| Milestone | Role |
| --- | --- |
| `0.0.1-beta.1` | **Minimal cuttable release of the current green state.** Not a positioning gate. Cut bar = soundness floor (#332), bench `conformance` gate green, `scaffold.runtime` e2e green, CI trio green, release machinery proven. No feature blockers. |
| `0.0.1-beta.2` | First incremental bets after the cut: nearest-term (wave:v1-min / p0-marquee) AI-stack + deployment deliverables, release-engineering gates, and the self-bench ≥0.90 regression bar (once bench decisions D5/OQ2 land). |
| `0.0.1-beta.3` | wave:v1 depth: fuller AI stack, deployment feature lanes, Aspire Deno runtime dogfood. |
| `0.0.1-stable` | **Terminal milestone carrying the falsifiable positioning verdict** — competitor-PAIRED run, multi-task breadth, full composite rubric (blocked on bench decisions D2/D5/OQ2). Extends all beta criteria. |
| `Backlog / Triage` | Accepted-but-unscheduled + untriaged. Assign to a release milestone once scoped. |

## What moved out of the first beta

The prior beta.1 bar was a heavy *positioning* gate. Under the incremental model:

- **self-bench t1+t2 test_pass_rate ≥0.90 median** → `beta.2` (regression detector; blocked on D5/OQ2).
- **competitor-PAIRED run · multi-task breadth · full composite rubric** → `0.0.1-stable` (the
  positioning verdict).

The positioning thesis and acceptance criteria live in `packages/bench/POSITIONING.md` (owned by the
road-to-stable lane, #301). This roadmap and that document must stay consistent: **positioning
verdict = a stable-line goal reached incrementally**, never a first-beta gate.

## Cutting a release

Release mechanics are one command each, and publishing stays in GitHub Actions via OIDC — never local.
See `.agents/skills/netscript-release`:

1. `deno task release:cut -- <version>` — bumps root + every workspace `deno.json` + `deno.lock`
   `@netscript/*` ranges, runs preflight / `publish:dry-run` / `ci --prod`, opens the release PR.
2. Merge the release PR.
3. `deno task release:publish -- v<version> --notes-file <intro.md>` — creates the GitHub Release
   (the publish trigger). `publish.yml` then publishes every `@netscript/*` member to JSR via OIDC;
   `e2e-cli-prod.yml` runs the published-CLI smoke afterward.
