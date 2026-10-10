import { join } from '@std/path';
import { disableAnonymousDashboard } from '../dashboard-config.ts';
import type { ResourceUpdateFollower } from '../resource-state-stream.ts';
import { resolveDbCliTimeoutSeconds } from '../../../../../../../src/kernel/adapters/database/operation-runner-helpers.ts';
import {
  type DescribeResourceObservation,
  evaluateDescribeFollow,
  isPendingConvergence,
  parseDescribeFollow,
} from './describe-follow.ts';

/** Process seams for failure injection without launching an AppHost or containers. */
export interface DescribeCaptureCommands {
  output(args: readonly string[], timeoutMs: number): Promise<string>;
  follow(args: readonly string[]): ResourceUpdateFollower;
}

const COMMANDS: DescribeCaptureCommands = {
  async output(args, timeoutMs) {
    const output = await new Deno.Command('aspire', {
      args: [...args],
      signal: AbortSignal.timeout(timeoutMs),
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const stdout = new TextDecoder().decode(output.stdout);
    if (!output.success) {
      throw new Error(
        `aspire ${args[0]} failed (${output.code}): ${
          new TextDecoder().decode(output.stderr).trim() || stdout
        }`,
      );
    }
    return stdout;
  },
  follow: (args) =>
    new Deno.Command('aspire', {
      args: [...args],
      stdout: 'piped',
      stderr: 'piped',
    }).spawn(),
};

/** Start once; a failed start gets one bounded attribution snapshot, never another start. */
export async function captureAspireStartAndDescribe(
  appHost: string,
  projectRoot: string,
  expectedResources: readonly string[],
  minimumTimeoutSeconds = 0,
  commands: DescribeCaptureCommands = COMMANDS,
): Promise<void> {
  await disableAnonymousDashboard(appHost);
  const stateDir = join(projectRoot, '.netscript', 'e2e');
  await Deno.mkdir(stateDir, { recursive: true });
  const describePath = join(stateDir, 'aspire-describe.ndjson');
  const started = performance.now();
  let start: string;
  try {
    start = await commands.output([
      'start',
      '--apphost',
      appHost,
      '--isolated',
      '--non-interactive',
      '--nologo',
      '--format',
      'Json',
    ], Math.max(resolveDbCliTimeoutSeconds(), minimumTimeoutSeconds) * 1_000);
  } catch (error) {
    let snapshot = '';
    let snapshotError = '';
    try {
      snapshot = await commands.output([
        'describe',
        '--apphost',
        appHost,
        '--format',
        'Json',
        '--non-interactive',
        '--nologo',
      ], 10_000);
      await Deno.writeTextFile(describePath, snapshot);
    } catch (failure) {
      snapshotError = `; attribution snapshot unavailable: ${String(failure)}`;
    }
    throw new Error(
      `aspire start failed after ${Math.round(performance.now() - started)}ms: ${String(error)}; ` +
        `${await failureDetails(snapshot, expectedResources)}${snapshotError}`,
      { cause: error },
    );
  }
  const index = start.indexOf('{');
  if (index < 0) throw new Error('aspire start did not emit JSON');
  const metadata: unknown = JSON.parse(start.slice(index));
  await Deno.writeTextFile(
    join(stateDir, 'aspire-start.json'),
    `${JSON.stringify(metadata, null, 2)}\n`,
  );
  console.info(`Aspire start command: ${Math.round(performance.now() - started)}ms`);
  await captureDescribeFollow(
    appHost,
    describePath,
    expectedResources,
    minimumTimeoutSeconds,
    commands,
  );
  console.info(`Aspire describe evidence: ${describePath}`);
}

/** Keep only last-seen observations in memory; retain the complete stream in the evidence file. */
export async function captureDescribeFollow(
  appHost: string,
  describePath: string,
  expectedResources: readonly string[],
  minimumTimeoutSeconds = 0,
  commands: DescribeCaptureCommands = COMMANDS,
): Promise<void> {
  await Deno.writeTextFile(describePath, '');
  const timeoutSeconds = Math.max(resolveDbCliTimeoutSeconds(), minimumTimeoutSeconds);
  const child = commands.follow([
    'describe',
    '--follow',
    '--format',
    'Json',
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);
  const stderr = stderrTail(child.stderr);
  const observations = new Map<string, DescribeResourceObservation>();
  let exited = false;
  const status = child.status.then((value) => {
    exited = true;
    return value;
  });
  const terminate = () => {
    if (exited) return;
    try {
      child.kill('SIGTERM');
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  };
  let timedOut = false;
  let converged = false;
  const started = performance.now();
  const timeout = setTimeout(() => {
    timedOut = true;
    terminate();
  }, timeoutSeconds * 1_000);
  try {
    for await (const line of lines(child.stdout)) {
      if (!line.trim()) continue;
      await Deno.writeTextFile(describePath, `${line}\n`, { append: true });
      for (const resource of parseDescribeFollow(line).resources) {
        observations.set(resource.name, resource);
      }
      if (observations.size > 1_024) throw new Error('Aspire describe exceeds 1024 resource limit');
      try {
        evaluateDescribeFollow(observationText(observations), expectedResources);
        converged = true;
        terminate();
        break;
      } catch (error) {
        if (!(error instanceof Error) || !isPendingConvergence(error.message)) throw error;
      }
    }
    const result = await status;
    if (!converged) {
      const details = (await stderr).trim();
      const reason = timedOut
        ? `timed out after ${timeoutSeconds}s`
        : `exited ${result.code}${details ? `: ${details}` : ''}`;
      throw new Error(
        `aspire describe --follow did not converge: ${reason}; ${await failureDetails(
          observationText(observations),
          expectedResources,
        )}`,
      );
    }
    console.info(
      `Aspire convergence: ${
        Math.round(performance.now() - started)
      }ms (ceiling ${timeoutSeconds}s)`,
    );
  } finally {
    clearTimeout(timeout);
    terminate();
    await Promise.all([status, stderr]);
  }
}

function observationText(observations: ReadonlyMap<string, DescribeResourceObservation>): string {
  return JSON.stringify({ resources: [...observations.values()] });
}

async function failureDetails(text: string, expectedResources: readonly string[]): Promise<string> {
  const details: string[] = [];
  let observations: readonly DescribeResourceObservation[] = [];
  try {
    // A one-shot describe is often pretty JSON; the follower is NDJSON.
    try {
      text = JSON.stringify(JSON.parse(text));
    } catch { /* Preserve NDJSON. */ }
    observations = parseDescribeFollow(text).resources;
  } catch { /* Missing/invalid evidence leaves every resource unknown. */ }
  for (const name of expectedResources) {
    try {
      evaluateDescribeFollow(text, [name]);
    } catch (error) {
      const resource = observations.find((entry) => entry.name === name.toLowerCase());
      details.push(
        `${name}: state=${resource?.state ?? 'Unknown (not observed)'}; ${String(error)}`,
      );
    }
  }
  return `unconverged resources: ${
    details.length ? details.join(' | ') : 'none in last snapshot'
  }${await pullDetails()}`;
}

async function pullDetails(): Promise<string> {
  const path = '.llm/tmp/e2e-image-pulls.json';
  try {
    if ((await Deno.stat(path)).size > 64 * 1024) return '; image pull evidence exceeds size limit';
    const report: unknown = JSON.parse(await Deno.readTextFile(path));
    if (!Array.isArray(report)) throw new Error('image pull report must be an array');
    const pulls = report.map((item: unknown) => {
      if (
        typeof item !== 'object' || item === null || !('image' in item) ||
        typeof item.image !== 'string' || !('durationMs' in item) ||
        typeof item.durationMs !== 'number'
      ) {
        throw new Error('invalid image pull measurement');
      }
      return `${item.image}=${item.durationMs}ms`;
    });
    return `; CI image pulls (including backoff): ${pulls.join(', ')}`;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return '; image pull duration unavailable';
    return `; image pull evidence unavailable: ${String(error)}`;
  }
}

async function* lines(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  let buffered = '';
  const decoder = new TextDecoder();
  for await (const chunk of stream) {
    buffered += decoder.decode(chunk, { stream: true });
    if (buffered.length > 1_048_576) throw new Error('Aspire describe line exceeds 1 MiB limit');
    const parts = buffered.split(/\r?\n/);
    buffered = parts.pop() ?? '';
    for (const line of parts) yield line;
  }
  buffered += decoder.decode();
  if (buffered) yield buffered;
}

async function stderrTail(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let tail = '';
  for await (const chunk of stream) {
    tail = (tail + decoder.decode(chunk, { stream: true })).slice(-16_384);
  }
  return tail + decoder.decode();
}
