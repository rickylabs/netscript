import { assertEquals, assertThrows } from '@std/assert';
import {
  explicitServicePort,
  parseReadmeQuickstartCommands,
  README_QUICKSTART_END_MARKER,
  README_QUICKSTART_START_MARKER,
  readmeQuickstartArgv,
  substituteReadmeQuickstartCommand,
} from '../../src/domain/readme-quickstart.ts';

Deno.test('README Quickstart parser extracts bash commands with source lines', () => {
  const markdown = [
    '# Before',
    README_QUICKSTART_START_MARKER,
    'prose',
    '```bash',
    '# numbered explanation',
    'tool first --flag   # inline explanation',
    '',
    'tool second',
    '# {"status":"healthy"}',
    '```',
    '```ts',
    'ignored()',
    '```',
    README_QUICKSTART_END_MARKER,
  ].join('\n');

  assertEquals(parseReadmeQuickstartCommands(markdown), [
    { command: 'tool first --flag', line: 6 },
    { command: 'tool second', line: 8 },
  ]);
});

Deno.test('README Quickstart parser accepts CRLF marker blocks', () => {
  const markdown = [
    README_QUICKSTART_START_MARKER,
    '```bash',
    'tool command',
    '```',
    README_QUICKSTART_END_MARKER,
  ].join('\r\n');

  assertEquals(parseReadmeQuickstartCommands(markdown), [
    { command: 'tool command', line: 3 },
  ]);
});

Deno.test('README Quickstart parser fails closed on missing or duplicate markers', () => {
  assertThrows(
    () => parseReadmeQuickstartCommands('```bash\ntool command\n```'),
    Error,
    'requires exactly one',
  );
  assertThrows(
    () =>
      parseReadmeQuickstartCommands(
        `${README_QUICKSTART_START_MARKER}\n${README_QUICKSTART_START_MARKER}\n${README_QUICKSTART_END_MARKER}`,
      ),
    Error,
    'found 2',
  );
});

Deno.test('README Quickstart parser fails closed on an unclosed bash fence', () => {
  assertThrows(
    () =>
      parseReadmeQuickstartCommands(
        `${README_QUICKSTART_START_MARKER}\n\`\`\`bash\ntool command\n${README_QUICKSTART_END_MARKER}`,
      ),
    Error,
    'is not closed',
  );
});

Deno.test('README Quickstart substitution permits only version and receipt-backed port', () => {
  assertEquals(
    substituteReadmeQuickstartCommand('install cli@<version>', { version: '0.0.7' }, 12),
    'install cli@0.0.7',
  );
  assertEquals(
    substituteReadmeQuickstartCommand(
      'curl --fail-with-body --show-error --max-time 15 http://localhost:<port>/health',
      { version: '0.0.7', port: 43210 },
      72,
    ),
    'curl --fail-with-body --show-error --max-time 15 http://localhost:43210/health',
  );
  assertThrows(
    () =>
      substituteReadmeQuickstartCommand(
        'curl --fail-with-body --show-error --max-time 15 http://localhost:<port>/health',
        { version: '0.0.7' },
        72,
      ),
    Error,
    'README line 72',
  );
  assertThrows(
    () => substituteReadmeQuickstartCommand('tool <workspace>', { version: '0.0.7' }, 15),
    Error,
    'unsupported placeholder <workspace>',
  );
});

Deno.test('README Quickstart argv rejects shell quoting instead of rewriting it', () => {
  assertEquals(readmeQuickstartArgv('aspire wait postgres --status healthy', 1), [
    'aspire',
    'wait',
    'postgres',
    '--status',
    'healthy',
  ]);
  assertThrows(() => readmeQuickstartArgv('tool "rewritten value"', 18), Error, 'README line 18');
});

Deno.test('README Quickstart exposes service readiness and curl bounds in literal argv', () => {
  assertEquals(
    readmeQuickstartArgv(
      'aspire wait users --status healthy --timeout 60 --apphost aspire/apphost.mts',
      1,
    ),
    [
      'aspire',
      'wait',
      'users',
      '--status',
      'healthy',
      '--timeout',
      '60',
      '--apphost',
      'aspire/apphost.mts',
    ],
  );
  assertEquals(
    readmeQuickstartArgv(
      'curl --fail-with-body --show-error --max-time 15 http://localhost:43210/health',
      2,
    ),
    [
      'curl',
      '--fail-with-body',
      '--show-error',
      '--max-time',
      '15',
      'http://localhost:43210/health',
    ],
  );
});

Deno.test('README Quickstart port selection requires an explicit Aspire receipt port', () => {
  assertEquals(
    explicitServicePort(['tcp://localhost:5432', 'https://localhost:41001', 'http://x:41002']),
    41001,
  );
  assertThrows(
    () => explicitServicePort(['https://example.test/path', 'tcp://localhost:5432']),
    Error,
    'no explicit HTTP port',
  );
});
