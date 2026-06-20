No suite/CLI bug drift recorded.

- The `aspire.dev/install.sh` path does not provide a Linux x64 `13.4.4` archive, so the workflow uses `dotnet tool install Aspire.Cli --version 13.4.4` after .NET 10 setup. This is CI setup drift from the previous generic installer, not product or scaffold drift.
