/** Required real-Redis regression gate and exact #1075 sensitivity proof. */

export const REDIS_REGRESSIONS = [
  {
    file: 'packages/kv/tests/redis.adapter_test.ts',
    name: 'RedisKvAdapter lists real Redis entries and admits one atomic CAS winner',
  },
  {
    file: 'packages/plugin-sagas-core/tests/stores/kv-saga-store_redis_test.ts',
    name: 'KvSagaStore over real Redis lists entries and admits one expected-version save',
  },
] as const;

export const REDIS_ADAPTER_PATH = 'packages/kv/adapters/redis.adapter.ts';

const ATOMIC_TAIL_FIELD = '  private atomicTail: Promise<void> = Promise.resolve();\n';
const SERIALIZED_ATOMIC_WRAPPER = `  async atomic(
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult> {
    const previous = this.atomicTail;
    const next = Promise.withResolvers<void>();
    this.atomicTail = next.promise;
    await previous;

    try {
      return await this.executeAtomic(checks, mutations);
    } finally {
      next.resolve();
    }
  }

  private async executeAtomic(
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult> {`;
const PRE_FIX_ATOMIC_HEADER = `  async atomic(
    checks: AtomicCheck[],
    mutations: AtomicMutation[],
  ): Promise<AtomicResult> {`;

interface TestOutcome {
  readonly success: boolean;
  readonly code: number;
  readonly output: string;
}

function replaceExactlyOnce(source: string, from: string, to: string, label: string): string {
  const first = source.indexOf(from);
  if (first < 0 || source.indexOf(from, first + from.length) >= 0) {
    throw new Error(`cannot apply #1075 negative control: expected exactly one ${label}`);
  }
  return `${source.slice(0, first)}${to}${source.slice(first + from.length)}`;
}

/** Removes only the field and serialization wrapper introduced by #1075. */
export function removeRedisAtomicSerialization(source: string): string {
  const withoutTail = replaceExactlyOnce(source, ATOMIC_TAIL_FIELD, '', 'atomicTail field');
  return replaceExactlyOnce(
    withoutTail,
    SERIALIZED_ATOMIC_WRAPPER,
    PRE_FIX_ATOMIC_HEADER,
    'atomic serialization wrapper',
  );
}

/** Missing configuration is a gate failure, never an implicit test skip. */
export function requireRedisRegressionUrl(value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error('NETSCRIPT_TEST_REDIS_URL is required; refusing silently skipped Redis tests');
  }
  const parsed = new URL(value);
  if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
    throw new Error('NETSCRIPT_TEST_REDIS_URL must use redis: or rediss:');
  }
  return value;
}

async function runTests(files: readonly string[]): Promise<TestOutcome> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: ['test', '--allow-all', ...files],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const decoder = new TextDecoder();
  return {
    success: output.success,
    code: output.code,
    output: `${decoder.decode(output.stdout)}${decoder.decode(output.stderr)}`,
  };
}

function printOutcome(outcome: TestOutcome): void {
  const output = outcome.output.trimEnd();
  if (output) console.log(output);
}

function observedTest(output: string, name: string, expected: 'ok' | 'FAILED'): boolean {
  return output.split('\n').some((line) => line.includes(name) && line.includes(expected));
}

async function runRequiredIntegration(): Promise<void> {
  requireRedisRegressionUrl(Deno.env.get('NETSCRIPT_TEST_REDIS_URL'));
  const files = REDIS_REGRESSIONS.map((regression) => regression.file);
  console.log(`redis regression gate: running ${files.join(', ')}`);
  const outcome = await runTests(files);
  printOutcome(outcome);
  if (!outcome.success) {
    throw new Error(`Redis regression tests failed with exit ${outcome.code}`);
  }
  for (const { name } of REDIS_REGRESSIONS) {
    if (!observedTest(outcome.output, name, 'ok')) {
      throw new Error(`Redis regression test was not observed running: ${name}`);
    }
  }
  console.log('redis regression gate: both required real-Redis tests executed and passed');
}

async function runNegativeControl(): Promise<void> {
  requireRedisRegressionUrl(Deno.env.get('NETSCRIPT_TEST_REDIS_URL'));
  const original = await Deno.readTextFile(REDIS_ADAPTER_PATH);
  const preFix = removeRedisAtomicSerialization(original);
  const failures: string[] = [];
  try {
    await Deno.writeTextFile(REDIS_ADAPTER_PATH, preFix);
    for (const { file, name } of REDIS_REGRESSIONS) {
      console.log(`redis negative control: running ${file} without #1075 serialization`);
      const outcome = await runTests([file]);
      printOutcome(outcome);
      if (outcome.success || !observedTest(outcome.output, name, 'FAILED')) {
        failures.push(`${file} did not fail at ${name}`);
      }
    }
  } finally {
    await Deno.writeTextFile(REDIS_ADAPTER_PATH, original);
  }
  if (failures.length) {
    throw new Error(`#1075 negative control was not detected:\n${failures.join('\n')}`);
  }
  console.log(
    'redis negative control: PASS — reverting #1075 makes both required integrations fail',
  );
}

if (import.meta.main) {
  try {
    const negativeControl = Deno.args.length === 1 && Deno.args[0] === '--negative-control';
    if (Deno.args.length > (negativeControl ? 1 : 0)) {
      throw new Error('Usage: redis-regression-gate [--negative-control]');
    }
    await (negativeControl ? runNegativeControl() : runRequiredIntegration());
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}
