import { GATE, GATE_PHASE } from '../../../domain/cli-surface.ts';
import type { GateDefinition } from '../../../domain/gate-definition.ts';
import { commandGate } from './gate-factory.ts';

export function createOtelGates(): readonly GateDefinition[] {
  return [
    commandGate(
      GATE.BEHAVIOR_OTEL_WEBHOOK,
      'Fire webhook for OTEL trace capture',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-run=aspire',
        '--allow-net=localhost,127.0.0.1',
        new URL('./runtime/probe-plugin-resource.ts', import.meta.url).pathname,
        context.project.appHost,
        'triggers-api',
        'trigger-webhook',
      ],
    ),
    commandGate(
      GATE.BEHAVIOR_STREAMS_PRODUCER_RECONNECT,
      'Recover buffered stream producer writes with correlated OTEL',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-all',
        '--unsafely-ignore-certificate-errors=localhost',
        new URL('./verify-producer-reconnect.ts', import.meta.url).pathname,
        context.project.projectRoot,
        context.project.appHost,
        context.project.repoRoot,
      ],
      undefined,
      'capture',
      'The isolated streams resource did not expose a bounded reconnect, FIFO receipts, or one correlated MCP trace with retry/recovery metrics.',
      undefined,
      180_000,
      'assertion',
    ),
    commandGate(
      GATE.BEHAVIOR_OTEL_STREAM_CONSUMER,
      'Consume real Flow-B stream with fan-in links',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-all',
        '--unsafely-ignore-certificate-errors=localhost',
        'packages/cli/e2e/src/application/gates/scaffold/consume-flow-b-stream.ts',
        context.project.projectRoot,
        context.project.appHost,
      ],
    ),
    commandGate(
      GATE.BEHAVIOR_OTEL_TRACES,
      'Validate OTEL trace chain via Aspire MCP',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-all',
        '--unsafely-ignore-certificate-errors=localhost',
        'packages/cli/e2e/src/application/gates/scaffold/validate-flow-b-traces.ts',
        context.project.appHost,
        context.project.projectRoot,
      ],
      undefined,
      'capture',
      'No OTEL traces found. Ensure the AppHost was started with --isolated and Aspire MCP can reach its authenticated dashboard.',
    ),
    commandGate(
      GATE.BEHAVIOR_OTEL_TASK_TRACES,
      'Validate generated detached Aspire telemetry task',
      GATE_PHASE.BEHAVIOR,
      (context) => [
        'deno',
        'run',
        '--allow-run',
        '--allow-read',
        '--allow-net=localhost,127.0.0.1',
        new URL('./validate-aspire-task-traces.ts', import.meta.url).pathname,
        context.project.projectRoot,
        'workers',
      ],
    ),
  ];
}
