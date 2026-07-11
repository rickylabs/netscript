import { assert, assertEquals } from '@std/assert';
import {
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import { BasicTracerProvider } from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
import {
  ATTR_GEN_AI_OPERATION_NAME,
  ATTR_GEN_AI_REQUEST_MODEL,
  ATTR_GEN_AI_TOOL_NAME,
  ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
} from '@opentelemetry/semantic-conventions/incubating';
import { createAgentLoop } from '../../../ai/agent.ts';
import {
  createFakeChatModelProvider,
  createInMemoryToolRegistry,
} from '../../../ai/src/testing/mod.ts';
import { createOtelAiTelemetryPort } from '../../ai.ts';

Deno.test('OTel AI adapter exports chat and tool spans with provider usage', async () => {
  const exporter = new InMemorySpanExporter();
  const provider = new BasicTracerProvider({
    spanProcessors: [new SimpleSpanProcessor(exporter)],
  });
  const telemetry = createOtelAiTelemetryPort({ tracer: provider.getTracer('test') });
  const model = createFakeChatModelProvider('demo:model', [
    [
      { type: 'tool-call', toolCall: { id: 'call-1', name: 'weather', arguments: '{}' } },
      {
        type: 'finish',
        finishReason: 'tool-calls',
        usage: { promptTokens: 11, completionTokens: 3, totalTokens: 14 },
      },
    ],
    [
      { type: 'text', delta: 'sunny' },
      {
        type: 'finish',
        finishReason: 'stop',
        usage: { promptTokens: 7, completionTokens: 2, totalTokens: 9 },
      },
    ],
  ]);
  const tools = createInMemoryToolRegistry();
  tools.register(
    { name: 'weather', description: 'Get weather', parameters: { type: 'object' } },
    (call) => ({ toolCallId: call.id, content: 'sunny', state: 'complete' }),
  );

  const loop = createAgentLoop({ modelProvider: model, tools, telemetry });
  for await (
    const _chunk of loop.run({
      model: 'demo:model',
      messages: [{ role: 'user', content: 'weather?' }],
      tools: [{ name: 'weather', description: 'Get weather', parameters: { type: 'object' } }],
    })
  ) {
    // Consuming the scripted stream drives span completion.
  }
  await provider.forceFlush();

  const spans = exporter.getFinishedSpans();
  const run = spans.find((span) => span.name === 'gen_ai.chat');
  const tool = spans.find((span) => span.name === 'execute_tool');
  assert(run);
  assert(tool);
  assertEquals(run.attributes[ATTR_GEN_AI_REQUEST_MODEL], 'model');
  assertEquals(run.attributes[ATTR_GEN_AI_USAGE_INPUT_TOKENS], 18);
  assertEquals(run.attributes[ATTR_GEN_AI_USAGE_OUTPUT_TOKENS], 5);
  assertEquals(tool.attributes[ATTR_GEN_AI_OPERATION_NAME], 'execute_tool');
  assertEquals(tool.attributes[ATTR_GEN_AI_TOOL_NAME], 'weather');

  await provider.shutdown();
});
