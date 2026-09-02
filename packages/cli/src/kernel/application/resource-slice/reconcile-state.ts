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
  const closeBrace = matchingBrace(source, openBrace);
  if (closeBrace < 0) return conflict('The State interface has no safe closing anchor.');
  const body = source.slice(openBrace + 1, closeBrace);
  const propertyPattern = new RegExp(
    `^\\s*(?:readonly\\s+)?${escapePattern(requirement.property)}(\\?)?\\s*:\\s*([^;]+);\\s*$`,
    'm',
  );
  const property = propertyPattern.exec(body);
  if (property) {
    return !property[1] && property[2].trim() === requirement.type.trim()
      ? { status: 'exact', content: source }
      : conflict(`State.${requirement.property} already has another declaration.`);
  }
  return {
    status: 'insert',
    content: source.slice(0, closeBrace) + member + source.slice(closeBrace),
  };
}

function stateMember(requirement: StateRequirement): string {
  return `  /** @netscript/resource-slice ${requirement.resource} */\n` +
    `  readonly ${requirement.property}: ${requirement.type.trim()};\n`;
}

function matchingBrace(source: string, openBrace: number): number {
  let depth = 0;
  let quote = '';
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
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
    if (character === '{') depth++;
    if (character === '}' && --depth === 0) return index;
  }
  return -1;
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
