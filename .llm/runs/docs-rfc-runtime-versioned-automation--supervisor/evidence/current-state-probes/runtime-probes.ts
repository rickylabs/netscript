import { dirname, fromFileUrl, join } from "@std/path";
import { DenoRuntimeConfigStore } from "../../../../../packages/cli/src/kernel/adapters/config/runtime-config/deno-runtime-config-store.ts";
import {
  publishRuntimeOverride,
  rollbackRuntimeOverride,
} from "../../../../../packages/cli/src/public/features/config/override/manage-runtime-overrides.ts";
import {
  loadRuntimeConfig,
  watchRuntimeConfig,
} from "../../../../../packages/runtime-config/mod.ts";
import { MultiRuntimeTaskExecutor } from "../../../../../packages/plugin-workers-core/src/executor/mod.ts";

const probeRoot = new URL("./fixture/", import.meta.url);
const root = fromFileUrl(probeRoot);
await Deno.remove(root, { recursive: true }).catch(() => undefined);
await Deno.mkdir(root, { recursive: true });

async function writeJson(path: string, value: unknown): Promise<void> {
  await Deno.mkdir(dirname(path), { recursive: true });
  await Deno.writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

// P1: real filesystem store lifecycle and best-effort lost-update observation.
const storeRoot = join(root, "p1");
const store = new DenoRuntimeConfigStore(() => storeRoot);
await publishRuntimeOverride(store, "jobs", "1.0.0", { overrides: [{ id: "job-a" }] });
await publishRuntimeOverride(store, "jobs", "2.0.0", { overrides: [{ id: "job-b" }] });
await rollbackRuntimeOverride(store, "jobs", "1.0.0");
const rollbackPointer = await store.readPointer();
const temporaryAfterLifecycle = [...Deno.readDirSync(storeRoot)].filter((entry) => entry.name.endsWith(".tmp"));

let lostUpdates = 0;
for (let index = 0; index < 20; index++) {
  const raceRoot = join(root, `p1-race-${index}`);
  const raceStore = new DenoRuntimeConfigStore(() => raceRoot);
  await raceStore.write("jobs", "1", { overrides: [] });
  await raceStore.write("features", "1", { flags: [] });
  await Promise.all([
    rollbackRuntimeOverride(raceStore, "jobs", "1"),
    rollbackRuntimeOverride(raceStore, "features", "1"),
  ]);
  const pointer = await raceStore.readPointer();
  if (!(pointer.jobs && pointer.features)) lostUpdates++;
}
console.log("P1", JSON.stringify({ rollbackPointer, temporaryAfterLifecycle: temporaryAfterLifecycle.length, lostUpdates, races: 20 }));

// P2/P4: loader sees additive tasks, watcher follows current, malformed docs collapse to empty.
const runtimeRoot = join(root, "p2-runtime");
await Deno.mkdir(join(runtimeRoot, "tasks"), { recursive: true });
await writeJson(join(runtimeRoot, "tasks", "v1.0.0.json"), {
  tasks: [{ id: "runtime-only", name: "Runtime only", runtime: "deno", entrypoint: "./runtime-only.ts" }],
});
await writeJson(join(runtimeRoot, "current"), { version: "1.0.0", tasks: "tasks/v1.0.0.json" });
Deno.env.set("NETSCRIPT_RUNTIME_CONFIG_DIR", runtimeRoot);
const initial = await loadRuntimeConfig();
const runtimeTask = initial.tasks[0];
const executor = new MultiRuntimeTaskExecutor();
const directSupport = executor.supports(runtimeTask as never);

const changes: Array<{ tasks: number }> = [];
const abort = new AbortController();
watchRuntimeConfig(async (config) => {
  changes.push({ tasks: config.tasks.length });
}, { signal: abort.signal });
await new Promise((resolve) => setTimeout(resolve, 100));
await writeJson(join(runtimeRoot, "tasks", "v2.0.0.json"), {
  tasks: [
    { id: "runtime-two", name: "Runtime two", runtime: "deno", entrypoint: "./two.ts" },
    { id: "runtime-three", name: "Runtime three", runtime: "shell", entrypoint: "./three.sh" },
  ],
});
await writeJson(join(runtimeRoot, "current"), { version: "2.0.0", tasks: "tasks/v2.0.0.json" });
await new Promise((resolve) => setTimeout(resolve, 700));
await Deno.writeTextFile(join(runtimeRoot, "tasks", "v3.0.0.json"), "{ malformed\n");
await writeJson(join(runtimeRoot, "current"), { version: "3.0.0", tasks: "tasks/v3.0.0.json" });
await new Promise((resolve) => setTimeout(resolve, 700));
abort.abort();
console.log("P2_P4", JSON.stringify({ loadedTaskId: runtimeTask?.id, directExecutorSupport: directSupport, watcherChanges: changes }));

// P5: direct engine smoke for Deno and POSIX shell.
const scripts = join(root, "p5-scripts");
await Deno.mkdir(scripts, { recursive: true });
await Deno.writeTextFile(join(scripts, "hello.ts"), 'console.log("deno-ok");\n');
await Deno.writeTextFile(join(scripts, "hello.sh"), 'printf "shell-ok\\n"\n');
const denoResult = await executor.execute({ id: "deno-smoke", type: "deno", entrypoint: join(scripts, "hello.ts") });
const shellResult = await executor.execute({ id: "shell-smoke", type: "shell", entrypoint: join(scripts, "hello.sh") });
console.log("P5", JSON.stringify({
  deno: { success: denoResult.success, exitCode: denoResult.exitCode, stdout: denoResult.stdout.trim(), error: denoResult.error },
  shell: { success: shellResult.success, exitCode: shellResult.exitCode, stdout: shellResult.stdout.trim(), error: shellResult.error },
}));
