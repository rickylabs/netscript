# Contributing to NetScript

Thanks for your interest in contributing. This guide covers how work is proposed, tracked, reviewed,
and released. By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

Start with [`AGENTS.md`](AGENTS.md): it is the entry point for the operating rules, read order,
tooling, and validation that every change follows.

## Where things go

| I want to…                                   | Go to                                                                 |
| -------------------------------------------- | --------------------------------------------------------------------- |
| Ask a usage question                         | [Discussions → Q&A](https://github.com/rickylabs/netscript/discussions/categories/q-a) |
| Float a rough idea                           | [Discussions → Ideas](https://github.com/rickylabs/netscript/discussions/categories/ideas) |
| Report a bug                                 | [New issue → Bug report](https://github.com/rickylabs/netscript/issues/new/choose) |
| Request a scoped feature                     | [New issue → Feature request](https://github.com/rickylabs/netscript/issues/new/choose) |
| Report a docs problem                        | [New issue → Documentation](https://github.com/rickylabs/netscript/issues/new/choose) |
| Propose a substantial / breaking change      | [RFC process](rfcs/README.md)                                         |
| Report a security vulnerability              | [Security policy](SECURITY.md) (private — never a public issue)        |

## Proposing changes: issue vs RFC

- **Bug fixes, docs, tests, small scoped enhancements** → open a normal issue with the matching form,
  then a PR.
- **Substantial changes** — new public APIs, breaking changes, cross-package architecture, plugin
  contract / doctrine changes, or anything that alters the release surface — go through the
  **[RFC process](rfcs/README.md)** first. When in doubt, ask in Discussions or open an issue and a
  maintainer will tell you if an RFC is needed.

## Development workflow

Use the harness workflow in [`.llm/harness/`](.llm/harness/README.md) for substantial changes.
Package and plugin work follows the Architecture Doctrine under
[`docs/architecture/doctrine/`](docs/architecture/doctrine/) — identify the archetype, public
surface, and gates before changing framework code.

### Branches

Name branches `<type>/<slug>` — lowercase, kebab-case, no trailing dates. Types match the commit/PR
taxonomy: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `perf/`, `test/`. Sub-branches of an
umbrella keep the umbrella prefix (e.g. `chore/deno-upgrade` → `chore/deno-upgrade-fresh`).

### Validation before a PR

Run the narrowest validation that proves your change. The canonical command set and the scoped
check/lint/format wrappers are documented in [`AGENTS.md`](AGENTS.md) under **Validation**. Do not
run repo-wide `deno task fmt` unless you are explicitly making a formatting-only change.

Common commands:

```bash
deno task check
deno task lint
deno task fmt:check
```

For changes to scaffold output, plugin scaffolding, DB wiring, or Aspire helpers, run the full CLI
E2E smoke before marking a PR ready:

```bash
deno task e2e:cli run scaffold.runtime --cleanup --format pretty
```

### Pull requests

Open your PR against `main` using the [PR template](.github/pull_request_template.md). Keep the
**Validation** section honest — paste real results and exit codes; a checked box with no evidence is
how false-green merges happen. Multi-slice work should open as a **draft** and flip to **ready for
review** only when the slice checklist is complete.

**Link the issue you resolve.** If your PR fully closes an issue, put a GitHub closing keyword in the
PR body's `## Scope` section: `Closes #N` (or `Fixes #N` / `Resolves #N`) so the merge auto-closes the
issue. A bare `#N` or `Refs #N` does **not** auto-close. For partial work, reference `#N` without a
keyword and note the remaining scope; never put a closing keyword on an epic/umbrella issue.

## Labels, milestones, and the board

Issues and PRs are organized with a namespaced, colon-delimited label taxonomy. The machine-readable
source of truth is [`.github/labels.yml`](.github/labels.yml); the narrative and phase conventions
live in the `netscript-pr` agent skill.

- `type:*` — `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`, `test`, `umbrella`, `sub-pr`.
- `status:*` — the board column. **Exactly one at a time**: `triage`, `research`, `plan`,
  `plan-eval`, `impl`, `impl-eval`, `augment-review`, `ci-fail`, `ready-merge`, then terminal
  `shipped` when completed work closes. Not-planned/wontfix closures remove the phase label instead.
- `area:*` — the package/plugin map (`cli`, `fresh`, `fresh-ui`, `plugins`, `auth`, `aspire`,
  `database`, `kv`, `sdk`, `service`, `config`, `telemetry`, `ai-core`, `plugin-ai`, `tooling`,
  `deps`, `docs`).
- `priority:*` — `p0` (release blocker) through `p3`.
- Cross-cutting flags — `rfc`, `breaking`, `good first issue`, `help wanted`.

**Milestones** map to the release roadmap: `0.0.1-beta.1`, `0.0.1-stable`, and `Backlog / Triage` for
unscheduled work. New contributors should look for [`good first issue`](https://github.com/rickylabs/netscript/labels/good%20first%20issue)
and [`help wanted`](https://github.com/rickylabs/netscript/labels/help%20wanted).

## Releases

NetScript is published to [JSR](https://jsr.io) from GitHub Actions via OIDC — never from a local
machine. A GitHub Release is the only publish trigger, and release notes are categorized by PR label
(see [`.github/release.yml`](.github/release.yml)). The full release-cut flow is documented in the
`netscript-release` agent skill. Contributors do not publish; maintainers cut releases.

## Developer Certificate of Origin (DCO)

NetScript is licensed under [Apache-2.0](LICENSE). Every contribution must be signed off under the
[Developer Certificate of Origin (DCO) 1.1](https://developercertificate.org/) to certify that you
wrote the contribution or otherwise have the right to submit it under the project's license.

Sign off every commit by adding a `Signed-off-by` trailer, most easily done with the `-s` flag:

```bash
git commit -s -m "fix: correct saga retry backoff"
```

This appends a line to your commit message:

```
Signed-off-by: Your Name <your.email@example.com>
```

Use your real name and a reachable email address — anonymous or pseudonymous sign-offs are not
accepted. PRs with unsigned commits will be asked to amend history (`git commit --amend -s` or
`git rebase --signoff HEAD~N`) before merge.

## Reporting security issues

Never open a public issue for a vulnerability. Follow the [Security policy](SECURITY.md) and use
private disclosure.
