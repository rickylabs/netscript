# Resume resource check — 2026-10-31

The read-only leak reporter found no positively proven run-owned survivors. Aspire/process inspection completed; Docker containers/volumes/networks could not be inspected because the daemon is unavailable.

Inspected every reported entry. The report includes foreign application hosts and shared Aspire processes/monitors with unproven ownership. All foreign and unknown-owner resources were left untouched; no teardown or process termination was performed. This run failed preflight before starting a scaffold runtime.

| Kind | Ownership | Count |
| --- | --- | --- |
| apphost | unproven | 1 |
| process | unproven | 24 |
