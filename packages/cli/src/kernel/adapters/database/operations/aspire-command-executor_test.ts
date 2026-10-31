import { assertEquals, assertRejects } from '@std/assert';
import { watchExecutableCompletion } from './operation-runner-helpers.ts';
import { DenoAspireCommandExecutor } from './aspire-command-executor.ts';

for (const override of [undefined, '', '/toolchain/pinned aspire']) {
  Deno.test(`Aspire database output and spawn resolve ${override === undefined ? 'unset' : override || 'empty'} executable`, async () => {
    const prior = Deno.env.get('NETSCRIPT_ASPIRE_CLI');
    const commands: Array<{ command: string | URL; options?: Deno.CommandOptions }> = [];
    const OriginalCommand = Deno.Command;
    Deno.Command = class extends OriginalCommand {
      constructor(command: string | URL, options?: Deno.CommandOptions) {
        commands.push({ command, options });
        super(Deno.execPath(), { args: ['eval', ''], stdout: 'null', stderr: 'null' });
      }
      override output(): Promise<Deno.CommandOutput> {
        return Promise.resolve({
          code: 0,
          success: true,
          signal: null,
          stdout: new TextEncoder().encode('output'),
          stderr: new Uint8Array(),
        });
      }
    };
    try {
      if (override === undefined) Deno.env.delete('NETSCRIPT_ASPIRE_CLI');
      else Deno.env.set('NETSCRIPT_ASPIRE_CLI', override);
      const executor = new DenoAspireCommandExecutor();
      const signal = new AbortController().signal;
      assertEquals(await executor.output(['describe'], { cwd: '.', signal }), {
        code: 0,
        stdout: 'output',
        stderr: '',
      });
      assertEquals(await executor.spawn(['start'], { cwd: '.', signal }), 0);
      assertEquals(commands.map((entry) => entry.command), [
        override || 'aspire',
        override || 'aspire',
      ]);
      assertEquals(commands.map((entry) => entry.options?.args), [['describe'], ['start']]);
      assertEquals(commands.every((entry) => entry.options?.signal === signal), true);
      await executor.output(['ps'], { cwd: '.', env: { NETSCRIPT_ASPIRE_CLI: '/project/aspire' } });
      assertEquals(commands[2].command, '/project/aspire');
      assertEquals(commands.length, 3);
    } finally {
      Deno.Command = OriginalCommand;
      if (prior === undefined) Deno.env.delete('NETSCRIPT_ASPIRE_CLI');
      else Deno.env.set('NETSCRIPT_ASPIRE_CLI', prior);
    }
  });
}

interface FollowerObservation {
  readonly signals: Array<Deno.Signal | number>;
  reaped: boolean;
}

/** Fake Aspire's wire protocol with a real child so Deno's resource sanitizer checks disposal. */
async function withFakeCli(
  script: string,
  run: (executor: DenoAspireCommandExecutor, observed: FollowerObservation) => Promise<void>,
): Promise<void> {
  const OriginalCommand = Deno.Command;
  const observed: FollowerObservation = { signals: [], reaped: false };
  Deno.Command = class extends OriginalCommand {
    constructor(_command: string | URL, options?: Deno.CommandOptions) {
      super(Deno.execPath(), {
        args: ['eval', script],
        stdin: options?.stdin,
        stdout: options?.stdout,
        stderr: options?.stderr,
      });
    }
    override spawn(): Deno.ChildProcess {
      const child = super.spawn();
      const kill = child.kill.bind(child);
      child.kill = (signal = 'SIGTERM') => {
        observed.signals.push(signal);
        kill(signal);
      };
      void child.status.then(() => {
        observed.reaped = true;
      });
      return child;
    }
  };
  try {
    await run(new DenoAspireCommandExecutor(), observed);
  } finally {
    Deno.Command = OriginalCommand;
  }
}

const BASELINE = JSON.stringify({
  displayName: 'db-cli',
  resourceType: 'Executable',
  state: 'Stopped',
  exitCode: 33,
});
const ACTIVE = JSON.stringify({
  displayName: 'db-cli',
  resourceType: 'Executable',
  state: 'Running',
});
const FINISHED = JSON.stringify({
  displayName: 'db-cli',
  resourceType: 'Executable',
  state: 'Finished',
  exitCode: 7,
});
const DRAIN_STDERR = 'Deno.stderr.writeSync(new Uint8Array(256 * 1024).fill(120));';
const STAY_ALIVE = 'setInterval(() => {}, 1000);';

function watch(
  executor: DenoAspireCommandExecutor,
  signal = new AbortController().signal,
  timeoutMs = 5_000,
) {
  return watchExecutableCompletion(executor, {
    resourceName: 'db-cli',
    apphostPath: 'project/aspire/apphost.mts',
    cwd: '.',
    signal,
    timeoutMs,
    start: async () => {},
  });
}

Deno.test('follow early terminal return drains stderr, kills and reaps its fake CLI', async () => {
  await withFakeCli(
    `${DRAIN_STDERR} console.log(${
      JSON.stringify([BASELINE, ACTIVE, FINISHED].join('\n'))
    }); ${STAY_ALIVE}`,
    async (executor, observed) => {
      assertEquals(await watch(executor), 7);
      assertEquals(observed.signals, ['SIGTERM']);
      assertEquals(observed.reaped, true);
    },
  );
});

Deno.test('follow quiet timeout drains stderr and force-kills a SIGTERM-ignoring child', async () => {
  await withFakeCli(
    `Deno.addSignalListener('SIGTERM', () => {}); ${DRAIN_STDERR} console.log(${
      JSON.stringify(BASELINE)
    }); ${STAY_ALIVE}`,
    async (executor, observed) => {
      await assertRejects(() => watch(executor, undefined, 500), Error, 'Timed out waiting');
      assertEquals(observed.signals, ['SIGTERM', 'SIGKILL']);
      assertEquals(observed.reaped, true);
    },
  );
});

Deno.test('follow owner abort drains stderr, kills and reaps its child', async () => {
  await withFakeCli(
    `${DRAIN_STDERR} console.log(${JSON.stringify(BASELINE)}); ${STAY_ALIVE}`,
    async (executor, observed) => {
      const controller = new AbortController();
      await assertRejects(
        () =>
          watchExecutableCompletion(executor, {
            resourceName: 'db-cli',
            apphostPath: 'project/aspire/apphost.mts',
            cwd: '.',
            signal: controller.signal,
            timeoutMs: 5_000,
            start: () => {
              controller.abort(new Error('owner cancelled'));
              return Promise.resolve();
            },
          }),
        Error,
        'owner cancelled',
      );
      assertEquals(observed.signals, ['SIGTERM']);
      assertEquals(observed.reaped, true);
    },
  );
});

Deno.test('follow malformed JSON drains stderr, kills and reaps its child', async () => {
  await withFakeCli(
    `${DRAIN_STDERR} console.log('not-json'); ${STAY_ALIVE}`,
    async (executor, observed) => {
      await assertRejects(() => watch(executor), SyntaxError);
      assertEquals(observed.signals, ['SIGTERM']);
      assertEquals(observed.reaped, true);
    },
  );
});

Deno.test('follow decodes split UTF-8, CRLF, empty lines and trailing records', async () => {
  const script = `const b = new TextEncoder().encode('α\\r\\n\\nω');
    for (const byte of b) { await Deno.stdout.write(new Uint8Array([byte])); await new Promise(r => setTimeout(r, 1)); }`;
  await withFakeCli(script, async (executor, observed) => {
    const lines = [];
    for await (const line of executor.stream(['describe', '--follow'], { cwd: '.' })) {
      lines.push(line);
    }
    assertEquals(lines, ['α', 'ω']);
    assertEquals(observed.reaped, true);
  });
});

Deno.test('follow reports nonzero exit with bounded stderr and reaps child', async () => {
  await withFakeCli(`${DRAIN_STDERR} Deno.exit(9);`, async (executor, observed) => {
    await assertRejects(
      async () => {
        for await (const _line of executor.stream(['describe', '--follow'], { cwd: '.' })) {
          /* empty */
        }
      },
      Error,
      'Aspire stream exited 9:',
    );
    assertEquals(observed.reaped, true);
  });
});

Deno.test('follow refuses an oversized line and reaps child', async () => {
  await withFakeCli(
    `console.log('x'.repeat(1_048_577)); ${STAY_ALIVE}`,
    async (executor, observed) => {
      await assertRejects(
        async () => {
          for await (
            const _line of executor.stream(['describe', '--follow'], { cwd: '.' })
          ) { /* empty */ }
        },
        Error,
        'Aspire stream line too large',
      );
      assertEquals(observed.reaped, true);
    },
  );
});
