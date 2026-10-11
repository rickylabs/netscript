import { resolve } from '@std/path';
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
): Promise<RemoveUiPageResult> {
  const segment = input.path.replace(/^\/+|\/+$/g, '');
  if (
    !segment || segment.split('/').some((part) => !/^[\w][\w-]*$/.test(part))
  ) {
    throw new Error(`Invalid page path: ${input.path}`);
  }
  const page = resolve(input.projectRoot, 'routes', segment, 'index.tsx');
  if (!await fs.exists(page)) {
    // A missing page alone does not establish ownership of orphaned files.
    const routerSource = await fs.readFile(
      resolve(input.projectRoot, 'router.ts'),
    );
    if (routerSource.includes(`createRouteReference('/${segment}'`)) {
      throw new Error(
        'Refusing removal: page is missing but its registration remains.',
      );
    }
    if (!input.dryRun) await writeManifest(input.projectRoot);
    return { files: [], routerChanged: false };
  }
  const source = await fs.readFile(page);
  const route = source.match(/\.withRoute\(appRoutes\['([\w.-]+)'\]\)/)?.[1];
  if (!route) throw new Error('Refusing removal: page binding has diverged.');
  const island = source.includes("from './(_islands)/");
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
  for (const file of files) {
    if (
      !await fs.exists(file.path) || !(await fs.stat(file.path)).isFile ||
      await fs.readFile(file.path) !== file.content
    ) {
      throw new Error(
        `Refusing removal: scaffold file is missing or has diverged: ${file.path}`,
      );
    }
  }
  const router = resolve(input.projectRoot, 'router.ts');
  const reconciled = removeScaffoldedAppRoute(
    await fs.readFile(router),
    segment,
    route,
  );
  const result = { files: files.map((file) => file.path), routerChanged: true };
  if (input.dryRun) return result;
  for (const file of files) await fs.remove(file.path);
  await fs.writeFile(router, reconciled);
  // Never recursively delete a route directory: authored siblings remain intact.
  const dir = resolve(input.projectRoot, 'routes', segment);
  for (const group of ['(_shared)', '(_islands)']) {
    const path = resolve(dir, group);
    if (await fs.exists(path) && !(await fs.readDir(path)).length) {
      await fs.remove(path);
    }
  }
  if (!(await fs.readDir(dir)).length) await fs.remove(dir);
  await writeManifest(input.projectRoot);
  return result;
}
