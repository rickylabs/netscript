# Upstream issue disposition

No new upstream issue was filed or drafted because the causal defect already has an exact upstream
report and merged fix:

- <https://github.com/microsoft/aspire/issues/18948> — Aspire CLI 13.4.6 orphaned stopped
  `aspire-managed nuget search` helpers on macOS and WSL, which hold/starve NuGet locks and deadlock
  unrelated restore operations.
- <https://github.com/microsoft/aspire/pull/18958> — merged lifecycle repair that tracks/awaits
  metadata prefetch, cancels/reaps helpers at shutdown, and disables the known read-only pollers.

The NetScript failure adds a useful manifestation—`BundleNuGetService.RestorePackagesAsync` later
receives the caller's termination and reports exit 6—but does not establish a distinct upstream
defect. If the five-run proof on the fixed daily still reproduces, this disposition must be reopened
and a new issue drafted with the retained 13.5 log; until then, filing a duplicate would be noise.
