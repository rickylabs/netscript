# Pinned masking diagnostic

Run from the repository root with the installed .NET 10 SDK. Select an output directory in
your project run storage, outside Git:

```sh
dotnet run \
  --project .llm/runs/orch-divybot-6539763986--2259/spike/MaskingProbe.csproj \
  --artifacts-path <output-directory> --no-launch-profile --verbosity quiet
```

The diagnostic references the exact Aspire.Hosting 13.5.3 package. It creates an application
builder and resolves one executable resource's environment without building, starting, or
running the application. The executable is never launched. No database, dashboard, container,
network listener, or user secret is created. The synthetic credential exists in memory only.
Keep compiler/restore output outside Git; result.txt contains only named assertions.

The SDK's `ExecutionConfigurationBuilder` resolves a direct secret and four composed
bindings. The program invokes the installed private `RedactIfSecretValue` method by reflection.
It does not substitute a local redaction implementation. The provided secret set contains the
resolved password; the pinned upstream collector enumerates secret ParameterResource values.
The expression connection resource is verified not to be a ParameterResource. This diagnostic
does not instantiate the backchannel collector or construct a live CLI snapshot.

The positive control requires the direct secret to become null. Clean and hostile byte-scan
controls reject an invalid detector. The controls exercise this diagnostic's byte detector,
not the repository's full-snapshot runtime gate. Every composed binding must first contain
the synthetic credential at runtime before its redactor output is inspected.

Exit 0 means valid measurement; read the final capability line separately. BLOCKED requires
every tested composition to leak; CAPABLE requires at least one to mask. INVALID exits 1.
The current result is **BLOCKED**. This is a reproduction of the pinned SDK limitation, not
a passing implementation, live dashboard test, live CLI snapshot, or database connectivity test.
All three issue #2259 acceptance boxes remain unproven.
