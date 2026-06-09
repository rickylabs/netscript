import { assertEquals } from 'jsr:@std/assert@^1';
import { StreamsCli, streamsCli } from '../../src/cli/composition/main.ts';

Deno.test('StreamsCli exposes the streams command registry', async () => {
  const cli = new StreamsCli();
  const commands = cli.commands();

  assertEquals(cli.name, 'streams');
  assertEquals(cli.description, 'Durable Streams plugin CLI.');
  assertEquals(commands.map((command) => command.name), [
    'list-topics',
    'subscribe',
    'publish',
    'stats',
    'clear',
  ]);

  const listTopics = await cli.run({ command: 'list-topics' });
  assertEquals(listTopics.code, 0);
  assertEquals(listTopics.data, { topics: [] });

  const missing = await cli.run({ command: 'missing-command' });
  assertEquals(missing.code, 1);
});

Deno.test('streamsCli composition root provides the default CLI instance', () => {
  assertEquals(streamsCli.name, 'streams');
  assertEquals(streamsCli.commands().length, 5);
});
