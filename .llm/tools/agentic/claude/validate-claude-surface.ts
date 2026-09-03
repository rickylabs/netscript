interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const pretty = Deno.args.includes('--pretty');
const results: CheckResult[] = [];

results.push(await checkFileContains('CLAUDE.md', '@AGENTS.md'));
results.push(await checkFileContains('CLAUDE.md', '.agents/skills/<name>/SKILL.md'));
results.push(await checkJson('.claude/settings.json'));
results.push(await checkGitignore('.claude/settings.local.json'));
results.push(await checkClaudeSkillBridge());
results.push(await runHookLockCheck());

const ok = results.every((result) => result.ok);

if (pretty) {
  for (const result of results) {
    console.log(`${result.ok ? 'OK' : 'FAIL'} ${result.name}: ${result.detail}`);
  }
} else {
  console.log(JSON.stringify({ gate: 'agentic:check-claude', ok, results }));
}

Deno.exit(ok ? 0 : 1);

async function checkFileContains(path: string, needle: string): Promise<CheckResult> {
  try {
    const text = await Deno.readTextFile(path);
    return {
      name: path,
      ok: text.includes(needle),
      detail: text.includes(needle) ? `contains ${needle}` : `missing ${needle}`,
    };
  } catch (error) {
    return { name: path, ok: false, detail: String(error) };
  }
}

async function checkJson(path: string): Promise<CheckResult> {
  try {
    JSON.parse(await Deno.readTextFile(path));
    return { name: path, ok: true, detail: 'valid JSON' };
  } catch (error) {
    return { name: path, ok: false, detail: String(error) };
  }
}

async function checkGitignore(entry: string): Promise<CheckResult> {
  try {
    const text = await Deno.readTextFile('.gitignore');
    const ok = text.split(/\r?\n/).includes(entry);
    return { name: '.gitignore', ok, detail: ok ? `ignores ${entry}` : `missing ${entry}` };
  } catch (error) {
    return { name: '.gitignore', ok: false, detail: String(error) };
  }
}

async function checkClaudeSkillBridge(): Promise<CheckResult> {
  const bridgePath = '.claude/skills/repo-skills/SKILL.md';
  try {
    const entries: string[] = [];
    for await (const entry of walkFiles('.claude/skills')) entries.push(entry);
    entries.sort();
    const bridge = await Deno.readTextFile(bridgePath);
    const onlyBridge = entries.length === 1 && entries[0] === bridgePath;
    const pointsToSource = bridge.includes('.agents/skills/<name>/SKILL.md');
    const ok = onlyBridge && pointsToSource;
    return {
      name: 'Claude repository-skill bridge',
      ok,
      detail: ok
        ? `${bridgePath} is the only Claude skill and points to .agents/skills`
        : `expected only ${bridgePath} pointing to .agents/skills; found ${entries.join(', ')}`,
    };
  } catch (error) {
    return { name: 'Claude repository-skill bridge', ok: false, detail: String(error) };
  }
}

async function* walkFiles(root: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(root)) {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) yield* walkFiles(path);
    else if (entry.isFile) yield path;
  }
}

async function runHookLockCheck(): Promise<CheckResult> {
  const projectRoot = Deno.cwd();
  const lockBefore = await readOptional('deno.lock');
  for (let i = 0; i < 3; i += 1) {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '--no-prompt',
        '--allow-env=CLAUDE_PROJECT_DIR,NETSCRIPT_RUN_ID,CLAUDE_SESSION_ID',
        `--allow-write=${projectRoot}/.llm/tmp/claude/hooks`,
        `${projectRoot}/.llm/tools/agentic/claude/claude-hook-log.ts`,
      ],
      env: {
        CLAUDE_PROJECT_DIR: projectRoot,
        NETSCRIPT_RUN_ID: 'agentic-check-claude',
        CLAUDE_SESSION_ID: 'agentic-check-claude',
      },
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped',
    });
    const child = command.spawn();
    const writer = child.stdin.getWriter();
    await writer.write(
      new TextEncoder().encode(JSON.stringify({ hook_event_name: 'agentic-check', seq: i })),
    );
    await writer.close();
    const result = await child.output();
    if (result.code !== 0) {
      const decoder = new TextDecoder();
      return {
        name: 'claude hook lock check',
        ok: false,
        detail: decoder.decode(result.stderr).trim() || `hook exited ${result.code}`,
      };
    }
  }
  const lockAfter = await readOptional('deno.lock');
  const ok = lockBefore === lockAfter;
  return {
    name: 'claude hook lock check',
    ok,
    detail: ok ? 'deno.lock unchanged after 3 hook runs' : 'deno.lock changed after hook runs',
  };
}

async function readOptional(path: string): Promise<string | null> {
  try {
    return await Deno.readTextFile(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null;
    }
    throw error;
  }
}
