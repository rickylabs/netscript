# Runtime cleanup and disposable workspace retention

Run 41423746948 at 650fb2ed00389105ebe6cb242a212c827f4c1309 passed the seed-handoff negative
control, actual stream/Activity mutation and canonical exact-AppHost/container cleanup. It then
failed at recursive workspace removal with filesystem PermissionDenied. Database bind mounts can
leave data owned by a container user; runtime cleanup must not require deleting that scratch data.
Keep the generated workspace under the owned smoke root for diagnostics after stopping its AppHost
and proving no owned container survivors. Do not add sudo, broad chmod or container-user workarounds.

The earlier 41423003834 attempt failed rendering Fresh after its esbuild subprocess stopped. It is
a retained failed diagnosis, not acceptance; the later run rendered the page and reached cleanup.
Reduce successful per-command log repetition so the command evidence tail retains all three variant
IDs, negative symptoms, unchanged worker PID and cleanup outcomes in the final full-suite report.
