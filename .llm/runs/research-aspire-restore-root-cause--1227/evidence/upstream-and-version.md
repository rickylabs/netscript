# Upstream and version evidence

## Existing upstream defect

The causal upstream report already exists:

- Issue: <https://github.com/microsoft/aspire/issues/18948>
- Fix: <https://github.com/microsoft/aspire/pull/18958>
- Fix merge commit: `7921e8689f5f6cec0fa4f815f9c4a04f7b875264` (merged 2026-08-03)

Issue #18948 is against the exact affected Aspire CLI 13.4.6 build and has an independent WSL
confirmation. It identifies discarded NuGet metadata-prefetch tasks that leave
`aspire-managed nuget search` children orphaned in stopped (`T`) state. Those children retain or
starve NuGet scratch/global locks and make unrelated NuGet restores wait indefinitely. Killing the
stopped helpers immediately unblocks restore. PR #18958 tracks/awaits the prefetch tasks so host
shutdown cancels and reaps the child; it also disables the useless prefetch for `ls` and `ps` and
removes the one-second command-selection fallback that could bypass those opt-outs.

The still-open follow-up issue <https://github.com/microsoft/aspire/issues/18965> and PR
<https://github.com/microsoft/aspire/pull/18968> make metadata prefetch opt-in for every command.
That is a scope/robustness improvement, not a replacement for #18958's lifecycle repair.

Because #18948 describes this exact component, exact CLI build, WSL reproduction, stopped process
state, NuGet-lock consequence, and merged repair, no duplicate upstream issue draft is warranted.

## Stable and daily currency

| Channel   | Exact version/build                                                  | State                                          |
| --------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| stable    | `13.4.6+87fe259e4fc244c599019a7b1304c85a1488f248`                    | Released 2026-06-20; affected; predates #18958 |
| daily/dev | `13.5.0-preview.1.26404.10+1f098dffe7e143c18f5a79c37218718f822415ed` | Installed/tested 2026-08-05; contains #18958   |

Primary sources:

- Stable release: <https://github.com/microsoft/aspire/releases/tag/v13.4.6>
- Official daily-build instructions:
  <https://github.com/microsoft/aspire/blob/main/docs/using-latest-daily.md>
- Fix-to-daily comparison:
  <https://github.com/microsoft/aspire/compare/7921e8689f5f6cec0fa4f815f9c4a04f7b875264...1f098dffe7e143c18f5a79c37218718f822415ed>

GitHub reports the daily commit as 25 commits ahead and zero behind the #18958 merge commit. The
official installer also resolves the exact version when passed
`--version
13.5.0-preview.1.26404.10`, so the workflow can pin the tested build instead of following
a moving `dev` channel.

## Doctor results

Both `aspire doctor --non-interactive --nologo` runs completed with zero failed checks:

- Stable 13.4.6: Docker 29.1.3, WSL2, .NET/DCP, and TypeScript tooling healthy.
- Daily 13.5.0 preview: the same checks healthy; channel reported as `daily`.

Warnings were limited to local developer-certificate trust and VS Code extension availability. They
occur after/beside package restore and do not explain a NuGet child waiting before any AppHost or
container starts.
