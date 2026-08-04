# Research

- Issue #1227 was read first and is the specification.
- `runtime.aspire-restore` inherits the suite-wide 900-second command timeout and retries once, producing the observed 2 × 900.1-second failure.
- Command retries are currently capped at two attempts and failure classes are only timeout/canceled/assertion.
- Aspire restore runs before NetScript product code; its timeout/cancellation is infrastructure failure.
- CI installs exact Aspire CLI 13.4.6 but does not persist the default NuGet global-packages directory between runs.
- The same runtime gate is exercised by PR, production-published, and prod-local workflows.

