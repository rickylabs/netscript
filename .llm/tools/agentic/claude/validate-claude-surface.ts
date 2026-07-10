interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const pretty = Deno.args.includes('--pretty');
const results: CheckResult[] = [];

results.push(await checkFileContains('CLAUDE.md', '@AGENTS.md'));
results.push(await checkJson('.claude/settings.json'));
results.push(await checkGitignore('.claude/settings.local.json'));
results.push(await runSyncCheck());
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

async function runSyncCheck(): Promise<CheckResult> {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--no-lock',
      '--allow-read',
      '.llm/tools/agentic/claude/sync-claude-skills.ts',
      '--check',
      '--pretty',
    ],
    stdout: 'piped',
    stderr: 'piped',
  });
  const result = await command.output();
  const decoder = new TextDecoder();
  const output = `${decoder.decode(result.stdout)}${decoder.decode(result.stderr)}`.trim();
  return {
    name: '.claude/skills',
    ok: result.code === 0,
    detail: output || `sync check exited ${result.code}`,
  };
}

async function runHookLockCheck(): Promise<CheckResult> {
  const lockBefore = await readOptional('deno.lock');
  for (let i = 0; i < 3; i += 1) {
    const command = new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '--allow-env',
        '--allow-read',
        '--allow-write',
        '.llm/tools/agentic/claude/claude-hook-log.ts',
      ],
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
