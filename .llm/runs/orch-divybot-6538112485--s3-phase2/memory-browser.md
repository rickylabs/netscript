# Browser preparation

Use tools/fresh-ui-browser package lock: npm ci --ignore-scripts in that folder
installs all7 packages without changing the lock. Playwright chromium's recorded
executable is already present. Actual browser keyboard tests are feasible here;
do not substitute state-helper tests or claim browser unavailable.

Executable presence does not prove Chromium can launch: libnspr4 is absent
system-wide. Earlier S8/S1 project-run directories retain complete libraries.
Reuse the S8 browser-deps/root/usr/lib/x86_64-linux-gnu path with LD_LIBRARY_PATH
for npm-only browser runs. Leave borrowed libraries unchanged. Never inherit
that variable into narrow --allow-run Deno gate runners. Use --max-failures=1
while diagnosing startup so the same loader error is not repeated20 times.
Deno.addSignalListener needs no --allow-sys=signal (that descriptor is invalid).

Deno bundle with the package jsx=precompile emits React.createElement in this
version. The dedicated browser gap.deno.json uses react-jsx + Preact and existing
root-catalog npm versions. This avoids injecting a fake React global. Named
`{ AxeBuilder }` is required by the structured Deno check even if Node's default
interop happens to run.20-case Actions matrix passes with zero serious/critical
axe findings using the real bundle; preserve existing gallery baseline.

2026-10-31 Public runtime imports in a standalone browser config need the root
workspace catalog. gap-build.ts derives it into ignored test-results config each
run before bundling; use the generated config for fixture type checks. Never
check in another catalog or stale bundle. Scope fixture layout CSS to outer
examples: a broad section rule distorts nested Calendar month sections.
