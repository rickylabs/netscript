import { dirname, join } from '@std/path';
import { UseCase } from '../../../../kernel/application/abstracts/use-case.ts';
import { planResourceSlice } from '../../../../kernel/application/resource-slice/plan-resource-slice.ts';
import { reconcileAppRoutes } from '../../../../kernel/application/resource-slice/reconcile/reconcile-app-routes.ts';
import { reconcileResourceSlice } from '../../../../kernel/application/resource-slice/reconcile/reconcile-resource-slice.ts';
import { reconcileState } from '../../../../kernel/application/resource-slice/reconcile/reconcile-state.ts';
import { renderResourceSlice } from '../../../../kernel/application/resource-slice/render-resource-slice.ts';
import {
  type NormalizedResourceSliceInput,
  normalizeResourceSliceInput,
  parseOwnedResourceSliceLeaf,
  RESOURCE_SLICE_VARIANTS,
  type ResourceResultPresentation,
  type ResourceSliceCandidateLeaf,
  type ResourceSliceOptionalVariant,
  type ResourceSlicePlannedLeaf,
  type ResourceSliceReportEntry,
  type ResourceSliceSharedCandidate,
  type SelectedResourceClient,
  type SelectedResourceProcedure,
} from '../../../../kernel/application/resource-slice/resource-slice-contract.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { TemplatePort } from '../../../../kernel/ports/template-port.ts';

/** Normalized command intent before app/client/procedure selection. */
export interface GenerateResourceRequest {
  readonly resource: string;
  readonly app?: string;
  readonly client?: string;
  readonly procedure: string;
  readonly projectRoot?: string;
  readonly route?: string;
  readonly variants: readonly ResourceSliceOptionalVariant[];
  readonly dryRun: boolean;
  readonly force: boolean;
}

/** Resolve one Fresh application without importing presentation code. */
export type ResourceAppRootResolver = (input: {
  readonly projectRoot?: string;
  readonly app?: string;
}) => Promise<string | undefined>;

/** Resolve the generated query client selected only by the optional `--client` value. */
export type ResourceClientResolver = (
  appRoot: string,
  client: string | undefined,
) => Promise<SelectedResourceClient>;

/** Resolve and validate one named query procedure on the selected client. */
export type ResourceProcedureResolver = (input: {
  readonly appRoot: string;
  readonly client: SelectedResourceClient;
  readonly procedure: string;
}) => Promise<SelectedResourceProcedure>;

/** Fresh-derived staged sources and the selected route's generated key path. */
export interface ResourceSliceStageResult {
  readonly shared: readonly ResourceSliceSharedCandidate[];
  readonly routeKeyPath: readonly [string, ...string[]];
}

/** Mirror routes, overlay rendered leaves, and derive Fresh output outside the application tree. */
export type ResourceSliceStager = (input: {
  readonly appRoot: string;
  readonly leaves: readonly ResourceSliceCandidateLeaf[];
  readonly route: string;
}) => Promise<ResourceSliceStageResult>;

/** Dependencies for the preflighted resource-slice flow. */
export interface GenerateResourceDependencies {
  readonly fs: FileSystemPort;
  readonly templateRenderer: TemplatePort;
  readonly templates: Parameters<typeof renderResourceSlice>[1];
  readonly resolveAppRoot: ResourceAppRootResolver;
  readonly resolveClient: ResourceClientResolver;
  readonly resolveProcedure: ResourceProcedureResolver;
  readonly stage: ResourceSliceStager;
}

/** Observable command result after complete preflight. */
export interface GenerateResourceResult {
  readonly status: 'applied' | 'dry-run' | 'conflict';
  readonly exitCode: 0 | 1;
  readonly report: readonly ResourceSliceReportEntry[];
  readonly written: readonly string[];
  readonly skipped: readonly string[];
  readonly conflicts: readonly string[];
}

/** Public resource generation use case. */
export class GenerateResourceUseCase
  extends UseCase<GenerateResourceRequest, GenerateResourceResult> {
  readonly id = 'public.generate.resource';

  constructor(private readonly dependencies: GenerateResourceDependencies) {
    super();
  }

  execute(request: GenerateResourceRequest): Promise<GenerateResourceResult> {
    return executeGenerateResource(request, this.dependencies);
  }
}

/** Generate one resource slice only after every target has passed preflight. */
export async function generateResource(
  request: GenerateResourceRequest,
  dependencies: GenerateResourceDependencies,
): Promise<GenerateResourceResult> {
  return await new GenerateResourceUseCase(dependencies).execute(request);
}

async function executeGenerateResource(
  request: GenerateResourceRequest,
  dependencies: GenerateResourceDependencies,
): Promise<GenerateResourceResult> {
  const appRoot = await dependencies.resolveAppRoot({
    projectRoot: request.projectRoot,
    app: request.app,
  });
  if (!appRoot) throw new Error('Could not resolve a Fresh application root.');
  const client = await dependencies.resolveClient(appRoot, request.client);
  const procedure = await dependencies.resolveProcedure({
    appRoot,
    client,
    procedure: request.procedure,
  });
  const selected = normalizeResourceSliceInput({
    resource: request.resource,
    app: request.app ?? appRoot,
    route: request.route,
    variants: request.variants,
    client,
    procedure,
  });
  const prior = await readPriorState(
    appRoot,
    selected,
    planResourceSlice(normalizeResourceSliceInput({
      ...selected,
      variants: RESOURCE_SLICE_VARIANTS.filter((variant) => variant !== 'core'),
    })).leaves,
    dependencies,
  );
  const input = normalizeResourceSliceInput({
    ...selected,
    variants: [...request.variants, ...prior.variants],
    procedure: {
      ...procedure,
      initialInput: procedure.initialInput ?? prior.queryInput,
    },
  });
  const plan = planResourceSlice(input);
  const leaves = await renderResourceSlice(
    plan,
    dependencies.templates,
    dependencies.templateRenderer,
    prior.presentation,
  );
  const fresh = await dependencies.stage({ appRoot, leaves, route: input.route });
  const shared = await transformSharedSources(appRoot, plan, fresh, dependencies.fs);
  const current = await readCurrent(appRoot, [...leaves, ...shared], dependencies.fs);
  const reconciled = await reconcileResourceSlice({
    staging: { ok: true, leaves, shared },
    current,
    dryRun: request.dryRun,
    force: request.force,
  });
  if (reconciled.status === 'preflight-failed') throw new Error(reconciled.message);

  if (reconciled.status !== 'ready') {
    return {
      status: reconciled.status,
      exitCode: reconciled.exitCode,
      report: reconciled.report,
      written: [],
      skipped: reconciled.skipped,
      conflicts: reconciled.conflicts,
    };
  }
  for (const file of reconciled.applyPlan.files) {
    const target = join(appRoot, file.path);
    await dependencies.fs.createDir(dirname(target));
    await dependencies.fs.writeFile(target, file.content);
  }
  return {
    status: 'applied',
    exitCode: 0,
    report: reconciled.report,
    written: reconciled.applyPlan.files.map((file) => file.path),
    skipped: reconciled.skipped,
    conflicts: [],
  };
}

/** Recover settings only when their complete canonical leaf matches the selected query. */
async function readPriorState(
  appRoot: string,
  selected: NormalizedResourceSliceInput,
  leaves: readonly ResourceSlicePlannedLeaf[],
  dependencies: GenerateResourceDependencies,
): Promise<{
  variants: readonly ResourceSliceOptionalVariant[];
  queryInput?: SelectedResourceProcedure['initialInput'];
  presentation?: ResourceResultPresentation;
}> {
  const { fs } = dependencies;
  const variants = new Set<ResourceSliceOptionalVariant>();
  let queryInput: SelectedResourceProcedure['initialInput'];
  let presentation: ResourceResultPresentation | undefined;
  for (const leaf of leaves) {
    const path = join(appRoot, leaf.path);
    if (!await fs.exists(path)) continue;
    const content = await fs.readFile(path);
    const metadata = parseOwnedResourceSliceLeaf(content);
    if (!metadata || metadata.resource !== selected.resource || metadata.role !== leaf.role) {
      continue;
    }
    for (const option of metadata.options) {
      if (option !== 'core') variants.add(option);
    }
    const candidateInput = leaf.role === 'loaders' && selected.procedure.initialInput === undefined
      ? metadata.queryInput
      : undefined;
    const candidatePresentation = leaf.role === 'island' && metadata.amountUnit !== undefined
      ? { amountUnit: metadata.amountUnit }
      : undefined;
    if (candidateInput === undefined && candidatePresentation === undefined) continue;
    const proofPlan = planResourceSlice(normalizeResourceSliceInput({
      ...selected,
      variants: metadata.options.filter((option) => option !== 'core'),
      procedure: {
        ...selected.procedure,
        initialInput: candidateInput ?? selected.procedure.initialInput,
      },
    }));
    const proof = await renderResourceSlice(
      {
        ...proofPlan,
        leaves: proofPlan.leaves.filter((candidate) => candidate.role === leaf.role),
      },
      dependencies.templates,
      dependencies.templateRenderer,
      candidatePresentation,
    );
    if (proof.some((candidate) => candidate.path === leaf.path && candidate.content === content)) {
      if (candidateInput !== undefined) queryInput = candidateInput;
      if (candidatePresentation !== undefined) presentation = candidatePresentation;
    }
  }
  return { variants: [...variants].sort(), queryInput, presentation };
}

async function transformSharedSources(
  appRoot: string,
  plan: ReturnType<typeof planResourceSlice>,
  fresh: ResourceSliceStageResult,
  fs: FileSystemPort,
): Promise<readonly ResourceSliceSharedCandidate[]> {
  const routerPath = join(appRoot, plan.appRoutes.path);
  const router = reconcileAppRoutes(await fs.readFile(routerPath), {
    alias: plan.appRoutes.alias,
    routeKeyPath: fresh.routeKeyPath,
  });
  if (router.status === 'conflict') throw new Error(router.reason);
  const shared: ResourceSliceSharedCandidate[] = [
    ...fresh.shared,
    { path: plan.appRoutes.path, content: router.content, role: 'app-routes' },
  ];
  if (plan.state) {
    const statePath = join(appRoot, plan.state.path);
    const state = reconcileState(await fs.readFile(statePath), {
      resource: plan.input.resource,
      ...plan.state.requirement,
    });
    if (state.status === 'conflict') throw new Error(state.reason);
    shared.push({ path: plan.state.path, content: state.content, role: 'state' });
  }
  return shared;
}

async function readCurrent(
  appRoot: string,
  candidates: readonly Readonly<{ path: string }>[],
  fs: FileSystemPort,
): Promise<Readonly<Record<string, string | undefined>>> {
  const entries = await Promise.all(candidates.map(async ({ path }) => {
    const target = join(appRoot, path);
    return [path, await fs.exists(target) ? await fs.readFile(target) : undefined] as const;
  }));
  return Object.fromEntries(entries);
}
