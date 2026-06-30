import { assertEquals } from '@std/assert';
import { normalizePluginArgv, parsePluginCliArgs } from '../../src/cli/mod.ts';

Deno.test('normalizePluginArgv parses long flags and positional values', () => {
  assertEquals(normalizePluginArgv(['--dry-run', '--name=welcome', '--no-watch', 'jobs']), {
    flags: { 'dry-run': true, name: 'welcome', watch: false },
    values: ['jobs'],
  });
});

Deno.test('parsePluginCliArgs defaults to info and parses the remaining argv', () => {
  assertEquals(parsePluginCliArgs([]), {
    command: 'info',
    flags: {},
    values: [],
  });
  assertEquals(parsePluginCliArgs(['status', '--json']), {
    command: 'status',
    flags: { json: true },
    values: [],
  });
});
