import { dirname, resolve } from '@std/path';
import { cleanUiPagePath } from './page-path.ts';
import type { GeneratedSourceFormatterPort } from '../../ports/generated-source-formatter-port.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { removeScaffoldedAppRoute } from '../resource-slice/reconcile/reconcile-app-routes.ts';
import { scaffoldUiPage } from './web-scaffold.ts';

/** Safe removal options for an unchanged `ui:add page` scaffold. */
export interface RemoveUiPageInput {
  /** Selected Fresh application root. */
  readonly projectRoot: string;
  /** Page path relative to routes, as passed to `ui:add page`. */
  readonly path: string;
  /** Client selector for data-bound pages when selection is ambiguous. */
  readonly client?: string;
  /** Validate and report without modifying files or derived modules. */
  readonly dryRun?: boolean;
}

/** Validated removal plan, excluding unrelated authored files. */
export interface RemoveUiPageResult {
  /** Distinguish a removed page from an absent page or idempotent rerun. */
  readonly status: 'removed' | 'absent';
  /** Existing unchanged scaffold files to remove. */
  readonly files: readonly string[];
  /** Whether the page registration needs reconciliation. */
  readonly routerChanged: boolean;
}

/** Validate all scaffold files before deleting, then reconstruct derived routes. */
export async function removeUiPage(
  input: RemoveUiPageInput,
  fs: FileSystemPort,
  writeManifest: (appRoot: string) => Promise<unknown>,
  formatter: Pick<GeneratedSourceFormatterPort, 'formatContents'>,
): Promise<RemoveUiPageResult> {
  const segment = cleanUiPagePath(input.path);
  const router = resolve(input.projectRoot, 'router.ts');
  if (!await fs.exists(router)) {
    throw new Error('Cannot remove page: router.ts is missing from the selected app.');
  }
  const page = resolve(input.projectRoot, 'routes', segment, 'index.tsx');
  if (!await fs.exists(page)) {
    // A missing page alone does not establish ownership of orphaned files.
    const routerSource = await fs.readFile(
      resolve(input.projectRoot, 'router.ts'),
    );
    if (new RegExp(`createRouteReference\\(\\s*(['"])/${segment}\\1\\s*[,)]`).test(routerSource)) {
      throw new Error(
        'Refusing removal: page is missing but its registration remains.',
      );
    }
    if (!input.dryRun) await writeManifest(input.projectRoot);
    return { status: 'absent', files: [], routerChanged: false };
  }
  const source = await fs.readFile(page);
  const route = source.match(/\.withRoute\(\s*appRoutes\[\s*['"]([\w.-]+)['"]\s*\]\s*,?\s*\)/)?.[1];
  if (!route) throw new Error('Refusing removal: page binding has diverged.');
  const island = /from\s+['"]\.\/\(_islands\)\//.test(source);
  const plan = await scaffoldUiPage({
    projectRoot: input.projectRoot,
    path: segment,
    route,
    island,
    client: input.client,
    force: true,
    dryRun: true,
  }, fs);
  const files = plan.files.filter((file) => file.role !== 'route-registration');
  const comparisons = [];
  for (const file of files) {
    if (!await fs.exists(file.path) || !(await fs.stat(file.path)).isFile) {
      throw new Error(`Refusing removal: scaffold file is missing or has diverged: ${file.path}`);
    }
    const current = await fs.readFile(file.path);
    if (current !== file.content) {
      comparisons.push({ file, current });
    }
  }
  // Normalize only mismatches, in one bounded batch; never format app files on disk.
  const normalized = await formatter.formatContents(comparisons.flatMap(({ file, current }) => [
    { targetPath: file.path, content: file.content },
    { targetPath: file.path, content: current },
  ]));
  for (let index = 0; index < comparisons.length; index++) {
    if (normalized[index * 2] !== normalized[index * 2 + 1]) {
      throw new Error(
        `Refusing removal: scaffold file is missing or has diverged: ${
          comparisons[index].file.path
        }`,
      );
    }
  }
  const routerSource = await fs.readFile(router);
  const reconciled = removeScaffoldedAppRoute(
    routerSource,
    segment,
    route,
  );
  const result: RemoveUiPageResult = {
    status: 'removed',
    files: files.map((file) => file.path),
    routerChanged: reconciled !== routerSource,
  };
  if (input.dryRun) return result;
  if (result.routerChanged) await fs.writeFile(router, reconciled);
  for (const file of files) await fs.remove(file.path);
  // Never recursively delete a route directory: authored siblings remain intact.
  const dir = resolve(input.projectRoot, 'routes', segment);
  for (const group of ['(_shared)', '(_islands)']) {
    const path = resolve(dir, group);
    if (await fs.exists(path) && !(await fs.readDir(path)).length) {
      await fs.remove(path);
    }
  }
  const routesRoot = resolve(input.projectRoot, 'routes');
  let empty = dir;
  while (empty !== routesRoot && await fs.exists(empty) && !(await fs.readDir(empty)).length) {
    await fs.remove(empty);
    empty = dirname(empty);
  }
  await writeManifest(input.projectRoot);
  return result;
}
