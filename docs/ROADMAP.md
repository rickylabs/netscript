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

Only the next release has a milestone named by a version (currently `0.0.9`). It holds the work
agreed for that release. The other open milestones are themes that own longer-running work, such as
`Frontend Contribution`, `Runtime Automation`, `Deploy Plugin`, `Enterprise Auth` and
`Process Manager`. `Backlog / Triage` holds accepted work that has no theme yet, waits on an
upstream change, or needs a decision. When a release starts, its scope is drawn from the themes.
Order within a theme comes from issue dependencies, not from milestone names. A `wave:*` label
supplies scheduling context and does not determine the milestone.

Each release is cut when its scoped work and acceptance gates are green. Work that misses a release
returns to its theme or moves into the next release milestone; it does not start another
prerelease train.

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
