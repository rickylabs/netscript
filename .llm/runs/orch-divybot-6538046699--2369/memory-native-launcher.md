# Linux package launcher discovery

Do not derive the installed launcher from a Deno Desktop runtime library's basename. The pinned toolchain can package a runtime ending `-1.0.so` alongside a launcher ending `-1.0.0-linux-x86_64`; removing `.so` selects a nonexistent path. The isolated `.deb` install publishes its launch entry as a relative symlink under `usr/bin`. That was the initially reviewed repair. Latest main now owns `findInstalledLauncher(runtime)`, which selects the unique executable beside the runtime without assuming a shared stem. Retain that upstream implementation and the explicit `--runtime` argument.

Regression gate: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/e2e/src/adapters/native-desktop/installed-launcher_test.ts`.

The existing remote `e2e-cli` workflow supports `workflow_dispatch` at a branch and runs the full scaffold/runtime/native suite without changing labels. Manual runs select desktop packaging too. Keep required runtime claims unticked until the exact-head report proves them, and refresh close-gate by rerunning its existing job instead of pushing only to refresh metadata.
