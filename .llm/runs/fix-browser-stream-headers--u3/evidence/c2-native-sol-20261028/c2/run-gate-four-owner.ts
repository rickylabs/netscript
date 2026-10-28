const commands: Record<string, string[]> = {
  "red": [
    "run",
    "--frozen",
    "-A",
    ".llm/tools/run-deno-test.ts",
    "--",
    "--frozen",
    "-A",
    "--filter",
    "U3 workers native headers",
    "plugins/workers/tests/streams/factory-headers_test.ts"
  ],
  "tests": [
    "run",
    "--frozen",
    "-A",
    ".llm/tools/run-deno-test.ts",
    "--",
    "--frozen",
    "-A",
    "plugins/workers/tests/streams/factory-headers_test.ts",
    "plugins/workers/tests/streams/factory-discovery_test.ts",
    "plugins/workers/tests/streams/live-query-consumer_test.ts"
  ],
  "types": [
    "run",
    "--frozen",
    "-A",
    ".llm/tools/run-deno-check.ts",
    "--file",
    "plugins/workers/streams/factory.ts",
    "--file",
    "plugins/workers/tests/streams/factory-headers_test.ts",
    "--file",
    "plugins/workers/tests/streams/live-query-consumer_type.ts",
    "--file",
    "plugins/workers/streams/mod.ts",
    "--deno-arg",
    "--frozen",
    "--deno-arg",
    "--unstable-kv",
    "--file",
    "plugins/workers/tests/streams/live-query-consumer_test.ts"
  ],
  "lint": [
    "run",
    "--frozen",
    "-A",
    ".llm/tools/run-deno-lint.ts",
    "--file",
    "plugins/workers/streams/factory.ts",
    "--file",
    "plugins/workers/tests/streams/factory-headers_test.ts",
    "--file",
    "plugins/workers/tests/streams/live-query-consumer_type.ts",
    "--ext",
    "ts",
    "--file",
    "plugins/workers/tests/streams/live-query-consumer_test.ts"
  ],
  "fmt": [
    "run",
    "--frozen",
    "-A",
    ".llm/tools/run-deno-fmt.ts",
    "--file",
    "plugins/workers/streams/factory.ts",
    "--file",
    "plugins/workers/tests/streams/factory-headers_test.ts",
    "--file",
    "plugins/workers/tests/streams/live-query-consumer_type.ts",
    "--ext",
    "ts",
    "--file",
    "plugins/workers/tests/streams/live-query-consumer_test.ts"
  ],
  "fmt-write": [
    "run",
    "--frozen",
    "-A",
    ".llm/tools/run-deno-fmt.ts",
    "--file",
    "plugins/workers/streams/factory.ts",
    "--file",
    "plugins/workers/tests/streams/factory-headers_test.ts",
    "--file",
    "plugins/workers/tests/streams/live-query-consumer_type.ts",
    "--ext",
    "ts",
    "--write",
    "--file",
    "plugins/workers/tests/streams/live-query-consumer_test.ts"
  ],
  "consumer": [
    "check",
    "--frozen",
    "--unstable-kv",
    "plugins/workers/tests/streams/live-query-consumer_type.ts"
  ],
  "package-check": [
    "task",
    "--cwd",
    "plugins/workers",
    "check"
  ],
  "doc": [
    "doc",
    "--lint",
    "--frozen",
    "plugins/workers/streams/mod.ts"
  ],
  "quality": [
    "run",
    "--frozen",
    "-A",
    ".llm/tools/quality/scan-code-quality.ts",
    "--root",
    "plugins/workers",
    "--max-allow",
    "7"
  ],
  "doctrine": [
    "run",
    "--frozen",
    "--allow-read",
    "--allow-run",
    ".llm/tools/fitness/check-doctrine.ts",
    "--all-roots"
  ],
  "publish": [
    "task",
    "--cwd",
    "plugins/workers",
    "publish:dry-run"
  ]
};
const selected = Deno.args[0];
if (!commands[selected]) throw new Error('Unknown C2 gate.');
const directory = '.llm/tmp/browser-stream-headers-u3-native-sol-20261028/c2';
const env: Record<string, string> = {
  PATH: `${Deno.execPath().slice(0, Deno.execPath().lastIndexOf('\\'))};${Deno.env.get('PATH') ?? ''}`,
  DENO_DIR: 'C:/Users/ericc/source/repos/netscript-native-host-policy-008/.llm/tmp/native-host-policy-preflight/cache',
  HOME: `${Deno.cwd()}/.llm/tmp/browser-stream-headers-u3-c1/gate-state/home`,
  USERPROFILE: `${Deno.cwd()}/.llm/tmp/browser-stream-headers-u3-c1/gate-state/home`,
  TEMP: `${Deno.cwd()}/.llm/tmp/browser-stream-headers-u3-c1/gate-state/temp`,
  TMP: `${Deno.cwd()}/.llm/tmp/browser-stream-headers-u3-c1/gate-state/temp`,
  DENO_TLS_CA_STORE: 'mozilla,system', HTTP_PROXY: 'http://127.0.0.1:3128',
  HTTPS_PROXY: 'http://127.0.0.1:3128', NO_PROXY: '127.0.0.1,localhost,0.0.0.0',
  DENO_NO_PROMPT: '1', DENO_NO_UPDATE_CHECK: '1', OTEL_DENO: 'false', NO_COLOR: '1',
};
for (const name of ['SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'SYSTEMDRIVE', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMW6432']) {
  const value = Deno.env.get(name);
  if (value !== undefined) env[name] = value;
}
const prefix = `${directory}/${selected}-${Date.now()}`;
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(new Error('C2 gate deadline.')), 180_000);
const started = new Date().toISOString();
try {
  const output = await new Deno.Command(Deno.execPath(), {
    args: commands[selected], env, clearEnv: true, stdin: 'null', stdout: 'piped', stderr: 'piped', signal: controller.signal,
  }).output();
  controller.signal.throwIfAborted();
  await Deno.writeFile(`${prefix}.stdout`, output.stdout, { createNew: true });
  await Deno.writeFile(`${prefix}.stderr`, output.stderr, { createNew: true });
  const receipt = { selected, args: commands[selected], code: output.code, started, ended: new Date().toISOString(), originalOutputAwaited: true, prefix };
  await Deno.writeTextFile(`${prefix}.json`, JSON.stringify(receipt, null, 2), { createNew: true });
  console.log(JSON.stringify(receipt));
  console.log(new TextDecoder().decode(output.stdout).slice(-2500));
  console.error(new TextDecoder().decode(output.stderr).slice(-2500));
  Deno.exitCode = output.code;
} finally {
  clearTimeout(timer);
}
