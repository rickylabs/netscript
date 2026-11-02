import { z } from 'zod';
import { assertReadyCapabilities } from './probe-app-home.ts';

/** Canonical walkthrough consumed by the runtime gate, rather than a second command recipe. */
export const DOCUMENTED_SCAFFOLD_DOC = 'docs/site/orchestration-runtime/how-to/add-a-plugin.md';
/** Faults run in independent workspaces before the restored documented path. */
export const DOCUMENTED_SCAFFOLD_VARIANTS = ['skip-seed-handoff', 'drop-link', 'restored'] as const;
/** One deliberately broken or restored documented setup. */
export type DocumentedScaffoldVariant = typeof DOCUMENTED_SCAFFOLD_VARIANTS[number];

/** Missing actual seed-correlated work is the seed negative control's only accepted failure. */
export class SeedHandoffAcceptanceError extends Error {}
/** The rendered unlinked state is the link negative control's only accepted failure. */
export class StreamLinkAcceptanceError extends Error {}

/** Read the executable, argument-only shell block; unsupported shell syntax fails closed. */
export function documentedScaffoldCommands(markdown: string): readonly (readonly string[])[] {
  const block = markdown.match(
    /<!-- documented-scaffold:start -->\s*```sh\n([\s\S]*?)```\s*<!-- documented-scaffold:end -->/,
  );
  if (!block) throw new Error('The documented scaffold command block is missing');
  return block[1].trim().split('\n').map((line) => {
    if (!/^[\w./ -]+$/.test(line)) throw new Error(`Unsupported documented shell syntax: ${line}`);
    const words = line.trim().split(/\s+/);
    if (!['netscript', 'aspire', 'cd'].includes(words[0])) {
      throw new Error(`Unsupported documented command: ${words[0]}`);
    }
    return words;
  });
}

const executionList = z.object({
  executions: z.array(z.object({
    id: z.string(),
    jobId: z.string(),
    status: z.string(),
    correlationId: z.string().optional(),
    progressPercent: z.number().nullable(),
    completedAt: z.string().nullable(),
    result: z.record(z.string(), z.unknown()).nullable(),
  })),
});

/** Require one completed real sample with its seed identity, work result and progress. */
export function assertDocumentedSeedExecution(value: unknown, seedId: string): string {
  const { executions } = executionList.parse(value);
  const matches = executions.filter((execution) =>
    execution.jobId === 'health-check' && execution.correlationId === `scaffold-seed:${seedId}`
  );
  if (matches.length !== 1 || matches[0].status !== 'completed') {
    throw new SeedHandoffAcceptanceError(
      'The post-seed health-check execution did not complete exactly once',
    );
  }
  const execution = matches[0];
  if (
    execution.progressPercent !== 100 || !execution.completedAt ||
    typeof execution.result?.workspaceEntries !== 'number' || execution.result.workspaceEntries < 1
  ) {
    throw new Error('The seed job did not report real work, full progress and completion time');
  }
  return execution.id;
}

/** Require the actual stream projection, excluding the record-change fallback. */
export function assertLinkedActivityHtml(html: string): void {
  const section = activitySection(html);
  if (section.includes('data-capability-state="installed-unwired"')) {
    throw new StreamLinkAcceptanceError(
      'The Activity feed reports its record service is not linked',
    );
  }
  assertReadyCapabilities(section, ['streams']);
  if (!section.includes('Latest events from the record activity stream.')) {
    throw new Error('Activity did not render the linked record stream projection');
  }
}

/** Record-table text cannot stand in for an event rendered inside Activity. */
function activitySection(html: string): string {
  const section = html.match(/<section\b[^>]*data-capability="streams"[^>]*>[\s\S]*?<\/section>/)
    ?.[0];
  if (!section) throw new Error('The rendered Activity section is missing');
  return section;
}

const activityEvents = z.array(z.object({
  type: z.literal('record-activity'),
  headers: z.object({ operation: z.literal('upsert') }),
  value: z.object({
    id: z.string(),
    verb: z.enum(['created', 'updated']),
    recordId: z.string(),
    reference: z.string(),
    actor: z.object({ name: z.string(), kind: z.enum(['authenticated', 'anonymous']) }),
    timestamp: z.iso.datetime(),
  }),
}));

/** Prove the committed API mutation reached the real stream and the rendered Activity list. */
export function assertDocumentedActivity(
  value: unknown,
  recordId: string | number,
  html: string,
): string {
  assertLinkedActivityHtml(html);
  const section = activitySection(html);
  const event = activityEvents.parse(value).find(({ value }) =>
    value.verb === 'updated' && value.recordId === String(recordId)
  );
  if (
    !event || !section.includes(event.value.reference) ||
    !section.includes(event.value.actor.name) ||
    !section.includes(event.value.timestamp)
  ) {
    throw new Error(
      'The committed record update is missing from the linked stream-backed Activity',
    );
  }
  return event.value.id;
}
