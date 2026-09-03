Recheck the S1/S2 work after your `CHANGES_REQUIRED` verdict. Do not edit, commit, push, comment on
GitHub, or run a runtime suite.

The implementation now uses `context.project.smokeRoot` as the initial README cwd, passes the
context-derived AppHost to the runtime edge, moves substitution/argv/explicit-port rules into the
pure domain module with tests, refuses implicit 80/443 ports, records only substitutions actually
made with service-port capture under separate evidence, clears its scoped receipt directory at
command zero, tests tuple length/context arguments, and records the recency/non-TTY and RTK drift.

Inspect the actual current diff and tests rather than trusting this summary. Return exactly `PASS`
or `CHANGES_REQUIRED`, then concise severity-ranked findings with file and line references. Treat
the coordinator's hosted-only runtime boundary and the unchanged baseline lint-wrapper refusal as
constraints, not missing local proof.
