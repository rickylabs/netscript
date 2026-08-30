import { captureDescribeFollow, evaluateDescribeFollow } from './describe-follow.ts';

/** Stable resource-command gate vocabulary. */
export interface ResourceCommandContract {
  readonly id: string;
  readonly typedDatabase: readonly string[];
  readonly background: readonly (readonly string[])[];
  readonly describe: readonly string[];
  readonly skipWhenStartReceiptAbsent: boolean;
}

export function resourceCommandContract(): ResourceCommandContract {
  return {
    id: 'runtime.resource-command',
    typedDatabase: ['resource', '<db>-cli', 'migrate', '--timeout', '60'],
    background: [
      ['resource', 'workers', 'restart'],
      ['resource', 'sagas', 'restart'],
      ['resource', 'triggers', 'restart'],
    ],
    describe: ['describe', '--follow', '--format', 'Json'],
    skipWhenStartReceiptAbsent: true,
  };
}

/** Exercise stable Aspire 13.5 resource commands, recording an explicit skip or command receipt. */
export async function runResourceCommands(
  appHost: string,
  projectRoot: string,
  database: string,
  receiptPath: string,
): Promise<number> {
  const startReceipt = `${projectRoot}/.netscript/e2e/aspire-start.json`;
  try {
    await Deno.stat(startReceipt);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) throw error;
    await writeReceipt(receiptPath, {
      verdict: 'skipped',
      reason: 'runtime.aspire-start receipt absent',
    });
    return 75;
  }
  const transcripts: {
    readonly command: readonly string[];
    readonly code: number;
    readonly stdout: string;
    readonly stderr: string;
  }[] = [];
  const describeEvidence = `${projectRoot}/.netscript/e2e/resource-command-describe.ndjson`;
  const commands = [
    [
      'aspire',
      'resource',
      `${database}-cli`,
      'migrate',
      '--timeout',
      '60',
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ],
    ...['workers', 'sagas', 'triggers'].map((resource) => [
      'aspire',
      'resource',
      resource,
      'restart',
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ]),
  ];
  try {
    for (const command of commands) {
      const output = await new Deno.Command(command[0] ?? 'aspire', {
        args: command.slice(1),
        stdout: 'piped',
        stderr: 'piped',
      }).output();
      const transcript = {
        command,
        code: output.code,
        stdout: new TextDecoder().decode(output.stdout),
        stderr: new TextDecoder().decode(output.stderr),
      };
      transcripts.push(transcript);
      if (!output.success) {
        throw new Error(
          `${command.join(' ')} failed (${output.code}): ${transcript.stderr || transcript.stdout}`,
        );
      }
    }
    const expectedResources = [
      ...(database === 'sqlite' ? [] : [database]),
      'workers',
      'sagas',
      'triggers',
    ];
    await captureDescribeFollow(appHost, describeEvidence, expectedResources);
    const convergence = evaluateDescribeFollow(
      await Deno.readTextFile(describeEvidence),
      expectedResources,
    );
    await writeReceipt(receiptPath, {
      verdict: 'passed',
      transcripts,
      describeEvidence,
      convergence,
    });
    return 0;
  } catch (error) {
    await writeReceipt(receiptPath, {
      verdict: 'failed',
      error: error instanceof Error ? error.message : String(error),
      transcripts,
      describeEvidence,
    });
    throw error;
  }
}

async function writeReceipt(path: string, value: unknown): Promise<void> {
  const index = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  if (index > 0) await Deno.mkdir(path.slice(0, index), { recursive: true });
  await Deno.writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

if (import.meta.main) {
  const [appHost, projectRoot, database, receiptPath] = Deno.args;
  if (!appHost || !projectRoot || !database || !receiptPath) {
    throw new Error('resource command requires AppHost, project root, database, and receipt path');
  }
  Deno.exit(await runResourceCommands(appHost, projectRoot, database, receiptPath));
}
