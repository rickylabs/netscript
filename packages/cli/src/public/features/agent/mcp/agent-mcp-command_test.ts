import { assertEquals, assertStringIncludes } from '@std/assert';
import type { AgentMcpInput } from './agent-mcp-input.ts';
import {
  AGENT_MCP_INTERACTIVE_GUIDANCE,
  createAgentMcpCommand,
} from './agent-mcp-command.ts';

Deno.test('agent mcp explains stdio setup and does not start a server on a TTY', async () => {
  const messages: string[] = [];
  let runs = 0;
  const command = createAgentMcpCommand({
    resolvePath: () => '/workspace',
    isInteractive: () => true,
    writeGuidance: (message) => messages.push(message),
    run: () => {
      runs++;
      return Promise.resolve();
    },
  });

  await command.parse([]);

  assertEquals(runs, 0);
  assertEquals(messages, [AGENT_MCP_INTERACTIVE_GUIDANCE]);
  assertStringIncludes(messages[0], 'not meant to be run by hand');
  assertStringIncludes(messages[0], '.zed/settings.json');
  assertStringIncludes(messages[0], '.vscode/mcp.json');
  assertStringIncludes(messages[0], 'https://netscript.dev/ai/agent-tooling/');
});

Deno.test('agent mcp starts silently when stdin is piped', async () => {
  const messages: string[] = [];
  let received: AgentMcpInput | undefined;
  const command = createAgentMcpCommand({
    resolvePath: (path) => path ? `/resolved/${path}` : '/workspace',
    isInteractive: () => false,
    writeGuidance: (message) => messages.push(message),
    run: (input) => {
      received = input;
      return Promise.resolve();
    },
  });

  await command.parse(['--project-root', 'project', '--docs-root', 'docs']);

  assertEquals(messages, []);
  assertEquals(received, {
    endpoint: undefined,
    projectRoot: '/resolved/project',
    docsRoot: '/resolved/docs',
  });
});

Deno.test('agent mcp help names stdio transport and client configuration docs', () => {
  const help = createAgentMcpCommand({
    resolvePath: () => '/workspace',
    run: () => Promise.resolve(),
  }).getHelp();

  assertStringIncludes(help, 'stdio MCP server');
  assertStringIncludes(help, 'https://netscript.dev/ai/agent-tooling/');
});
