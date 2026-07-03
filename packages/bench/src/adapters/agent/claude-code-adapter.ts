/**
 * Claude Code driver: the live {@link AgentDriver} that runs headless Claude
 * Code (`claude -p ... --output-format stream-json`) in the sandbox and maps its
 * NDJSON event stream onto {@link AgentTurn}s.
 *
 * The adapter is model-agnostic — the model id is passed through from the run
 * manifest — and it is written to spec but deliberately NOT invoked by any
 * Slice 1a unit test (no paid agent run). Slice 1b wires it into the live
 * `bench:self` path behind an API-key gate. A turn boundary is one `assistant`
 * event; its `usage` is read verbatim from the event so cost accounting matches
 * Anthropic billing exactly.
 *
 * @module
 */

import { TextLineStream } from '@std/streams/text-line-stream';
import type { AgentRunRequest, AgentTurn, StopReason, TokenUsage } from '../../domain/agent.ts';
import { ZERO_USAGE } from '../../domain/agent.ts';
import type { AgentDriver } from '../../ports/agent-driver.ts';

/** Options controlling the headless Claude Code invocation. */
export interface ClaudeCodeOptions {
  /** Binary name/path. Defaults to `claude`. */
  readonly bin?: string;
  /** Extra CLI flags appended verbatim (e.g. permission mode, allowed tools). */
  readonly extraArgs?: readonly string[];
}

/** Shape of a Claude Code `assistant` stream event (subset we consume). */
interface AssistantEvent {
  readonly type: 'assistant';
  readonly message?: {
    readonly stop_reason?: string | null;
    readonly usage?: {
      readonly input_tokens?: number;
      readonly output_tokens?: number;
      readonly cache_creation_input_tokens?: number;
      readonly cache_read_input_tokens?: number;
    };
    readonly content?: readonly { readonly type: string; readonly text?: string }[];
  };
}

function mapStopReason(raw: string | null | undefined): StopReason {
  switch (raw) {
    case 'end_turn':
      return 'end_turn';
    case 'tool_use':
      return 'tool_use';
    case 'max_tokens':
      return 'max_tokens';
    case 'refusal':
      return 'refusal';
    default:
      return raw ? 'unknown' : 'tool_use';
  }
}

function usageFromEvent(event: AssistantEvent): TokenUsage {
  const usage = event.message?.usage;
  if (usage === undefined) return ZERO_USAGE;
  return {
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
    cacheReadTokens: usage.cache_read_input_tokens ?? 0,
  };
}

function textFromEvent(event: AssistantEvent): string | undefined {
  const blocks = event.message?.content ?? [];
  const text = blocks
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('');
  return text.length > 0 ? text : undefined;
}

/** {@link AgentDriver} backed by headless Claude Code. */
export class ClaudeCodeDriver implements AgentDriver {
  readonly #bin: string;
  readonly #extraArgs: readonly string[];

  constructor(options: ClaudeCodeOptions = {}) {
    this.#bin = options.bin ?? 'claude';
    this.#extraArgs = options.extraArgs ?? [];
  }

  #buildArgs(request: AgentRunRequest): string[] {
    return [
      '-p',
      request.prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--model',
      request.model,
      '--max-turns',
      String(request.maxTurns),
      ...this.#extraArgs,
    ];
  }

  async *run(request: AgentRunRequest): AsyncIterable<AgentTurn> {
    const command = new Deno.Command(this.#bin, {
      args: this.#buildArgs(request),
      cwd: request.workdir,
      stdout: 'piped',
      stderr: 'piped',
    });
    const child = command.spawn();

    const lines = child.stdout
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());

    let index = 0;
    try {
      for await (const line of lines) {
        if (line.trim().length === 0) continue;
        let event: { type?: string };
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }
        if (event.type !== 'assistant') continue;
        const assistant = event as AssistantEvent;
        yield {
          index,
          usage: usageFromEvent(assistant),
          stopReason: mapStopReason(assistant.message?.stop_reason),
          text: textFromEvent(assistant),
        } satisfies AgentTurn;
        index += 1;
      }
    } finally {
      try {
        child.kill('SIGTERM');
      } catch {
        // Already exited.
      }
      await child.status.catch(() => undefined);
    }
  }
}
