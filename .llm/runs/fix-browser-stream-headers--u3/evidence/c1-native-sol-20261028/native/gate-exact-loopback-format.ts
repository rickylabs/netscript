/** Credential-free bounded C1b successor gates; no arbitrary command forwarding. */
const root = "C:/Users/ericc/source/repos/netscript-browser-stream-headers-008";
const directory = `${root}/.llm/tmp/browser-stream-headers-u3-c1`;
const source = "packages/fresh/src/runtime/streams/create-stream-db.ts";
const oldTest = "packages/fresh/src/runtime/streams/create-stream-db_test.ts";
const newTest = "packages/fresh/tests/streamdb-headers-contract_test.ts";
const helper = "packages/fresh/tests/_fixtures/stream-db-test-runtime.ts";
const consumer = "packages/fresh/tests/type-fixtures/streamdb-wrapper_type.ts";
const files = [source, oldTest, newTest, helper];
const selected = Deno.args[0];
const command = (
  tool: string,
  args: string[],
) => ["run", "--frozen", "--allow-all", tool, ...args];
const tests = [
  oldTest,
  "packages/fresh/src/runtime/streams/stream-db-recovery-adapter_test.ts",
  newTest,
];
const fileArgs = files.flatMap((file) => ["--file", file]);
const commands: Record<string, string[][]> = {
  red: [
    command(".llm/tools/run-deno-test.ts", [
      "--",
      "--frozen",
      "--allow-all",
      "--filter",
      "U3 explicit header record reaches the client port",
      newTest,
    ]),
  ],
  tests: [
    command(".llm/tools/run-deno-test.ts", [
      "--",
      "--frozen",
      "--allow-all",
      ...tests,
    ]),
  ],
  types: [
    command(".llm/tools/run-deno-check.ts", [
      ...fileArgs,
      "--deno-arg",
      "--frozen",
    ]),
  ],
  consumer: [["task", "--cwd", "packages/fresh", "check:streams-types"]],
  lint: [command(".llm/tools/run-deno-lint.ts", [...fileArgs, "--ext", "ts"]), [
    "lint",
    "--no-config",
    consumer,
  ]],
  fmt: [command(".llm/tools/run-deno-fmt.ts", [...fileArgs, "--ext", "ts"]), [
    "fmt",
    "--no-config",
    "--single-quote",
    "--line-width",
    "100",
    "--check",
    consumer,
  ]],
  "fmt-write": [
    command(".llm/tools/run-deno-fmt.ts", [
      ...fileArgs,
      "--ext",
      "ts",
      "--write",
    ]),
    ["fmt", "--no-config", "--single-quote", "--line-width", "100", consumer],
  ],
  quality: [
    command(".llm/tools/quality/scan-code-quality.ts", [
      "--root",
      "packages/fresh",
      "--max-allow",
      "7",
    ]),
  ],
};
if (selected !== "diff" && !commands[selected]) {
  throw new Error("Unknown C1 gate");
}
const allowed = new Set([
  "path",
  "pathext",
  "comspec",
  "systemroot",
  "windir",
  "systemdrive",
  "programfiles",
  "programfiles(x86)",
  "programw6432",
  "http_proxy",
  "https_proxy",
  "all_proxy",
  "no_proxy",
  "node_extra_ca_certs",
  "ssl_cert_file",
  "ssl_cert_dir",
]);
const env = Object.fromEntries(
  Object.entries(Deno.env.toObject()).filter(([name]) =>
    allowed.has(name.toLowerCase()) && name.toLowerCase() !== "path"
  ),
);
const host = `${directory}/gate-state`;
for (
  const path of [host, `${host}/temp`, `${host}/home`, `${directory}/gates`]
) await Deno.mkdir(path, { recursive: true });
Object.assign(env, {
  HOME: `${host}/home`,
  USERPROFILE: `${host}/home`,
  TEMP: `${host}/temp`,
  TMP: `${host}/temp`,
  DENO_TLS_CA_STORE: "mozilla,system",
  DENO_DIR:
    "C:/Users/ericc/source/repos/netscript-native-host-policy-008/.llm/tmp/native-host-policy-preflight/cache",
  PATH: `${Deno.execPath().slice(0, Deno.execPath().lastIndexOf("\\"))};${
    Deno.env.get("PATH") ?? ""
  }`,
  NO_PROXY: "localhost,127.0.0.1,0.0.0.0,[::1]",
  DENO_NO_PROMPT: "1",
  DENO_NO_UPDATE_CHECK: "1",
  OTEL_DENO: "false",
  NO_COLOR: "1",
});
if (selected === "diff") {
  const baseline = await new Deno.Command("git", {
    args: ["show", `HEAD:${oldTest}`],
    cwd: root,
    stdout: "piped",
  }).output();
  if (!baseline.success) throw new Error("Old test baseline unavailable");
  const original = new TextDecoder().decode(baseline.stdout).replaceAll(
    "\r\n",
    "\n",
  );
  const actual = (await Deno.readTextFile(`${root}/${oldTest}`)).replaceAll(
    "\r\n",
    "\n",
  );
  const start = original.indexOf("async function startReferenceServer(");
  const end = original.indexOf(
    "Deno.test('createNetScriptStreamDB recovers",
    start,
  );
  if (start < 0 || end < 0) throw new Error("Original helper anchors changed");
  function withoutMovedImports(text: string): string {
    return text.split("\n").filter((line) =>
      !line.includes("import { fromFileUrl }") &&
      !line.includes("import { TextLineStream }") &&
      !(line.startsWith("import ") &&
        line.includes("stream-db-test-runtime.ts"))
    ).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  const fixtureName =
    "Deno.test('default worker stream Collection enters the actual Fresh adapter and SDK query family'";
  const fixtureStart = original.indexOf(fixtureName);
  const fixtureOptions = "const server = Deno.serve({ port: 0, onListen() {} }, () =>\n    new Response('[]', {\n      headers: {\n        'Content-Type': 'application/json',\n        'Stream-Next-Offset': '0',\n        'Stream-Up-To-Date': 'true',\n      },\n    }));";
  const fixtureEnd = original.indexOf("\nDeno.test(", fixtureStart + fixtureName.length);
  const boundedEnd = fixtureEnd < 0 ? original.length : fixtureEnd;
  const fixtureText = original.slice(fixtureStart, boundedEnd);
  if (fixtureStart < 0 || fixtureText.split(fixtureOptions).length !== 2) {
    throw new Error("Exact authorized loopback fixture anchor changed");
  }
  const loopbackOriginal = original.slice(0, fixtureStart) + fixtureText.replace(
    fixtureOptions,
    "const server = Deno.serve(\n    { hostname: '127.0.0.1', port: 0, onListen() {} },\n    () =>\n      new Response('[]', {\n        headers: {\n          'Content-Type': 'application/json',\n          'Stream-Next-Offset': '0',\n          'Stream-Up-To-Date': 'true',\n        },\n      }),\n  );",
  ) + original.slice(boundedEnd);
  const loopbackStart = loopbackOriginal.indexOf("async function startReferenceServer(");
  const loopbackEnd = loopbackOriginal.indexOf(
    "Deno.test('createNetScriptStreamDB recovers",
    loopbackStart,
  );
  const expected = withoutMovedImports(
    loopbackOriginal.slice(0, loopbackStart) + loopbackOriginal.slice(loopbackEnd),
  );
  if (expected !== withoutMovedImports(actual)) {
    throw new Error(
      "Old assertions/code changed beyond extraction/imports and the exact authorized127 fixture property",
    );
  }
  for (const file of [newTest, helper]) {
    const lines = (await Deno.readTextFile(`${root}/${file}`)).trimEnd().split(/\r?\n/)
      .length;
    if (lines > 480) {
      throw new Error(`Physical line ceiling exceeded: ${file} ${lines}`);
    }
  }
  console.log(
    JSON.stringify({
      oldAssertionsAndRemainingCodeEquivalent: true,
      authorizedSingleFixtureLoopbackProperty: true,
      compared: oldTest,
      newFilesUnder480: true,
    }),
  );
} else {
  const prefix = `${directory}/gates/${selected}-${Date.now()}`;
  const results = [];
  for (const [index, args] of commands[selected].entries()) {
    const started = new Date().toISOString();
    const child = new Deno.Command(Deno.execPath(), {
      args,
      cwd: root,
      env,
      clearEnv: true,
      stdin: "null",
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    let settled = false;
    let escalation: ReturnType<typeof setTimeout> | undefined;
    void child.status.then(() => {
      settled = true;
    });
    const timer = setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch { /* Exited. */ }
      escalation = setTimeout(() => {
        if (!settled) {
          try {
            child.kill("SIGKILL");
          } catch { /* Exited. */ }
        }
      }, 1_000);
    }, 180_000);
    try {
      const result = await child.output();
      await Deno.writeFile(`${prefix}-${index}.stdout`, result.stdout, {
        createNew: true,
      });
      await Deno.writeFile(`${prefix}-${index}.stderr`, result.stderr, {
        createNew: true,
      });
      results.push({
        args,
        code: result.code,
        started,
        ended: new Date().toISOString(),
        originalChildStatusAwaited: settled,
        stdoutPath: `${prefix}-${index}.stdout`,
        stderrPath: `${prefix}-${index}.stderr`,
      });
      console.log(new TextDecoder().decode(result.stdout));
      console.error(new TextDecoder().decode(result.stderr));
      if (!result.success) {
        Deno.exitCode = result.code;
        break;
      }
    } finally {
      clearTimeout(timer);
      if (!settled) {
        try {
          child.kill("SIGTERM");
        } catch { /* Exited. */ }
        escalation = setTimeout(() => {
          if (!settled) {
            try {
              child.kill("SIGKILL");
            } catch { /* Exited. */ }
          }
        }, 1_000);
        await child.status;
      }
      if (escalation !== undefined) clearTimeout(escalation);
    }
  }
  await Deno.writeTextFile(
    `${prefix}.json`,
    JSON.stringify(
      {
        selected,
        results,
        credentialFreeClearEnv: true,
        environmentNames: Object.keys(env),
        authoredConsumerNoLockRetained: selected === "consumer",
      },
      null,
      2,
    ),
    { createNew: true },
  );
}
