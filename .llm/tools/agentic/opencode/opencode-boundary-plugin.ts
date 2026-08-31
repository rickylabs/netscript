/** OpenCode provider-boundary history guard and privacy-safe discovery receipts. */

import { appendFile } from 'node:fs/promises';
import process from 'node:process';

export type DiscoverySource = 'mcp' | 'public_web' | 'local_docs' | 'generated_source';

export interface OpenCodeStoredPart {
  readonly type?: unknown;
  readonly text?: unknown;
  readonly metadata?: unknown;
  readonly [key: string]: unknown;
}

export interface OpenCodeStoredMessage {
  readonly info: {
    readonly id?: unknown;
    readonly role?: unknown;
    readonly [key: string]: unknown;
  };
  readonly parts: OpenCodeStoredPart[];
}

export interface OpenCodeHistoryReceipt {
  readonly kind: 'history_normalization';
  readonly eventId: string;
  readonly reason: 'empty_fragment' | 'empty_assistant';
  readonly removedFragments: number;
  readonly removedEvents: number;
}

export interface OpenCodeDiscoveryReceipt {
  readonly kind: 'discovery';
  readonly eventId: string;
  readonly toolId: string;
  readonly source: DiscoverySource;
  readonly callCount: 1;
}

export interface OpenCodeHistoryValidationReceipt {
  readonly kind: 'history_validation';
  readonly eventId: string;
  readonly reason: 'provider_valid' | 'normalized';
  readonly assistantEventCount: number;
  readonly removedFragments: number;
  readonly removedEvents: number;
}

const SAFE_EVENT_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,95}$/;

class OpenCodeHistoryNormalizationError extends Error {
  constructor(readonly eventId: string, readonly reason: 'signed_reasoning_boundary') {
    super(`OpenCode history normalization unsafe: ${reason}; event=${eventId}`);
    this.name = 'OpenCodeHistoryNormalizationError';
  }
}

function safeLocalEventId(value: unknown): string {
  return typeof value === 'string' && SAFE_EVENT_ID.test(value) ? value : 'unknown';
}

function metadataRecord(part: OpenCodeStoredPart): Record<string, unknown> | undefined {
  if (!part.metadata || typeof part.metadata !== 'object' || Array.isArray(part.metadata)) {
    return undefined;
  }
  return part.metadata as Record<string, unknown>;
}

function hasSignedReasoning(parts: readonly OpenCodeStoredPart[]): boolean {
  return parts.some((part) => {
    if (part.type !== 'reasoning') return false;
    const metadata = metadataRecord(part);
    const anthropic = metadata?.anthropic;
    return !!anthropic && typeof anthropic === 'object' &&
      (anthropic as Record<string, unknown>).signature != null;
  });
}

function isEmptyFragment(part: OpenCodeStoredPart): boolean {
  return (part.type === 'text' || part.type === 'reasoning') &&
    typeof part.text === 'string' && part.text.trim().length === 0;
}

function isSemanticPart(part: OpenCodeStoredPart): boolean {
  if (part.type === 'step-start' || part.type === 'step-finish') return false;
  if (part.type === 'text' || part.type === 'reasoning') {
    return typeof part.text === 'string' && part.text.trim().length > 0;
  }
  return true;
}

/**
 * Mutates only the dispatch copy supplied by OpenCode. Tool parts and their
 * order/object identity are never changed; stored session history is untouched.
 */
function normalizeOpenCodeHistory(
  messages: OpenCodeStoredMessage[],
): OpenCodeHistoryReceipt[] {
  const receipts: OpenCodeHistoryReceipt[] = [];
  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message.info.role !== 'assistant') continue;
    const eventId = safeLocalEventId(message.info.id);
    const eventReceipts: OpenCodeHistoryReceipt[] = [];
    const emptyCount = message.parts.filter(isEmptyFragment).length;
    if (emptyCount > 0 && hasSignedReasoning(message.parts)) {
      throw new OpenCodeHistoryNormalizationError(eventId, 'signed_reasoning_boundary');
    }
    if (emptyCount > 0) {
      message.parts.splice(
        0,
        message.parts.length,
        ...message.parts.filter((part) => !isEmptyFragment(part)),
      );
      eventReceipts.push({
        kind: 'history_normalization',
        eventId,
        reason: 'empty_fragment',
        removedFragments: emptyCount,
        removedEvents: 0,
      });
    }
    if (!message.parts.some(isSemanticPart)) {
      messages.splice(index, 1);
      eventReceipts.push({
        kind: 'history_normalization',
        eventId,
        reason: 'empty_assistant',
        removedFragments: 0,
        removedEvents: 1,
      });
    }
    receipts.unshift(...eventReceipts);
  }
  return receipts;
}

function allStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) { for (const item of value) allStrings(item, output); }
  else if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) allStrings(item, output);
  }
  return output;
}

/** Classifies from ephemeral values but returns no prompt, args, output, secret, config, or path. */
function classifyDiscoverySource(tool: string, args: unknown): DiscoverySource | undefined {
  const normalizedTool = tool.toLowerCase();
  if (normalizedTool.startsWith('netscript_') || normalizedTool.startsWith('aspire_')) return 'mcp';
  if (['webfetch', 'websearch', 'web_fetch', 'web_search'].includes(normalizedTool)) {
    return 'public_web';
  }
  if (!['read', 'grep', 'glob', 'list', 'bash'].includes(normalizedTool)) return undefined;
  const values = allStrings(args).map((value) => value.replaceAll('\\', '/').toLowerCase());
  if (values.some((value) => value.includes('/.netscript/docs/'))) return 'local_docs';
  if (values.some((value) => /\.(?:ts|tsx|js|jsx|mts|cts|cs|json|jsonc)$/.test(value))) {
    return 'generated_source';
  }
  return undefined;
}

function historyValidationReceipt(
  messages: readonly OpenCodeStoredMessage[],
  transformations: readonly OpenCodeHistoryReceipt[],
): OpenCodeHistoryValidationReceipt {
  const lastAssistant = messages.findLast((message) => message.info.role === 'assistant');
  const lastTransformation = transformations.at(-1);
  return {
    kind: 'history_validation',
    eventId: lastTransformation?.eventId ?? safeLocalEventId(lastAssistant?.info.id),
    reason: transformations.length > 0 ? 'normalized' : 'provider_valid',
    assistantEventCount: messages.filter((message) => message.info.role === 'assistant').length,
    removedFragments: transformations.reduce((sum, item) => sum + item.removedFragments, 0),
    removedEvents: transformations.reduce((sum, item) => sum + item.removedEvents, 0),
  };
}

async function appendReceipt(
  receipt: OpenCodeHistoryReceipt | OpenCodeDiscoveryReceipt | OpenCodeHistoryValidationReceipt,
) {
  const path = process.env.NETSCRIPT_OPENCODE_RECEIPT?.trim();
  if (!path) return;
  await appendFile(path, `${JSON.stringify(receipt)}\n`, { encoding: 'utf8' });
}

export interface OpenCodeBoundaryHooks {
  readonly 'experimental.chat.messages.transform': (
    input: Record<string, never>,
    output: { messages: OpenCodeStoredMessage[] },
  ) => Promise<void>;
  readonly 'tool.execute.before': (
    input: { tool: string; sessionID: string; callID: string },
    output: { args: unknown },
  ) => Promise<void>;
  readonly 'tool.execute.after': (
    input: { tool: string; sessionID: string; callID: string; args: unknown },
    output: { title: string; output: string; metadata: unknown },
  ) => Promise<void>;
}

export interface OpenCodeBoundaryTesting {
  readonly classifyDiscoverySource: (
    tool: string,
    args: unknown,
  ) => DiscoverySource | undefined;
  readonly normalizeOpenCodeHistory: (
    messages: OpenCodeStoredMessage[],
  ) => OpenCodeHistoryReceipt[];
  readonly OpenCodeHistoryNormalizationError: new (
    eventId: string,
    reason: 'signed_reasoning_boundary',
  ) => Error;
  readonly safeLocalEventId: (value: unknown) => string;
  readonly historyValidationReceipt: (
    messages: readonly OpenCodeStoredMessage[],
    transformations: readonly OpenCodeHistoryReceipt[],
  ) => OpenCodeHistoryValidationReceipt;
}

/** Pinned OpenCode plugin contract. */
function openCodeBoundaryPlugin(): Promise<OpenCodeBoundaryHooks> {
  return Promise.resolve({
    'experimental.chat.messages.transform': async (
      _input: Record<string, never>,
      output: { messages: OpenCodeStoredMessage[] },
    ) => {
      const transformations = normalizeOpenCodeHistory(output.messages);
      for (const receipt of transformations) await appendReceipt(receipt);
      await appendReceipt(historyValidationReceipt(output.messages, transformations));
    },
    'tool.execute.before': (
      _input: { tool: string; sessionID: string; callID: string },
      _output: { args: unknown },
    ) => Promise.resolve(),
    'tool.execute.after': async (
      input: { tool: string; sessionID: string; callID: string; args: unknown },
      _output: { title: string; output: string; metadata: unknown },
    ) => {
      const source = classifyDiscoverySource(input.tool, input.args);
      if (!source) return;
      await appendReceipt({
        kind: 'discovery',
        eventId: safeLocalEventId(input.callID),
        toolId: safeLocalEventId(input.tool),
        source,
        callCount: 1,
      });
    },
  });
}

const openCodeBoundaryPluginWithTesting: typeof openCodeBoundaryPlugin & {
  readonly testing: OpenCodeBoundaryTesting;
} = Object.assign(openCodeBoundaryPlugin, {
  testing: {
    classifyDiscoverySource: classifyDiscoverySource,
    normalizeOpenCodeHistory: normalizeOpenCodeHistory,
    OpenCodeHistoryNormalizationError: OpenCodeHistoryNormalizationError,
    safeLocalEventId: safeLocalEventId,
    historyValidationReceipt: historyValidationReceipt,
  } satisfies OpenCodeBoundaryTesting,
});

export default openCodeBoundaryPluginWithTesting;
