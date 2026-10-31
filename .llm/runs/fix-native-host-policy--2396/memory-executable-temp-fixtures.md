# Executable test fixtures require an executable task TMPDIR

The incoming snippet-extractor interruption test writes a fake git executable under
Deno.makeTempDir. The worker's default TMPDIR is a noexec filesystem: an unchanged exact
startup probe returns PermissionError before Deno can run. A stable retry reproduces the
same failure, so this is not a timing assertion to relax.

Use a task-scoped TMPDIR under the project's dated run directory on an executable filesystem,
then invoke the SAME gate and original test paths. Deno.makeTempDir and plain mktemp still
honor that TMPDIR; do not change global HOME/cache settings, fixture deadlines, assertions
or skip conditions. Prove the exact shebang probe starts before rerunning the test. Keep
all raw failed attempts and the successful task-environment receipt distinct.
