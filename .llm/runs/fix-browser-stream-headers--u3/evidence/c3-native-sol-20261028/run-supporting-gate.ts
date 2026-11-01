const commands: Record<string, string[]> = {
  "links": [
    "task",
    "docs:links"
  ],
  "exports-drift": [
    "task",
    "docs:exports-drift"
  ],
  "accuracy": [
    "task",
    "docs:accuracy"
  ],
  "jsdoc-examples": [
    "task",
    "docs:jsdoc-examples"
  ],
  "snippets": [
    "task",
    "docs:snippets"
  ],
  "fmt-source": [
    "run",
    "--frozen",
    "-A",
    ".llm/tools/run-deno-fmt.ts",
    "--file",
    "packages/fresh/src/runtime/streams/create-stream-db.ts",
    "--file",
    "packages/fresh/src/runtime/streams/mod.ts",
    "--ext",
    "ts"
  ],
  "fmt-md": [
    "run",
    "--frozen",
    "-A",
    ".llm/tools/run-deno-fmt.ts",
    "--file",
    "docs/site/durable-workflows/streams.md",
    "--file",
    ".llm/runs/fix-browser-stream-headers--u3/worklog.md",
    "--file",
    ".llm/runs/fix-browser-stream-headers--u3/drift.md",
    "--file",
    ".llm/runs/fix-browser-stream-headers--u3/research.md",
    "--ext",
    "md",
    "--config",
    ".llm/tmp/browser-stream-headers-u3-native-sol-20261028/c3/fmt-md.json"
  ],
  "recipe": [
    "run",
    "--frozen",
    "-A",
    ".llm/tmp/browser-stream-headers-u3-native-sol-20261028/c3/check-reader-recipe.ts"
  ]
};
const selected = Deno.args[0];
if (!commands[selected]) throw new Error('Unknown C3 gate.');
const directory = '.llm/tmp/browser-stream-headers-u3-native-sol-20261028/c3';
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
const timer = setTimeout(() => controller.abort(new Error('C3 gate deadline.')), 180_000);
const started = new Date().toISOString();
try {
  const output = await new Deno.Command(Deno.execPath(), {
    args: commands[selected], env, clearEnv: true, stdin: 'null', stdout: 'piped', stderr: 'piped', signal: controller.signal,
  }).output();
  await Deno.writeFile(`${prefix}.stdout`, output.stdout, { createNew: true });
  await Deno.writeFile(`${prefix}.stderr`, output.stderr, { createNew: true });
  const receipt = { selected, args: commands[selected], code: output.code, started, ended: new Date().toISOString(), originalOutputAwaited: true, deadlineAborted: controller.signal.aborted, prefix };
  await Deno.writeTextFile(`${prefix}.json`, JSON.stringify(receipt, null, 2), { createNew: true });
  console.log(JSON.stringify(receipt));
  console.log(new TextDecoder().decode(output.stdout).slice(-2500));
  console.error(new TextDecoder().decode(output.stderr).slice(-2500));
  Deno.exitCode = output.code;
} finally {
  clearTimeout(timer);
}
