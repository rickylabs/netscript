/** Minimal resource shape accepted by the Aspire inspector. */
export interface InspectableAspireResource {
  /** Resource name included in diagnostic output. */
  readonly name: string;
}

/** Minimal builder shape accepted by the Aspire inspector. */
export interface InspectableAspireBuilder {
  /** Resources collected by the builder. */
  readonly resources: readonly InspectableAspireResource[];
  /** References collected by the builder. */
  readonly references?: readonly unknown[];
}

function isResourceArray(
  target: string | readonly InspectableAspireResource[] | InspectableAspireBuilder,
): target is readonly InspectableAspireResource[] {
  return Array.isArray(target);
}

/** JSON-stable diagnostic report returned by Aspire inspectors. */
export interface InspectionReport {
  /** Package identifier inspected by this report. */
  readonly package: '@netscript/aspire';
  /** Human-readable target name or path supplied to the inspector. */
  readonly target: string;
  /** Short diagnostic summary suitable for CLI output. */
  readonly summary: string;
  /** JSON-stable detail payload for machine readers. */
  readonly details: Record<string, unknown>;
}

/**
 * Inspect an Aspire target and return a JSON-stable diagnostic report.
 *
 * @param target - Builder, resource list, or path-like label to inspect.
 * @returns A diagnostic report suitable for CLI rendering.
 */
export function inspectAspire(
  target: string | readonly InspectableAspireResource[] | InspectableAspireBuilder,
): InspectionReport {
  if (typeof target === 'string') {
    return {
      package: '@netscript/aspire',
      target,
      summary: 'Aspire path inspection target',
      details: { kind: 'path' },
    };
  }

  const resources: readonly InspectableAspireResource[] = isResourceArray(target)
    ? target
    : target.resources;
  const references = isResourceArray(target) ? [] : target.references ?? [];

  return {
    package: '@netscript/aspire',
    target: 'aspire-composition',
    summary: 'Aspire composition inspection target',
    details: {
      kind: 'composition',
      resources: resources.length,
      references: references.length,
      resourceNames: resources.map((resource: InspectableAspireResource) => resource.name),
    },
  };
}
