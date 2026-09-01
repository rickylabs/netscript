/** Half-open source offsets for a generated resource block. */
export interface SourceRange {
  readonly start: number;
  readonly end: number;
}

/** Identifies one resource block inside a generated register-*.mts helper. */
export interface ResourceBlockQuery {
  /** Registry variable the generator registers the resource into. */
  readonly registry: string;
  /** Resource name as emitted by the generator. */
  readonly resourceName: string;
  /** Generated file name, used only for error messages. */
  readonly generatedFile: string;
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Locates a complete generated resource block from the generated code that *names* the resource.
 *
 * #1837 made the register generators source-safe by renaming the per-plugin block comment from the
 * resource name to a positional ordinal (`// --- workers-api ---` became `// --- plugin 3 ---`),
 * silently breaking every consumer keyed on the name. Keying on the ordinal instead would be worse:
 * it shifts with plugin order, so a stale consumer would select the *wrong* block rather than fail.
 *
 * Both register generators emit the same two-anchor shape -- a `const <id> = builder.addExecutable(
 * '<name>', ...)` creation and a matching `<registry>.set('<name>', <id>)` registration -- so the
 * block is bounded by generated code alone, independent of comment formatting. The identifier is
 * captured from the creation and required to match in the registration, and the resulting span must
 * contain exactly one creation and one registration, so it cannot silently widen across a sibling
 * resource. Ambiguity is rejected rather than resolved by position.
 */
export function locateGeneratedResourceBlock(
  source: string,
  query: ResourceBlockQuery,
): SourceRange {
  const name = escapeForRegExp(query.resourceName);
  const registry = escapeForRegExp(query.registry);

  const creationPattern = new RegExp(
    `^[ \\t]*const[ \\t]+([A-Za-z_$][\\w$]*)[ \\t]*=[ \\t]*builder\\.addExecutable\\([ \\t]*(['"])${name}\\2`,
    'gm',
  );
  const creations = [...source.matchAll(creationPattern)];
  if (creations.length !== 1) {
    throw resourceBlockError(
      query,
      `expected exactly 1 creation anchor, found ${creations.length}`,
    );
  }

  const creation = creations[0];
  const identifier = escapeForRegExp(creation[1]);
  const registrationPattern = new RegExp(
    `^[ \\t]*${registry}\\.set\\([ \\t]*(['"])${name}\\1[ \\t]*,[ \\t]*${identifier}[ \\t]*\\);[ \\t]*$`,
    'gm',
  );
  const registrations = [...source.matchAll(registrationPattern)];
  if (registrations.length !== 1) {
    throw resourceBlockError(
      query,
      `expected exactly 1 registration anchor for '${creation[1]}', found ${registrations.length}`,
    );
  }

  const registration = registrations[0];
  if (creation.index >= registration.index) {
    throw resourceBlockError(query, 'registration precedes its creation');
  }

  const start = creation.index;
  const end = registration.index + registration[0].length;
  const block = source.slice(start, end);
  if (
    countOccurrences(block, 'builder.addExecutable(') !== 1 ||
    countOccurrences(block, `${query.registry}.set(`) !== 1
  ) {
    throw resourceBlockError(query, 'located span covers more than one resource');
  }

  return { start, end };
}

/** Locates the workers plugin resource in a generated `register-plugins.mts`. */
export function locateWorkersResourceBlock(source: string): SourceRange {
  return locateGeneratedResourceBlock(source, {
    registry: 'plugins',
    resourceName: 'workers-api',
    generatedFile: 'register-plugins.mts',
  });
}

/** Locates the workers background processor in a generated `register-background.mts`. */
export function locateWorkersBackgroundBlock(source: string): SourceRange {
  return locateGeneratedResourceBlock(source, {
    registry: 'backgroundProcessors',
    resourceName: 'workers',
    generatedFile: 'register-background.mts',
  });
}

function resourceBlockError(query: ResourceBlockQuery, reason: string): Error {
  return new Error(
    `generated ${query.generatedFile} did not contain exactly one complete ` +
      `${query.resourceName} resource block (${reason})`,
  );
}

function countOccurrences(source: string, search: string): number {
  return source.split(search).length - 1;
}
