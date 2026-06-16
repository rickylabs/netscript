const tasks = Deno.args.filter((arg) => arg.trim().length > 0);

if (tasks.length === 0 || tasks.includes('--help')) {
  console.log('Usage: deno run --allow-run .llm/tools/run-parallel-tasks.ts <task>...');
  Deno.exit(tasks.length === 0 ? 1 : 0);
}

const results = await Promise.all(tasks.map(runTask));
const failures = results.filter((result) => result.code !== 0);

for (const result of results) {
  const header = `[${result.task}] exit ${result.code}`;
  console.log(`${header}\n${'='.repeat(header.length)}`);
  if (result.stdout.trim()) {
    console.log(result.stdout.trimEnd());
  }
  if (result.stderr.trim()) {
    console.error(result.stderr.trimEnd());
  }
}

if (failures.length > 0) {
  console.error(
    `Parallel task failures: ${
      failures.map((result) => `${result.task}:${result.code}`).join(', ')
    }`,
  );
  Deno.exit(1);
}

interface TaskResult {
  task: string;
  code: number;
  stdout: string;
  stderr: string;
}

async function runTask(task: string): Promise<TaskResult> {
  const command = new Deno.Command('deno', {
    args: ['task', task],
    stdout: 'piped',
    stderr: 'piped',
  });
  const result = await command.output();
  const decoder = new TextDecoder();
  return {
    task,
    code: result.code,
    stdout: decoder.decode(result.stdout),
    stderr: decoder.decode(result.stderr),
  };
}
