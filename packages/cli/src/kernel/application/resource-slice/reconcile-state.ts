import type { RequiredResourceState } from './resource-slice-contract.ts';

export type StateReconcileResult =
  | Readonly<{ status: 'exact'; content: string }>
  | Readonly<{ status: 'insert'; content: string }>
  | Readonly<{ status: 'conflict'; reason: string }>;

export interface StateRequirement extends RequiredResourceState {
  readonly resource: string;
}

const EMPTY_STATE = /^export type State = Record<string, never>;[ \t]*$/m;
const INTERFACE_START = /^export interface State \{\s*$/gm;

/** Add one request-state property only to the two explicitly supported State shapes. */
export function reconcileState(
  source: string,
  requirement: StateRequirement,
): StateReconcileResult {
  if (!isIdentifier(requirement.property) || !requirement.type.trim()) {
    return conflict('The required State property or type is invalid.');
  }
  const aliasMatches = [...source.matchAll(/export type State\s*=/g)];
  const interfaceMatches = [...source.matchAll(/export interface State\b/g)];
  if (aliasMatches.length + interfaceMatches.length !== 1) {
    return conflict('Exactly one supported exported State declaration is required.');
  }

  const member = stateMember(requirement);
  if (aliasMatches.length === 1) {
    const empty = EMPTY_STATE.exec(source);
    if (!empty) return conflict('The State type alias is customized and cannot be transformed.');
    return {
      status: 'insert',
      content: source.slice(0, empty.index) +
        `export interface State {\n${member}}` +
        source.slice(empty.index + empty[0].length),
    };
  }

  const starts = [...source.matchAll(INTERFACE_START)];
  if (starts.length !== 1) {
    return conflict('The State interface extends or customizes the supported declaration shape.');
  }
  const openBrace = source.indexOf('{', starts[0].index);
  const scanned = scanStateInterface(source, openBrace);
  if (!scanned) return conflict('The State interface has no safe closing anchor.');
  const properties = scanned.members.flatMap((member) => {
    const property = parseNamedProperty(member, requirement.property);
    return property ? [property] : [];
  });
  if (properties.length) {
    return properties.length === 1 && !properties[0].optional &&
        properties[0].type === requirement.type.trim()
      ? { status: 'exact', content: source }
      : conflict(`State.${requirement.property} already has another declaration.`);
  }
  return {
    status: 'insert',
    content: source.slice(0, scanned.closeBrace) + member + source.slice(scanned.closeBrace),
  };
}

function stateMember(requirement: StateRequirement): string {
  return `  /** @netscript/resource-slice ${requirement.resource} */\n` +
    `  readonly ${requirement.property}: ${requirement.type.trim()};\n`;
}

function scanStateInterface(
  source: string,
  openBrace: number,
): Readonly<{ closeBrace: number; members: readonly string[] }> | undefined {
  let depth = 0;
  let parentheses = 0;
  let brackets = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let memberStart = openBrace + 1;
  const members: string[] = [];
  for (let index = openBrace; index < source.length; index++) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index++;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }
    if (character === '/' && next === '/') {
      lineComment = true;
      index++;
      continue;
    }
    if (character === '/' && next === '*') {
      blockComment = true;
      index++;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') {
      depth++;
      continue;
    }
    if (character === '}') {
      depth--;
      if (depth === 0) {
        pushMember(members, source.slice(memberStart, index));
        return { closeBrace: index, members };
      }
      continue;
    }
    if (character === '(') parentheses++;
    else if (character === ')') parentheses--;
    else if (character === '[') brackets++;
    else if (character === ']') brackets--;
    else if (character === ';' && depth === 1 && parentheses === 0 && brackets === 0) {
      pushMember(members, source.slice(memberStart, index + 1));
      memberStart = index + 1;
    }
  }
  return undefined;
}

function pushMember(members: string[], member: string): void {
  if (member.trim()) members.push(member);
}

function parseNamedProperty(
  member: string,
  name: string,
): Readonly<{ optional: boolean; type: string }> | undefined {
  let declaration = stripLeadingTrivia(member);
  if (/^readonly(?=\s|\/)/.test(declaration)) {
    declaration = stripLeadingTrivia(declaration.slice(8));
  }
  const escapedName = escapePattern(name);
  const key = new RegExp(`^(?:${escapedName}(?![A-Za-z0-9_$])|'${escapedName}'|"${escapedName}")`)
    .exec(declaration);
  if (!key) return undefined;

  let remainder = declaration.slice(key[0].length).trimStart();
  const optional = remainder.startsWith('?');
  if (optional) remainder = remainder.slice(1).trimStart();
  if (!remainder.startsWith(':')) return { optional: true, type: '' };
  remainder = remainder.slice(1).trim();
  if (!remainder.endsWith(';')) return { optional: true, type: '' };
  return { optional, type: remainder.slice(0, -1).trim() };
}

function stripLeadingTrivia(source: string): string {
  let index = 0;
  while (index < source.length) {
    while (/\s/.test(source[index] ?? '')) index++;
    if (source.startsWith('//', index)) {
      const newline = source.indexOf('\n', index + 2);
      index = newline < 0 ? source.length : newline + 1;
      continue;
    }
    if (source.startsWith('/*', index)) {
      const close = source.indexOf('*/', index + 2);
      index = close < 0 ? source.length : close + 2;
      continue;
    }
    break;
  }
  return source.slice(index);
}

function conflict(reason: string): StateReconcileResult {
  return { status: 'conflict', reason };
}

function isIdentifier(value: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
