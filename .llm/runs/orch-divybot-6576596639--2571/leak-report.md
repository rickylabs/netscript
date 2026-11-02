# Final resource hygiene

The documented SQLite/Garnet showcase ran on owned generated roots. All owned
AppHosts were stopped after screenshots and the packed build. The final read-only
`maint:leak-check` found **zero owned survivors** and 24 unproven entries, including
a foreign AppHost, its long-lived process tree, and the reporter process itself.
All foreign/unknown resources were left alone. Docker, volume and network probes
could not connect to a local daemon; local container cleanup is unproven.

CI supplied Docker-backed cleanup acceptance: `scaffold.runtime` passed 124/124
steps, SQLite passed 116/116, and `scaffold.showcase` passed 8/8 including cleanup.
See `ci-suite-evidence.json` and Actions run 41465808061.
