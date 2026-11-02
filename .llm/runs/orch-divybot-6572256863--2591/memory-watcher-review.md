# Watcher review lessons

Arm the directory watch before checking current seed intent; normalize the parent with realPath.
Deno 2.9.7 closes a pending watch iterator cleanly and permits disposal after close. Its test
sanitizers do not prove watcher cleanup. Test observed events and bounded termination explicitly.
Startup may reject malformed existing intent, but later sample dispatch failures must preserve
pending intent and leave the healthy worker running. Separate readiness from observer lifetime.
Bound observer drain at shutdown and preserve the worker's original error. Re-arm when the watched
parent is removed. Service reselection must revoke only prior CLI-managed edges, preserving manual
appsettings links; retain the previous consumer set in planning before writing new metadata.
