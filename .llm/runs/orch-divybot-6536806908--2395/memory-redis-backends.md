# Real backend recipe

Docker daemon unavailable. Native Redis 7.0.15 runs with its extracted liblzf/liblua/libjemalloc
library directory on LD_LIBRARY_PATH; use a separate run-owned config and OS-assigned endpoint.
Garnet tool pin is SCAFFOLD_VERSIONS.GARNET_TOOL in the CLI, currently 2.2.1. Install it with
an explicit tool path under the private project run and invoke with the installed .NET SDK
on DOTNET_ROOT. Tool version 2.2.1 supports TIME, LPOS, WATCH/MULTI and sorted-set commands;
Lua is disabled by default, so do not require scripting for lease recovery.
Keep backend processes attached to an exec session; a detached subprocess from a short-lived
exec is terminated when the tool session closes. Raw logs and process identities stay private.
