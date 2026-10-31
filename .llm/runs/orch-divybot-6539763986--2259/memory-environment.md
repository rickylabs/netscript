# Environment memory — 2026-10-31

RTK is absent. Plain bounded git/gh works. No memory tool is exposed; prior committed run
memories are the available repository memory. The default dotnet mise shim requires a selected
installed SDK; use an invocation-local selection, never change global defaults for a spike.
Aspire.Hosting 13.5.3 is already installed, matching the current scaffold SDK and PostgreSQL pin.
The CLI credential scan lives in `credential-secret-surfaces.ts` under the scaffold runtime
gates and explicitly references #2259 for the environment-projection exemption.
