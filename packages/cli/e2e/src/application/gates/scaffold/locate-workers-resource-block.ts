/** Half-open source offsets for the generated workers resource block. */
export interface SourceRange {
  readonly start: number;
  readonly end: number;
}

const workersCreationPattern =
  /^[ \t]*const[ \t]+resource[ \t]*=[ \t]*builder\.addExecutable\([ \t]*(['"])workers-api\1[ \t]*,/gm;
const workersRegistrationPattern =
  /^[ \t]*plugins\.set\([ \t]*(['"])workers-api\1[ \t]*,[ \t]*resource[ \t]*\);[ \t]*$/gm;
const resourceCreationPattern = /^[ \t]*const[ \t]+resource[ \t]*=[ \t]*builder\.addExecutable\(/gm;
const resourceRegistrationPattern = /^[ \t]*plugins\.set\(/gm;

/** Locates the unique complete workers resource using generated executable and registry code. */
export function locateWorkersResourceBlock(source: string): SourceRange {
  const creations = [...source.matchAll(workersCreationPattern)];
  const registrations = [...source.matchAll(workersRegistrationPattern)];

  if (creations.length !== 1 || registrations.length !== 1) {
    throw malformedWorkersBlock(creations.length, registrations.length);
  }

  const creation = creations[0];
  const registration = registrations[0];
  if (creation.index >= registration.index) {
    throw malformedWorkersBlock(creations.length, registrations.length);
  }

  const block = source.slice(creation.index, registration.index + registration[0].length);
  if (
    [...block.matchAll(resourceCreationPattern)].length !== 1 ||
    [...block.matchAll(resourceRegistrationPattern)].length !== 1
  ) {
    throw malformedWorkersBlock(creations.length, registrations.length);
  }

  return {
    start: creation.index,
    end: registration.index + registration[0].length,
  };
}

function malformedWorkersBlock(creations: number, registrations: number): Error {
  return new Error(
    'generated register-plugins.mts did not contain exactly one complete workers-api resource block ' +
      `(creation anchors: ${creations}, registration anchors: ${registrations})`,
  );
}
