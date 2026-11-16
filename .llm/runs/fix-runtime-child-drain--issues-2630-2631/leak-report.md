# Resource inspection

The first full scaffold.runtime attempt failed at PostgreSQL readiness in the documented scaffold control; cleanup.aspire-stop passed. A targeted restart proved the database was accepting connections while local health checks could not reach Docker's separate network namespace. A temporary bridge scoped to this run's container identities made the native PostgreSQL health check pass. The exact diagnostic AppHost was stopped.

A corrected one-pass smoke is running with the same temporary environment bridge. The bridge is not product source and removes only proxies it creates, after checking their unique ownership label. Foreign and unknown-owner resources are left untouched. Final owned-resource cleanup follows the corrected smoke. Operator paths, hostnames, ports and process identities are excluded from public evidence.
