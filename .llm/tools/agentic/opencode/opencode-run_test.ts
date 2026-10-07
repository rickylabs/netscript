import { assertEquals, assertRejects } from '@std/assert';
import { ROUTING_MODEL_IDS } from '../config/models.ts';
import { OPENCODE_TOOL } from '../config/versions.ts';
import { evaluateCopilotExpense } from '../runtime/subscription-expense.ts';
import { ownerMatrixOverrideWorklogEntry } from '@harness/matrix';
import {
  openCodeChildEnvironment,
  opencodeRunArguments,
  parseOpenRouterApiKey,
  preflightOpenCodeExpense,
  resolveOpenCodeBinary,
  runOpenCode,
} from './opencode-run.ts';

Deno.test('Copilot launch reserves after attestation and writes pending identity without secrets', async () => {
  const cwd = await Deno.makeTempDir();
  const now = '2026-09-04T20:00:00Z';
  const order: string[] = [];
  try {
    const result = await runOpenCode(
      {
        message: 'bounded test',
        model: ROUTING_MODEL_IDS.gemini38FlashCopilot,
        variant: 'high',
        workloadTier: 'feature',
        workloadRole: 'deep_research',
        cwd,
        receiptPath: 'launch.jsonl',
      },
      true,
      {
        env: { HOME: cwd, GH_TOKEN: 'never-retain', OPENAI_API_KEY: 'never-retain' },
        now: () => now,
        repositoryIdentity: () => Promise.resolve({ branch: 'feat/test', head: 'a'.repeat(40) }),
        listModels: () => {
          order.push('catalog');
          return Promise.resolve(
            `${ROUTING_MODEL_IDS.gemini38FlashCopilot}\n` +
              JSON.stringify({ variants: { low: {}, medium: {}, high: {} } }),
          );
        },
        reserveCopilot: (options) => {
          order.push('reserve');
          assertEquals(options.cap, 100);
          return Promise.resolve(
            evaluateCopilotExpense(
              { schemaVersion: 1, month: '2026-09', updatedAt: now, usedCredits: 0 },
              options.cap,
              now,
            ),
          );
        },
        spawn: (_binary, options) => {
          order.push('spawn');
          assertEquals(options.clearEnv, true);
          assertEquals(options.env?.GH_TOKEN, undefined);
          assertEquals(options.env?.OPENAI_API_KEY, undefined);
          assertEquals(options.args?.slice(-2), ['--variant', 'high']);
          assertEquals(JSON.stringify(options).includes('never-retain'), false);
          return new Deno.Command(Deno.execPath(), {
            args: ['eval', 'console.log("fixture answer")'],
            stdout: 'piped',
            stderr: 'null',
          }).spawn();
        },
      },
    );
    assertEquals(result.code, 0);
    assertEquals(order, ['catalog', 'reserve', 'spawn']);
    const source = await Deno.readTextFile(`${cwd}/launch.jsonl`);
    assertEquals(source.includes('never-retain'), false);
    const receipt = JSON.parse(source);
    assertEquals(receipt.identity.requested.effort, 'high');
    assertEquals(receipt.identity.observed.catalog.present, true);
    assertEquals(receipt.identity.status, 'pending');
    assertEquals(receipt.head, 'a'.repeat(40));
  } finally {
    await Deno.remove(cwd, { recursive: true });
  }
});

Deno.test('absent Copilot catalog never reserves credits or spawns inference', async () => {
  await assertRejects(
    () =>
      runOpenCode(
        {
          message: 'no launch',
          model: ROUTING_MODEL_IDS.gemini38FlashCopilot,
          variant: 'provider_default',
          cwd: '/work',
          receiptPath: 'launch.jsonl',
          workloadTier: 'feature',
          workloadRole: 'deep_research',
        },
        false,
        {
          env: { HOME: '/home/test' },
          repositoryIdentity: () => Promise.resolve({ branch: 'test', head: 'a'.repeat(40) }),
          listModels: () => Promise.resolve(''),
          reserveCopilot: () => {
            throw new Error('must not reserve');
          },
          spawn: () => {
            throw new Error('must not spawn');
          },
        },
      ),
    Error,
    'catalog model or variant absent',
  );
});

Deno.test('OpenCode argv keeps the message before every flag', () => {
  assertEquals(
    opencodeRunArguments({
      message: 'inspect this design',
      model: 'caller/model',
      variant: 'max',
    }),
    ['run', 'inspect this design', '-m', 'caller/model', '--variant', 'max'],
  );
});

Deno.test('Copilot Kimi forwards a catalog-attestable reasoning variant', () => {
  assertEquals(
    opencodeRunArguments({
      message: 'implement heavy UI',
      model: ROUTING_MODEL_IDS.kimiK3Copilot,
      variant: 'max',
    }),
    [
      'run',
      'implement heavy UI',
      '-m',
      ROUTING_MODEL_IDS.kimiK3Copilot,
      '--variant',
      'max',
    ],
  );
});

Deno.test('OpenCode argv repeats -f and passes variant and JSON format through', () => {
  assertEquals(
    opencodeRunArguments({
      message: 'compare both images',
      model: 'caller/model',
      variant: 'minimal',
      files: ['/wsl/first.png', '/wsl/second.png'],
      format: 'json',
    }),
    [
      'run',
      'compare both images',
      '-m',
      'caller/model',
      '--variant',
      'minimal',
      '-f',
      '/wsl/first.png',
      '-f',
      '/wsl/second.png',
      '--format',
      'json',
    ],
  );
});

Deno.test('OpenCode argv resumes the exact stored session before provider dispatch', () => {
  assertEquals(
    opencodeRunArguments({
      message: 'continue safely',
      model: 'caller/model',
      variant: 'high',
      session: 'ses_local-42',
    }),
    [
      'run',
      'continue safely',
      '-m',
      'caller/model',
      '--variant',
      'high',
      '--session',
      'ses_local-42',
    ],
  );
});

Deno.test('OpenCode binary override takes precedence over PATH-resolved name', () => {
  assertEquals(
    resolveOpenCodeBinary({ OPENCODE_BIN: '/custom/opencode', PATH: '/bin' }),
    '/custom/opencode',
  );
  assertEquals(resolveOpenCodeBinary({ OPENCODE_BIN: '  ', PATH: '/bin' }), 'opencode');
  assertEquals(resolveOpenCodeBinary({ PATH: '/bin' }), 'opencode');
});

Deno.test('OpenRouter env parser accepts export and quoted values', () => {
  assertEquals(parseOpenRouterApiKey("# secret\nexport OPENROUTER_API_KEY='opaque'\n"), 'opaque');
  assertEquals(parseOpenRouterApiKey('UNRELATED=value\n'), undefined);
});

Deno.test('existing OpenRouter key wins without reading the config file', async () => {
  let reads = 0;
  const env = await openCodeChildEnvironment(
    { HOME: '/home/test', OPENROUTER_API_KEY: 'already-exported' },
    () => {
      reads++;
      return Promise.resolve('OPENROUTER_API_KEY=from-file');
    },
    { model: ROUTING_MODEL_IDS.glm53FlashOpenRouter },
  );
  assertEquals(env.OPENROUTER_API_KEY, 'already-exported');
  assertEquals(reads, 0);
});

Deno.test('OpenRouter key falls back to the configured mode-600 user env file', async () => {
  let requestedPath = '';
  const env = await openCodeChildEnvironment(
    { HOME: '/home/test' },
    (path) => {
      requestedPath = path;
      return Promise.resolve('OPENROUTER_API_KEY=from-file');
    },
    {
      model: ROUTING_MODEL_IDS.glm53FlashOpenRouter,
      stat: () => Promise.resolve({ mode: 0o100600 }),
    },
  );
  assertEquals(requestedPath, `/home/test/${OPENCODE_TOOL.openRouterEnvRelativePath}`);
  assertEquals(env.OPENROUTER_API_KEY, 'from-file');
});

Deno.test('paid OpenCode route is blocked before dispatch when expense proof is absent', async () => {
  let message = '';
  try {
    await preflightOpenCodeExpense({
      message: 'do work',
      model: ROUTING_MODEL_IDS.glm53FlashGo,
      variant: 'high',
      workloadTier: 'straightforward',
      workloadRole: 'implementation',
    });
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assertEquals(
    message,
    'paid opencode_go route requires --estimated-cost-usd',
  );
});

Deno.test('paid OpenCode Go route accepts a fresh live allowance decision', async () => {
  const decision = await preflightOpenCodeExpense(
    {
      message: 'do work',
      model: ROUTING_MODEL_IDS.glm53FlashGo,
      variant: 'high',
      workloadTier: 'straightforward',
      workloadRole: 'implementation',
      estimatedCostUsd: 0.01,
    },
    {
      env: { OPENCODE_API_KEY: 'opaque' },
      listModels: () => Promise.resolve(Object.values(ROUTING_MODEL_IDS).join('\n')),
      fetch: () =>
        Promise.resolve(Response.json({
          usage: {
            rolling: { percent: 1, status: 'ok' },
            weekly: { percent: 2, status: 'ok' },
            monthly: { percent: 3, status: 'ok' },
          },
        })),
      now: () => '2026-09-04T16:00:00.000Z',
    },
  );
  assertEquals(decision?.allowed, true);
});

Deno.test('owner matrix override requires the exact durable worklog grant before spend', async () => {
  const ownerMatrixOverride = {
    authorizer: 'owner' as const,
    rationale: 'Owner requested Kimi for this bounded implementation.',
    worklogPath: '.llm/runs/override-test/worklog.md',
    route: { model: 'kimi_k3' as const, effort: 'high' as const },
  };
  const options = {
    message: 'do work',
    model: ROUTING_MODEL_IDS.kimiK3Copilot,
    variant: 'high',
    cwd: '/work',
    receiptPath: 'launch.jsonl',
    workloadTier: 'straightforward' as const,
    workloadRole: 'implementation' as const,
    ownerMatrixOverride,
  };
  let reservations = 0;
  const dependencies = {
    now: () => '2026-09-04T16:00:00.000Z',
    reserveCopilot: () => {
      reservations++;
      return Promise.resolve(evaluateCopilotExpense(
        {
          schemaVersion: 1 as const,
          month: '2026-09',
          updatedAt: '2026-09-04T16:00:00.000Z',
          usedCredits: 0,
        },
        100,
        '2026-09-04T16:00:00.000Z',
      ));
    },
  };

  await assertRejects(
    () =>
      preflightOpenCodeExpense(options, {
        ...dependencies,
        readTextFile: () => Promise.resolve('# Worklog\n'),
      }),
    Error,
    'missing its exact harness worklog entry',
  );
  assertEquals(reservations, 0);

  const decision = await preflightOpenCodeExpense(options, {
    ...dependencies,
    readTextFile: () =>
      Promise.resolve(
        '# Worklog\n\n' +
          ownerMatrixOverrideWorklogEntry(
            options.workloadTier,
            options.workloadRole,
            ownerMatrixOverride,
          ) + '\n',
      ),
  });
  assertEquals(decision?.allowed, true);
  assertEquals(reservations, 1);
});

Deno.test('matrix and owner override effort mismatches fail before credit reservation', async () => {
  let reservations = 0;
  const reserveCopilot = () => {
    reservations++;
    throw new Error('reservation must remain unreachable');
  };
  await assertRejects(
    () =>
      preflightOpenCodeExpense({
        message: 'do work',
        model: ROUTING_MODEL_IDS.kimiK3Copilot,
        variant: 'high',
        workloadTier: 'complex',
        workloadRole: 'ui_ux',
        privilegedTierAuthorization: {
          authorizer: 'owner',
          rationale: 'Heavy UI/UX work explicitly requested by the owner.',
        },
      }, { reserveCopilot }),
    Error,
    'does not match complex/ui_ux effort max',
  );

  const ownerMatrixOverride = {
    authorizer: 'owner' as const,
    rationale: 'Owner requested Kimi high for this bounded implementation.',
    worklogPath: '.llm/runs/override-test/worklog.md',
    route: { model: 'kimi_k3' as const, effort: 'high' as const },
  };
  await assertRejects(
    () =>
      preflightOpenCodeExpense({
        message: 'do work',
        model: ROUTING_MODEL_IDS.kimiK3Copilot,
        variant: 'max',
        cwd: '/work',
        workloadTier: 'straightforward',
        workloadRole: 'implementation',
        ownerMatrixOverride,
      }, {
        reserveCopilot,
        readTextFile: () =>
          Promise.resolve(
            ownerMatrixOverrideWorklogEntry(
              'straightforward',
              'implementation',
              ownerMatrixOverride,
            ),
          ),
      }),
    Error,
    'does not match straightforward/implementation effort high in the recorded owner override',
  );
  assertEquals(reservations, 0);
});

Deno.test('denied paid-route expense decision prevents OpenCode process spawn', async () => {
  let spawnCalls = 0;
  await assertRejects(
    () =>
      runOpenCode(
        {
          message: 'do not dispatch',
          model: ROUTING_MODEL_IDS.glm53FlashGo,
          variant: 'high',
          cwd: '/work',
          workloadTier: 'feature',
          workloadRole: 'documentation',
          estimatedCostUsd: 1,
        },
        false,
        {
          env: { OPENCODE_API_KEY: 'opaque' },
          listModels: () => Promise.resolve(Object.values(ROUTING_MODEL_IDS).join('\n')),
          fetch: () =>
            Promise.resolve(Response.json({
              usage: {
                rolling: { percent: 104.5, status: 'rate-limited' },
                weekly: { percent: 41.8, status: 'ok' },
                monthly: { percent: 20.9, status: 'ok' },
              },
            })),
          now: () => '2026-09-04T16:00:00.000Z',
          spawn: () => {
            spawnCalls++;
            throw new Error('spawn must remain unreachable');
          },
        },
      ),
    Error,
    'expense guard blocked opencode_go: provider_rate_limited',
  );
  assertEquals(spawnCalls, 0);
});

Deno.test('unproven live Go usage prevents OpenCode process spawn', async () => {
  for (
    const response of [
      () => Promise.reject(new Error('transport detail must remain private')),
      () => Promise.resolve(new Response('', { status: 503 })),
      () => Promise.resolve(Response.json({ usage: {} })),
    ]
  ) {
    let spawnCalls = 0;
    await assertRejects(
      () =>
        runOpenCode(
          {
            message: 'do not dispatch',
            model: ROUTING_MODEL_IDS.grok47Go,
            variant: 'xhigh',
            workloadTier: 'architecture',
            workloadRole: 'implementation_evaluation',
            privilegedTierAuthorization: {
              authorizer: 'owner',
              rationale: 'Test-only authorized architecture expense-denial path.',
            },
            estimatedCostUsd: 0.1,
          },
          false,
          {
            env: { OPENCODE_API_KEY: 'opaque' },
            listModels: () => Promise.resolve(Object.values(ROUTING_MODEL_IDS).join('\n')),
            fetch: response,
            spawn: () => {
              spawnCalls++;
              throw new Error('spawn must remain unreachable');
            },
          },
        ),
      Error,
    );
    assertEquals(spawnCalls, 0);
  }
});

Deno.test('privileged OpenCode workload cannot reach usage fetch or spawn without authority', async () => {
  let fetchCalls = 0;
  let spawnCalls = 0;
  await assertRejects(
    () =>
      runOpenCode(
        {
          message: 'misclassified architecture review',
          model: ROUTING_MODEL_IDS.grok47Go,
          variant: 'xhigh',
          workloadTier: 'architecture',
          workloadRole: 'implementation_evaluation',
          estimatedCostUsd: 1,
        },
        false,
        {
          env: { OPENCODE_API_KEY: 'opaque' },
          listModels: () => Promise.resolve(Object.values(ROUTING_MODEL_IDS).join('\n')),
          fetch: () => {
            fetchCalls++;
            return Promise.resolve(Response.json({}));
          },
          spawn: () => {
            spawnCalls++;
            throw new Error('spawn must remain unreachable');
          },
        },
      ),
    Error,
    'requires explicit owner or milestone-coordinator authorization',
  );
  assertEquals(fetchCalls, 0);
  assertEquals(spawnCalls, 0);
});

Deno.test('model outside the selected matrix cell cannot reach usage fetch or spawn', async () => {
  let fetchCalls = 0;
  let spawnCalls = 0;
  await assertRejects(
    () =>
      runOpenCode(
        {
          message: 'do not relabel Grok as routine work',
          model: ROUTING_MODEL_IDS.grok47Go,
          variant: 'xhigh',
          workloadTier: 'feature',
          workloadRole: 'implementation_evaluation',
          estimatedCostUsd: 1,
        },
        false,
        {
          env: { OPENCODE_API_KEY: 'opaque' },
          listModels: () => Promise.resolve(Object.values(ROUTING_MODEL_IDS).join('\n')),
          fetch: () => {
            fetchCalls++;
            return Promise.resolve(Response.json({}));
          },
          spawn: () => {
            spawnCalls++;
            throw new Error('spawn must remain unreachable');
          },
        },
      ),
    Error,
    'is not declared for feature/implementation_evaluation',
  );
  assertEquals(fetchCalls, 0);
  assertEquals(spawnCalls, 0);
});

Deno.test('missing configured evaluator catalog never reaches expense or inference', async () => {
  let expenseCalls = 0;
  let spawnCalls = 0;
  const model = ROUTING_MODEL_IDS.museSpark13StandardOpenRouter;
  await assertRejects(
    () =>
      runOpenCode(
        {
          message: 'do not launch',
          model,
          variant: 'max',
          workloadTier: 'feature',
          workloadRole: 'implementation_evaluation',
          estimatedCostUsd: 0.1,
          usageSnapshotPath: 'usage.json',
          cwd: '.',
        },
        false,
        {
          env: { OPENROUTER_API_KEY: 'test-only', GH_TOKEN: 'do-not-forward' },
          listModels: (_binary, options) => {
            assertEquals(options.env?.GH_TOKEN, 'do-not-forward');
            // Provider credential isolation and dispatch environment sanitization remain separate guards.
            assertEquals(options.env?.OPENAI_API_KEY, undefined);
            return Promise.resolve(ROUTING_MODEL_IDS.museSpark13OpenRouter);
          },
          readTextFile: () => {
            expenseCalls++;
            throw new Error('must not reach expense');
          },
          spawn: () => {
            spawnCalls++;
            throw new Error('must not launch');
          },
        },
      ),
    Error,
    'launcher-model-absent',
  );
  assertEquals(expenseCalls, 0);
  assertEquals(spawnCalls, 0);
});

Deno.test('configured Go evaluator refuses rc0 empty/whitespace/metadata output in both capture modes', async () => {
  const cwd = await Deno.makeTempDir();
  const model = ROUTING_MODEL_IDS.grok47Go;
  try {
    for (const capture of [false, true]) {
      for (
        const [format, output, expected] of [
          ['default', '', 3],
          ['default', ' \t\n', 3],
          ['default', 'fixture answer\n', 0],
          ['json', JSON.stringify({ type: 'step_finish', part: { reason: 'stop' } }) + '\n', 3],
          [
            'json',
            JSON.stringify({ type: 'text', part: { type: 'text', text: 'Verdict: PASS' } }) + '\n',
            0,
          ],
        ] as const
      ) {
        const diagnostics: string[] = [];
        const forwarded: number[] = [];
        const result = await runOpenCode(
          {
            message: 'synthetic evaluator only',
            model,
            variant: 'xhigh',
            cwd,
            format,
            workloadTier: 'architecture',
            workloadRole: 'implementation_evaluation',
            estimatedCostUsd: 0.1,
            privilegedTierAuthorization: {
              authorizer: 'owner',
              rationale: 'Synthetic guarded output test only',
            },
          },
          capture,
          {
            env: { HOME: cwd, OPENCODE_API_KEY: 'fixture-credential' },
            now: () => '2026-10-01T00:00:00.000Z',
            listModels: () => Promise.resolve(model + '\n'),
            fetch: () =>
              Promise.resolve(Response.json({
                usage: {
                  rolling: { percent: 1, status: 'ok' },
                  weekly: { percent: 1, status: 'ok' },
                  monthly: { percent: 1, status: 'ok' },
                },
              })),
            writeStdout: (bytes) => {
              forwarded.push(...bytes);
              return Promise.resolve(bytes.length);
            },
            reportOutputFailure: (message) => diagnostics.push(message),
            spawn: (_binary, options) => {
              assertEquals(options.stdout, 'piped');
              return new Deno.Command(Deno.execPath(), {
                args: [
                  'eval',
                  `await Deno.stdout.write(new TextEncoder().encode(${JSON.stringify(output)}))`,
                ],
                stdout: 'piped',
                stderr: 'null',
              }).spawn();
            },
          },
        );
        assertEquals(result.code, expected);
        assertEquals(result.stdout, capture ? output : undefined);
        assertEquals(new TextDecoder().decode(new Uint8Array(forwarded)), capture ? '' : output);
        assertEquals(diagnostics.length, expected === 0 ? 0 : 1);
        if (expected !== 0) {
          assertEquals(result.failure, 'empty-answer');
          assertEquals(
            diagnostics[0],
            `opencode-empty-answer: model ${model} produced no verified answer output`,
          );
          assertEquals(diagnostics[0].includes('fixture-credential'), false);
        }
      }
    }
  } finally {
    await Deno.remove(cwd, { recursive: true });
  }
});
