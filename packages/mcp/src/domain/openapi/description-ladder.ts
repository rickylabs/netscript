import type { IndexedOpenApiOperation } from './operation-index.ts';

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function humanize(value: string): string {
  const words = oneLine(
    value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .replace(/[._-]+/g, ' '),
  ).toLocaleLowerCase('en-US');
  return words ? `${words[0]!.toLocaleUpperCase('en-US')}${words.slice(1)}` : '';
}

function firstSentence(description: string): string {
  const text = oneLine(description);
  const boundary = text.match(/^.*?[.!?](?=\s|$)/u);
  return boundary?.[0] ?? text;
}

function fromOperationId(operationId: string): string {
  const segments = operationId.split('.').filter(Boolean);
  const action = humanize(segments.at(-1) ?? operationId);
  const scope = segments.length > 1 ? humanize(segments.at(-2) ?? '') : '';
  return scope ? `${action} (${scope.toLocaleLowerCase('en-US')})` : action;
}

function pathWords(path: string): string[] {
  return path.split('/').filter((segment) =>
    segment && !/^\{.*\}$/.test(segment) && segment !== 'api' && !/^v\d+$/i.test(segment)
  ).map((segment) => humanize(segment).toLocaleLowerCase('en-US'));
}

function fromMethodPath(operation: IndexedOpenApiOperation): string {
  const segments = pathWords(operation.path);
  const target = segments.at(-1) ?? 'operation';
  const scope = segments.at(-2);
  const scoped = scope ? `${target} on ${scope}` : target;
  switch (operation.method) {
    case 'POST':
      return `Invoke ${scoped}.`;
    case 'GET':
      return scope ? `Get ${target} from ${scope}.` : `Get ${target}.`;
    case 'PUT':
    case 'PATCH':
      return `Update ${scoped}.`;
    case 'DELETE':
      return scope ? `Delete ${target} from ${scope}.` : `Delete ${target}.`;
    case 'HEAD':
      return `Inspect ${scoped}.`;
    case 'OPTIONS':
      return `List options for ${scoped}.`;
    case 'TRACE':
      return `Trace ${scoped}.`;
  }
}

/**
 * Describe an indexed operation using summary, description, id, then method/path synthesis.
 *
 * The returned text is deterministic and single-line. Schema-property descriptions are never
 * considered operation summaries.
 */
export function describeOpenApiOperation(operation: IndexedOpenApiOperation): string {
  const summary = typeof operation.operation.summary === 'string'
    ? oneLine(operation.operation.summary)
    : '';
  if (summary) return summary;

  const description = typeof operation.operation.description === 'string'
    ? firstSentence(operation.operation.description)
    : '';
  if (description) return description;

  if (operation.operationId) return fromOperationId(operation.operationId);
  return fromMethodPath(operation);
}
