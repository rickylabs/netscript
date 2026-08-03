# P2 attempt and ownership record

The read-only baseline contained two foreign AppHosts, six foreign/unproven containers, multiple
`aspire mcp start` processes, and no listener on port 43127. None was mutated.

The first two detached no-DB starts exited when their launching command session ended, before a
service listener existed; no HTTP fetch was attempted or attributed to them. The retained owned run
used the same unmodified fresh scaffold with a live controlling session. Before fetching, Aspire
reported the `health` resource `Running`/`Healthy` at `http://localhost:43127`; the exact owned tree
was CLI PID 79779, AppHost PID 79849, service PID 80461, and DCP listener PID 80298.

Only after that capture, the live `/api/openapi.json` request returned HTTP 200 and 3657 bytes at
2026-08-03T21:20:47.409Z. The exact AppHost path was then stopped. Port, process-tree, container,
and owned-root checks found zero owned survivors; the foreign baseline remained untouched.

The SQLite branch was not restarted, patched, wrapped, or manually launched. Its normalized P1
failure is carried through `P2-db-failure.json`; the ambiguous P1 HTTP 200 is expressly excluded.
