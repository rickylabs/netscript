import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1';
import { artifactText, collectInstallArtifacts, substituteTokens } from '@netscript/plugin/adapter';
import { aiAdapterPlugin } from '../plugin.ts';
import { agentScaffolder, threadStoreScaffolder, toolScaffolder } from './mod.ts';
import { DEFAULT_TOOL_INPUT } from './tool/tool.ts';
import { toolStub } from './tool/tool.stub.ts';

const FORBIDDEN_PREFIXES = [
  'plugins/',
  'services/',
  'contracts/',
  'src/runtime/',
  'src/adapter/',
  'bin/',
  'scaffold.plugin.json',
  'deno.json',
] as const;

Deno.test('ai install emits only userland glue under ai/', () => {
  const artifacts = collectInstallArtifacts(aiAdapterPlugin);

  assertEquals(artifacts.map((artifact) => artifact.path), [
    'ai/models.ts',
    'ai/ai.ts',
    'ai/tools/echo.ts',
    'ai/agents/assistant.ts',
    'ai/routes/chat-stream.ts',
    'ai/routes/chat.tsx',
  ]);
  for (const artifact of artifacts) {
    assertEquals(artifact.path.startsWith('ai/'), true);
    for (const forbidden of FORBIDDEN_PREFIXES) {
      assertEquals(
        artifact.path.includes(forbidden),
        false,
        `artifact ${artifact.path} must not contain ${forbidden}`,
      );
    }
  }
});

Deno.test('ai default topology is in-process (no gateway config emitted)', () => {
  const texts = collectInstallArtifacts(aiAdapterPlugin).map(artifactText).join('\n');

  // The stream route calls @netscript/ai directly; it does not proxy to a gateway URL.
  assertStringIncludes(texts, "from '@netscript/ai/agent'");
  assertEquals(texts.includes('AI_GATEWAY_URL'), false);
  assertEquals(texts.includes('createNetScriptChatStreamProxy'), false);
});

Deno.test('ai stream route threads AbortSignal and exposes stop() (F-13)', () => {
  const streamRoute = collectInstallArtifacts(aiAdapterPlugin).find((artifact) =>
    artifact.path === 'ai/routes/chat-stream.ts'
  );
  const source = streamRoute ? artifactText(streamRoute) : '';

  assertStringIncludes(source, 'request.signal');
  assertStringIncludes(source, 'generation.stop()');
});

Deno.test('ai install starter tool is byte-identical to add tool default emission', () => {
  const installTool = collectInstallArtifacts(aiAdapterPlugin).find((artifact) =>
    artifact.path === 'ai/tools/echo.ts'
  );
  const addTool = toolScaffolder.emit(DEFAULT_TOOL_INPUT)[0];

  assertEquals(installTool?.path, addTool.path);
  assertEquals(installTool ? artifactText(installTool) : undefined, artifactText(addTool));
});

Deno.test('ai add tool/agent emit the same shape at the user-named path', () => {
  const [tool] = toolScaffolder.emit({ id: 'summarize-text' });
  assertEquals(tool.path, 'ai/tools/summarize-text.ts');
  assertStringIncludes(artifactText(tool), 'summarizeTextTool');
  assertStringIncludes(artifactText(tool), "name: 'summarize-text'");

  const [agent] = agentScaffolder.emit({ id: 'researcher' });
  assertEquals(agent.path, 'ai/agents/researcher.ts');
  assertStringIncludes(artifactText(agent), 'createResearcherAgent');
});

Deno.test('ai thread-store resource is opt-in (add-only, not installed by default)', () => {
  const installPaths = collectInstallArtifacts(aiAdapterPlugin).map((artifact) => artifact.path);
  const [store] = threadStoreScaffolder.emit({ id: 'thread-store' });

  assertEquals(installPaths.includes(store.path), false);
  assertEquals(store.path, 'ai/thread-store.ts');
});

Deno.test('ai resource token map rejects misspelled tokens at compile time', () => {
  // @ts-expect-error TOOL_EXPORT is required by toolStub.
  substituteTokens(toolStub, { TOOL_ID: 'broken' });
  assertEquals(true, true);
});
