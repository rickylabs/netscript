import { basename, resolve } from '@std/path';
import { APP_TOKEN_FILES } from '@netscript/fresh-ui/token-config';
import type { UiLock, UiLockedFile } from '../../../domain/ui/ui-lock.ts';
import type { UiRegistryPathPort } from '../../../ports/ui-registry-port.ts';
import type { UiResolvedItem } from './registry-client.ts';
import { isUiComponentStyle } from './style-sources.ts';
import type { UiWritePlan } from './ui-write-plan.ts';

const managedCore = new Set(['styles.css', ...APP_TOKEN_FILES]);

/** Keep app-level styles and compiler outputs when an item's ownership record is removed. */
export function isUiManagedCoreFile(file: UiLockedFile): boolean {
  return file.managed && managedCore.has(basename(file.target));
}

/** Retire obsolete selections while retaining any style still required by the resulting graph. */
export function uiRetiringComponentStyles(
  previous: UiLock | undefined,
  previousStyle: string,
  nextStyle: string,
  entries: readonly UiResolvedItem[],
): ReadonlySet<string> {
  const recognized = new Set(entries.filter(isUiComponentStyle).map((entry) => entry.ref));
  const retiring = new Set(
    Object.entries(previous?.items ?? {}).filter(([ref, item]) =>
      ref !== nextStyle && item.type === 'registry:style' &&
      (item.componentStyle || recognized.has(ref) || ref === previousStyle)
    ).map(([ref]) => ref),
  );
  const dependencies = new Map(
    Object.entries(previous?.items ?? {}).map(([ref, item]) =>
      [ref, item.registryDependencies] as const
    ),
  );
  for (const entry of entries) dependencies.set(entry.ref, [...(entry.resolvedDependencies ?? [])]);
  const required = [...dependencies].filter(([ref]) => !retiring.has(ref)).flatMap(([, refs]) =>
    refs
  );
  for (let index = 0; index < required.length; index++) {
    const ref = required[index];
    if (retiring.delete(ref)) required.push(...(dependencies.get(ref) ?? []));
  }
  return retiring;
}

/** Remove obsolete style-owned copies through the same preflight plan, preserving shared/core files. */
export async function retireUiStyleFiles(input: {
  readonly root: string;
  readonly previous?: UiLock;
  readonly lock: UiLock;
  readonly retiring: ReadonlySet<string>;
  readonly plan: UiWritePlan;
  readonly paths?: UiRegistryPathPort;
  readonly report: (file: UiLockedFile, current: string) => Promise<void>;
}): Promise<void> {
  const { root, previous, lock, retiring, plan, paths, report } = input;
  for (const ref of retiring) delete lock.items[ref];
  const seen = new Set<string>();
  for (const ref of retiring) {
    for (const file of previous?.items[ref]?.files ?? []) {
      if (seen.has(file.target)) continue;
      seen.add(file.target);
      if (isUiManagedCoreFile(file)) continue;
      if (
        Object.values(lock.items).some((item) =>
          item.files.some((copy) => copy.target === file.target)
        )
      ) continue;
      const path = resolve(root, file.target);
      await paths?.assertContained(root, path);
      if (!await plan.fs.exists(path)) continue;
      await report(file, await plan.fs.readFile(path));
      await plan.fs.remove(path);
    }
  }
}
