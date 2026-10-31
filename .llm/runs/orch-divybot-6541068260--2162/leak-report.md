# Read-only resource ownership report

Focused Aspire preflight used the repository leak reporter. It found one unrelated AppHost and
25 process/resource observations, with no positively owned runtime resources started by this run.
Docker, volume and network probes could not connect to the local Docker daemon. No mutation or
cleanup was attempted. The unrelated AppHost and unknown-owner processes were left untouched.

The generated SDK restore succeeded, but no local AppHost was started. The full runtime gate
remains CI-only. Detailed operational reporter output is kept in private project-run evidence;
this public summary omits operator paths, process identities and local endpoints as required by
the assignment. No secrets were present in the generated report.
