# NetScript `0.0.x` Release Roadmap

NetScript ships on an incremental **pre-1.0 release cadence**. Each coordinated release advances
the patch component of the normal semantic version: `0.0.2`, `0.0.3`, and so on. A canary that
proves a release uses that release's core version with a prerelease suffix:

```text
0.0.2-canary.1 < 0.0.2 < 0.0.3-canary.1 < 0.0.3
```

The repository never published plain `0.0.1`; its shipped history consists of immutable alpha,
beta, and canary prereleases. The first normal NetScript version is `0.0.2`.

## How to read a milestone

GitHub milestones name the normal release that owns the work. Open release milestones currently
run from `0.0.2` through `0.0.9`; `Backlog / Triage` holds accepted but unscheduled work. Assign the
explicit cut milestone. A `wave:*` label supplies scheduling context but may span several releases
and does not determine the milestone.

Each release is cut when its scoped work and acceptance gates are green. Additional scope moves to
a later `0.0.x` milestone rather than creating another prerelease train inside `0.0.1`.

## Release maturity

Normal `0.0.x` versions are still pre-1.0: public surfaces can change between releases and consumers
should pin exact versions. “Normal version” describes semantic-version precedence and publication
shape; it does not claim a frozen or 1.0-stable API.

## Cutting a release

Release mechanics are one command each, and publishing stays in GitHub Actions via OIDC—never
local. See `.agents/skills/netscript-release`:

1. Prove the target with `deno task release:canary -- <version>` and the canary-pinned production
   E2E workflow.
2. Run `deno task release:cut -- <version>` to bump every coordinated manifest, tracked workspace
   lock, and generated package-metadata asset; then run release readiness and open the release PR.
3. Merge the release PR.
4. Run `deno task release:publish -- v<version> --notes-file <intro.md>` to create the GitHub Release
   that triggers JSR publication.
