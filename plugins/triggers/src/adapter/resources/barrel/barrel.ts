/** Triggers background workspace barrel scaffolder.
 *
 * @module
 */

import {
  type ItemScaffolder,
  type ScaffoldArtifact,
  substituteTokens,
  textArtifact,
} from '@netscript/plugin/adapter';
import { exportStem } from '../input.ts';
import { DEFAULT_FILE_WATCH_INPUT } from '../file-watch/file-watch.ts';
import { DEFAULT_SCHEDULED_INPUT } from '../scheduled/scheduled.ts';
import { DEFAULT_WEBHOOK_INPUT } from '../webhook/webhook.ts';
import { barrelStub } from './barrel.stub.ts';

/** Input accepted by the triggers barrel scaffolder. */
export interface BarrelInput {
  /** Webhook trigger id exported by the generated barrel. */
  readonly webhookId: string;
  /** Webhook trigger file stem exported by the generated barrel. */
  readonly webhookFile: string;
  /** Scheduled trigger id exported by the generated barrel. */
  readonly scheduledId: string;
  /** Scheduled trigger file stem exported by the generated barrel. */
  readonly scheduledFile: string;
  /** File-watch trigger id exported by the generated barrel. */
  readonly fileWatchId: string;
  /** File-watch trigger file stem exported by the generated barrel. */
  readonly fileWatchFile: string;
}

/** Canonical barrel input emitted during triggers install. */
export const DEFAULT_BARREL_INPUT: BarrelInput = {
  webhookId: DEFAULT_WEBHOOK_INPUT.id,
  webhookFile: DEFAULT_WEBHOOK_INPUT.fileName ?? 'generic-inbound-webhook',
  scheduledId: DEFAULT_SCHEDULED_INPUT.id,
  scheduledFile: DEFAULT_SCHEDULED_INPUT.fileName ?? 'daily-maintenance',
  fileWatchId: DEFAULT_FILE_WATCH_INPUT.id,
  fileWatchFile: DEFAULT_FILE_WATCH_INPUT.fileName ?? 'incoming-file-watch',
};

/** Triggers barrel item scaffolder emitted during install. */
export const barrelScaffolder: ItemScaffolder<BarrelInput> = {
  name: 'barrel',
  emit(input: BarrelInput): readonly ScaffoldArtifact[] {
    return [
      textArtifact(
        'triggers/mod.ts',
        substituteTokens(barrelStub, {
          FILE_WATCH_EXPORT: `${exportStem(input.fileWatchId)}Trigger`,
          FILE_WATCH_FILE: input.fileWatchFile,
          SCHEDULED_EXPORT: `${exportStem(input.scheduledId)}Trigger`,
          SCHEDULED_FILE: input.scheduledFile,
          WEBHOOK_EXPORT: `${exportStem(input.webhookId)}Trigger`,
          WEBHOOK_FILE: input.webhookFile,
        }),
      ),
    ];
  },
};
