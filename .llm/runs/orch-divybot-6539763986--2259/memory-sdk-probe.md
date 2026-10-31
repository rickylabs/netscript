# Installed SDK probe recipe — 2026-10-31

Use the exact package reference Aspire.Hosting 13.5.3 in a standalone net10.0 diagnostic.
The installed dotnet SDK is selectable per invocation with MISE_DOTNET_VERSION=10.0.400;
do not change global defaults. Put all build/restore output outside Git with --artifacts-path.

ExecutionConfigurationBuilder.Create(resource).WithEnvironmentVariablesConfig().BuildAsync
resolves the real consumer environment without starting an AppHost or executable. Its
EnvironmentVariables are key/string pairs. ParameterResource.GetValueAsync requires an
explicit CancellationToken.None in this SDK; the first compile attempt caught that omission.
No capability claim was made from the failed compilation.

The exact private method is AuxiliaryBackchannelRpcTarget.RedactIfSecretValue, static,
arguments string and HashSet<string>. Missing reflection targets or failed controls must
exit nonzero. Suppress exception details in public output because they may carry paths/values.
