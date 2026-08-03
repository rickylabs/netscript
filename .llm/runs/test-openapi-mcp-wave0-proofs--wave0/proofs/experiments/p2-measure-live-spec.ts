const MAX_ITEMS = 50;
const MAX_STRING_LENGTH = 2000;
const METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);
const encoder = new TextEncoder();

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type Obj = { [key: string]: Json };

const [inputPath, outputPath] = Deno.args;
if (!inputPath || !outputPath) {
  throw new Error('usage: p2-measure-live-spec.ts <spec.json> <evidence.json>');
}

const bytes = await Deno.readFile(inputPath);
const spec = JSON.parse(new TextDecoder().decode(bytes)) as Obj;
const compactBytes = (value: Json) => encoder.encode(JSON.stringify(value)).length;
const pointer = (root: Json, ref: string): Json | undefined => {
  if (!ref.startsWith('#/')) return undefined;
  let current: Json | undefined = root;
  for (const raw of ref.slice(2).split('/')) {
    const key = raw.replaceAll('~1', '/').replaceAll('~0', '~');
    if (!current || Array.isArray(current) || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return current;
};

const refs = {
  local: new Set<string>(),
  external: new Set<string>(),
  unresolved: new Set<string>(),
};
const scanRefs = (value: Json): void => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) return value.forEach(scanRefs);
  if (typeof value.$ref === 'string') {
    const ref = value.$ref;
    if (ref.startsWith('#')) {
      refs.local.add(ref);
      if (pointer(spec, ref) === undefined) refs.unresolved.add(ref);
    } else refs.external.add(ref);
  }
  Object.values(value).forEach(scanRefs);
};
scanRefs(spec);

const dereference = (value: Json, stack = new Set<string>()): Json => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => dereference(item, new Set(stack)));
  if (typeof value.$ref === 'string' && value.$ref.startsWith('#')) {
    const ref = value.$ref;
    const target = pointer(spec, ref);
    if (target === undefined || stack.has(ref)) return value;
    const next = new Set(stack);
    next.add(ref);
    const resolved = dereference(target, next);
    return resolved && !Array.isArray(resolved) && typeof resolved === 'object'
      ? {
        ...resolved,
        ...Object.fromEntries(Object.entries(value).filter(([key]) => key !== '$ref')),
      }
      : resolved;
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, dereference(item, new Set(stack))]),
  );
};

const STANDARD_KEYWORDS = new Set([
  // JSON Schema 2020-12 core, applicator, validation, format, content, and metadata vocabularies.
  '$anchor',
  '$comment',
  '$defs',
  '$dynamicAnchor',
  '$dynamicRef',
  '$id',
  '$ref',
  '$schema',
  '$vocabulary',
  'additionalProperties',
  'allOf',
  'anyOf',
  'const',
  'contains',
  'contentEncoding',
  'contentMediaType',
  'contentSchema',
  'default',
  'deprecated',
  'description',
  'dependentRequired',
  'dependentSchemas',
  'enum',
  'examples',
  'exclusiveMaximum',
  'exclusiveMinimum',
  'format',
  'if',
  'items',
  'maximum',
  'maxContains',
  'maxItems',
  'maxLength',
  'maxProperties',
  'minimum',
  'minContains',
  'minItems',
  'minLength',
  'minProperties',
  'multipleOf',
  'not',
  'oneOf',
  'pattern',
  'patternProperties',
  'prefixItems',
  'properties',
  'propertyNames',
  'readOnly',
  'required',
  'then',
  'title',
  'type',
  'unevaluatedItems',
  'unevaluatedProperties',
  'uniqueItems',
  'writeOnly',
  // OpenAPI 3.1 fixed fields across the root and component object families.
  'allowEmptyValue',
  'allowReserved',
  'callbacks',
  'components',
  'contact',
  'content',
  'cookies',
  'description',
  'discriminator',
  'email',
  'encoding',
  'example',
  'explode',
  'expression',
  'externalDocs',
  'flows',
  'headers',
  'identifier',
  'implicit',
  'in',
  'info',
  'jsonSchemaDialect',
  'label',
  'license',
  'links',
  'name',
  'oauth2',
  'openIdConnectUrl',
  'openapi',
  'operationId',
  'parameter',
  'parameters',
  'password',
  'paths',
  'refreshUrl',
  'requestBodies',
  'requestBody',
  'responses',
  'schema',
  'schemas',
  'scopes',
  'security',
  'securitySchemes',
  'servers',
  'style',
  'summary',
  'tags',
  'termsOfService',
  'tokenUrl',
  'type',
  'url',
  'userName',
  'variables',
  'version',
  'webhooks',
  'xml',
]);
const keywordSet = new Set<string>();
const nonAllowlistedKeyPaths = new Map<string, string[]>();
const scanKeywords = (value: Json, path = '$'): void => {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    return value.forEach((item, index) => scanKeywords(item, `${path}/${index}`));
  }
  for (const [key, item] of Object.entries(value)) {
    if (STANDARD_KEYWORDS.has(key) || METHODS.has(key)) keywordSet.add(key);
    else {
      const paths = nonAllowlistedKeyPaths.get(key) ?? [];
      paths.push(`${path}/${key}`);
      nonAllowlistedKeyPaths.set(key, paths);
    }
    scanKeywords(item, `${path}/${key}`);
  }
};
scanKeywords(spec);

const limits = (value: Json) => {
  let arrays = 0, strings = 0, maxArrayLength = 0, maxStringLength = 0;
  const arrayViolations: string[] = [], stringViolations: string[] = [];
  const visit = (item: Json, path: string): void => {
    if (typeof item === 'string') {
      strings++;
      maxStringLength = Math.max(maxStringLength, item.length);
      if (item.length > MAX_STRING_LENGTH) stringViolations.push(path);
    } else if (Array.isArray(item)) {
      arrays++;
      maxArrayLength = Math.max(maxArrayLength, item.length);
      if (item.length > MAX_ITEMS) arrayViolations.push(path);
      item.forEach((child, index) => visit(child, `${path}/${index}`));
    } else if (item && typeof item === 'object') {
      Object.entries(item).forEach(([key, child]) => visit(child, `${path}/${key}`));
    }
  };
  visit(value, '$');
  return { arrays, strings, maxArrayLength, maxStringLength, arrayViolations, stringViolations };
};

const measureView = (source: Json) => {
  const localDereferenced = dereference(source);
  return {
    source: { bytes: compactBytes(source), limits: limits(source) },
    localDereferenced: {
      bytes: compactBytes(localDereferenced),
      limits: limits(localDereferenced),
    },
  };
};

const paths = spec.paths as Obj ?? {};
const operations: Json[] = [];
for (const [path, pathItem] of Object.entries(paths)) {
  if (!pathItem || Array.isArray(pathItem) || typeof pathItem !== 'object') continue;
  for (const [method, operation] of Object.entries(pathItem)) {
    if (
      !METHODS.has(method) || !operation || Array.isArray(operation) ||
      typeof operation !== 'object'
    ) continue;
    const operationId = typeof operation.operationId === 'string' ? operation.operationId : null;
    const responses = operation.responses && !Array.isArray(operation.responses) &&
        typeof operation.responses === 'object'
      ? operation.responses as Obj
      : {};
    const success = Object.fromEntries(
      Object.entries(responses).filter(([status]) => /^2\d\d$/.test(status)),
    );
    const errors = Object.fromEntries(
      Object.entries(responses).filter(([status]) => !/^2\d\d$/.test(status)),
    );
    const request = {
      parameters: operation.parameters ?? [],
      requestBody: operation.requestBody ?? null,
    } as Json;
    const allSchemas = { request, responses } as Json;
    const row = { operationId, method: method.toUpperCase(), path } as Json;
    operations.push({
      operationId,
      operationIdShape: operationId === null
        ? 'missing'
        : operationId.includes('.')
        ? 'dotted-contract-path'
        : 'non-dotted',
      method: method.toUpperCase(),
      path,
      discoveryRow: { bytes: compactBytes(row), limits: limits(row) },
      views: {
        request: measureView(request),
        response: measureView(success),
        error: measureView(errors),
        allSchemas: measureView(allSchemas),
      },
      non2xx: Object.entries(errors).map(([status, response]) => ({
        status,
        response,
        bytes: compactBytes(response),
      })),
      commonErrorEnvelopeInferred: false,
    });
  }
}

const evidence = {
  schemaVersion: 1,
  proof: 'P2',
  scaffold: 'no-db',
  measuredAt: new Date().toISOString(),
  sourceSpec: {
    compactUtf8Bytes: compactBytes(spec),
    fetchedRawBytes: bytes.length,
    sha256: await crypto.subtle.digest('SHA-256', bytes).then((hash) =>
      Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('')
    ),
  },
  operationCount: operations.length,
  operations,
  references: {
    local: [...refs.local].sort(),
    external: [...refs.external].sort(),
    unresolved: [...refs.unresolved].sort(),
  },
  recursivelyObservedKeywords: [...keywordSet].sort(),
  nonAllowlistedObjectKeys: [...nonAllowlistedKeyPaths.entries()].sort(([left], [right]) =>
    left.localeCompare(right)
  ).map(([key, paths]) => ({ key, paths })),
  keywordScanLimitation:
    'Context-blind object-key scan: a schema property name equal to a standard keyword is reported as observed; non-allowlisted keys and paths make omissions auditable.',
  wholeSpecLimits: limits(spec),
  truncationPolicy: {
    maxItems: MAX_ITEMS,
    maxStringLength: MAX_STRING_LENGTH,
    wholeResultByteCeiling: null,
    note: 'The current MCP path has no whole-result byte ceiling.',
  },
  interpretation: {
    validLiveSpec: true,
    commonErrorEnvelopeObserved: false,
    note:
      'No non-2xx response was declared by this no-database template; no common error envelope is inferred.',
  },
};

await Deno.writeTextFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`);
