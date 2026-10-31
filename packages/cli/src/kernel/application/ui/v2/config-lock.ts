import { resolve } from '@std/path';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';
import {
  parseUiRegistryJson,
  UI_CONFIG_FILE,
  UI_LOCK_FILE,
  type UiConfig,
  UiConfigSchema,
} from '../../../domain/ui/ui-config.ts';
import { uiContentHash, type UiLock, UiLockSchema } from '../../../domain/ui/ui-lock.ts';

/** Read app settings without persisting defaults during a read-only query. */
export async function readUiConfig(root: string, fs: FileSystemPort): Promise<UiConfig> {
  const path = resolve(root, UI_CONFIG_FILE);
  return UiConfigSchema.parse(
    await fs.exists(path) ? parseUiRegistryJson(await fs.readFile(path)) : {},
  );
}

/** Missing history differs from an existing empty lock, which intentionally owns no items. */
export async function readUiLock(root: string, fs: FileSystemPort): Promise<UiLock | undefined> {
  const path = resolve(root, UI_LOCK_FILE);
  if (!await fs.exists(path)) return undefined;
  const lock = UiLockSchema.parse(parseUiRegistryJson(await fs.readFile(path)));
  for (const item of Object.values(lock.items)) {
    for (const file of item.files) {
      if (await uiContentHash(file.content) !== file.hash) {
        throw new Error('Registry lock baseline hash mismatch');
      }
    }
  }
  return lock;
}

/** Serialize validated metadata without resolving registry header templates. */
export async function writeUiMetadata(
  root: string,
  config: UiConfig,
  lock: UiLock,
  fs: FileSystemPort,
): Promise<void> {
  await fs.writeFile(
    resolve(root, UI_CONFIG_FILE),
    JSON.stringify(UiConfigSchema.parse(config), null, 2) + '\n',
  );
  await fs.writeFile(
    resolve(root, UI_LOCK_FILE),
    JSON.stringify(UiLockSchema.parse(lock), null, 2) + '\n',
  );
}
