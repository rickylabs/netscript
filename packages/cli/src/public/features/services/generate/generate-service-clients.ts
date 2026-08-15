import { toCamelCase } from '@std/text';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';

/** Request for reconciling manifest-owned service client modules. */
export interface GenerateServiceClientsRequest {
  /** Absolute project root. */
  readonly projectRoot: string;
  /** Report the complete plan without writing files. */
  readonly dryRun: boolean;
  /** Rewrite identical generated files. */
  readonly force: boolean;
}

/** One planned service-client output and whether it needs a write. */
export interface PlannedServiceClientFile {
  /** Manifest service name. */
  readonly serviceName: string;
  /** Generator-owned output path. */
  readonly path: string;
  /** Rendered TypeScript module. */
  readonly content: string;
  /** Whether current content requires reconciliation. */
  readonly willWrite: boolean;
}

/** Deterministic result from service-client generation. */
export interface GenerateServiceClientsResult {
  /** Fully validated output plan in manifest order. */
  readonly planned: readonly PlannedServiceClientFile[];
  /** Paths actually written; empty for a dry run. */
  readonly written: readonly string[];
  /** Paths already current and therefore skipped. */
  readonly skipped: readonly string[];
  /** Whether this invocation intentionally withheld writes. */
  readonly dryRun: boolean;
}

/** Dependencies for manifest-owned service-client generation. */
export interface GenerateServiceClientsDependencies {
  /** Resolve the project scope used by generated contract imports. */
  readonly readProjectName: (projectRoot: string) => Promise<string>;
  /** Sorted manifest service discovery. */
  readonly serviceResolver: {
    /** Return manifest services in deterministic order. */
    discoverServices(projectRoot: string): Promise<readonly { readonly name: string }[]>;
  };
  /** Canonical client-module planner and writer. */
  readonly clientScaffolder: {
    /** Validate and render one owned client module. */
    plan(
      projectRoot: string,
      projectName: string,
      serviceName: string,
    ): Promise<{ readonly serviceName: string; readonly path: string; readonly content: string }>;
    /** Return whether the planned module needs reconciliation. */
    needsWrite(
      plan: { readonly serviceName: string; readonly path: string; readonly content: string },
      force: boolean,
    ): Promise<boolean>;
    /** Write one fully validated module. */
    write(plan: {
      readonly serviceName: string;
      readonly path: string;
      readonly content: string;
    }): Promise<void>;
  };
}

/** Validate and render every manifest service client without writing files. */
export async function validateServiceClientContracts(
  projectRoot: string,
  dependencies: GenerateServiceClientsDependencies,
): Promise<readonly Omit<PlannedServiceClientFile, 'willWrite'>[]> {
  const discovered = await dependencies.serviceResolver.discoverServices(projectRoot);
  assertUniqueResourceIdentities(discovered.map((service) => service.name));

  const projectName = await dependencies.readProjectName(projectRoot);
  const validated: Omit<PlannedServiceClientFile, 'willWrite'>[] = [];
  for (const service of discovered) {
    validated.push(await dependencies.clientScaffolder.plan(
      projectRoot,
      projectName,
      service.name,
    ));
  }
  return validated;
}

/** Validate, plan, and reconcile every manifest service client. */
export async function generateServiceClients(
  request: GenerateServiceClientsRequest,
  dependencies: GenerateServiceClientsDependencies,
): Promise<GenerateServiceClientsResult> {
  const validated = await validateServiceClientContracts(request.projectRoot, dependencies);
  const planned: PlannedServiceClientFile[] = [];

  // Complete every contract/path/render validation before the first write.
  for (const file of validated) {
    planned.push({
      ...file,
      willWrite: await dependencies.clientScaffolder.needsWrite(file, request.force),
    });
  }

  const skipped = planned.filter((file) => !file.willWrite).map((file) => file.path);
  if (request.dryRun) {
    return { planned, written: [], skipped, dryRun: true };
  }

  const written: string[] = [];
  for (const file of planned) {
    if (!file.willWrite) continue;
    await dependencies.clientScaffolder.write(file);
    written.push(file.path);
  }
  return { planned, written, skipped, dryRun: false };
}

function assertUniqueResourceIdentities(serviceNames: readonly string[]): void {
  const byIdentity = new Map<string, string>();
  for (const serviceName of serviceNames) {
    const identity = toCamelCase(serviceName);
    const prior = byIdentity.get(identity);
    if (prior) {
      throw new ScaffoldValidationError(
        `Cannot generate service clients because "${prior}" and "${serviceName}" share resource identity "${identity}".`,
        { serviceNames: [prior, serviceName], resourceIdentity: identity },
      );
    }
    byIdentity.set(identity, serviceName);
  }
}
