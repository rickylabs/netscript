# Worklog

## Design

- Public surface: `.github/workflows/copilot-setup-steps.yml` and `.github/toolchain.env`.
- Domain vocabulary: Aspire CLI installer release (`NETSCRIPT_ASPIRE_CLI_VERSION`) is distinct from scaffold Aspire SDK/package version (`NETSCRIPT_ASPIRE_SDK_VERSION`).
- Ports: GitHub Actions shell steps and `https://aspire.dev/install.sh`.
- Constants: `NETSCRIPT_ASPIRE_CLI_VERSION=13.4.0`; `NETSCRIPT_ASPIRE_SDK_VERSION=13.4.4`.
- Commit slices: one slice updates Copilot setup validation to decouple installable CLI release from scaffold SDK constant, proven by local grep and installer/version checks.
- Deferred scope: no scaffold version changes, no generated scaffold output changes, no root Deno catalog changes.
- Contributor path: update `.github/toolchain.env` first, then keep workflow validation checks tied to the variable that owns each external fact.

## Implementation

- Reset local branch `feat/package-quality-s2-toolchain-pin` to `origin/feat/package-quality` at `6369f172b5612c470220acfa8c590219bd2a3f75`.
- Empirically tested `aspire.dev/install.sh --version 13.4.4 --install-path /tmp/aspire-1344 --skip-path`; it failed with a 404 for `aspire-cli-linux-x64-13.4.4.tar.gz`.
- Decoupled Copilot setup validation by adding `NETSCRIPT_ASPIRE_SDK_VERSION=13.4.4` and grepping `ASPIRE_SDK` against that pin while keeping `NETSCRIPT_ASPIRE_CLI_VERSION=13.4.0` for the real CLI install.
- Empirically tested `aspire.dev/install.sh --version 13.4.0 --install-path /tmp/aspire-1340 --skip-path`; it installed, and `aspire --version` reported `13.4.0+becb48e2d61099e35ae336d527d3875e928d6594`, so the workflow compares the version core before build metadata.

## Validation

| Check | Result | Evidence |
| --- | --- | --- |
| Scaffold SDK grep | PASS | `grep -F "ASPIRE_SDK: '${NETSCRIPT_ASPIRE_SDK_VERSION}'" packages/cli/src/kernel/constants/scaffold/scaffold-versions.ts` found `ASPIRE_SDK: '13.4.4'`. |
| Aspire CLI 13.4.4 install probe | FAIL as expected | `bash /tmp/aspire-install.sh --version 13.4.4 --install-path /tmp/aspire-1344 --skip-path` failed with GitHub release asset 404 for `aspire-cli-linux-x64-13.4.4.tar.gz`. |
| Aspire CLI workflow install/verify | PASS | Fresh install with `NETSCRIPT_ASPIRE_CLI_VERSION=13.4.0` succeeded; `/tmp/aspire-1340/aspire --version` printed `13.4.0+becb48e2d61099e35ae336d527d3875e928d6594`; workflow comparison verifies `${actual%%+*} = 13.4.0`. |
