# Native plugin preview — 2026-11-01

Generate a new SQLite workspace with `--cache false`; default Redis container mode cannot run without a Docker daemon. Install workers/streams with `--app web --samples`; the install links web to the persisted workers-api identity and adds Garnet Auto. Run the owned AppHost with `MISE_DOTNET_VERSION=10.0.400 aspire start --isolated --non-interactive --nologo` on this host. Without the scoped mise selection, native Garnet exits because the dotnet shim has no selected version. This is an environment requirement, not a global SDK change.

The live preview uses the stock generated health-check job extended only in the disposable fixture to fetch four real resource health endpoints and call reportProgress after each completed response. Trigger through workersContract.triggerJob with `id`, not jobId. Captured progress/events must come from its actual execution; do not write display snapshots. No plugin fake data enters shipped templates.
