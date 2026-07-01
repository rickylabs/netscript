# Drift

- 2026-06-17: `NETSCRIPT_ASPIRE_CLI_VERSION` cannot equal `SCAFFOLD_VERSIONS.ASPIRE_SDK` because Aspire CLI `13.4.4` is not an installable Linux x64 release via `aspire.dev/install.sh`; workflow validation now models CLI and SDK pins separately.
- 2026-06-17: Aspire CLI `13.4.0` reports build metadata in `aspire --version`; workflow verification compares the version core before `+` instead of the full display string.
