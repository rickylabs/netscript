/** Prisma declaration kinds that share one top-level schema namespace. */
export type PrismaDeclarationKind = 'model' | 'enum' | 'type' | 'view';

/** One top-level Prisma declaration and its removable source span. */
export interface PrismaDeclaration {
  readonly kind: PrismaDeclarationKind;
  readonly name: string;
  readonly normalizedBody: string;
  readonly start: number;
  readonly end: number;
}

const DECLARATION_HEADER = /^\s*(model|enum|type|view)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/gm;

/** Scan the top-level declaration headers and balanced bodies in a Prisma fragment. */
export function scanPrismaDeclarations(content: string): readonly PrismaDeclaration[] {
  const declarations: PrismaDeclaration[] = [];
  DECLARATION_HEADER.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DECLARATION_HEADER.exec(content)) !== null) {
    const openBrace = match.index + match[0].lastIndexOf('{');
    const end = findDeclarationEnd(content, openBrace);
    declarations.push({
      kind: match[1] as PrismaDeclarationKind,
      name: match[2],
      normalizedBody: normalizeDeclaration(content.slice(match.index, end)),
      start: findLeadingDocumentationStart(content, match.index),
      end,
    });
    DECLARATION_HEADER.lastIndex = end;
  }
  return declarations;
}

/** Remove selected declarations while leaving every other fragment byte intact. */
export function removePrismaDeclarations(
  content: string,
  declarations: readonly PrismaDeclaration[],
): string {
  const sorted = [...declarations].sort((left, right) => left.start - right.start);
  let cursor = 0;
  let result = '';
  for (const declaration of sorted) {
    if (declaration.end <= cursor) continue;
    result += content.slice(cursor, declaration.start);
    cursor = declaration.end;
  }
  return result + content.slice(cursor);
}

/** Whether content contains only whitespace or comments after declaration removal. */
export function isPrismaTrivia(content: string): boolean {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .trim().length === 0;
}

function normalizeDeclaration(content: string): string {
  return content
    .replaceAll('\r\n', '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

function findDeclarationEnd(content: string, openBrace: number): number {
  let depth = 0;
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = openBrace; index < content.length; index++) {
    const current = content[index];
    const next = content[index + 1];
    if (inLineComment) {
      if (current === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (current === '*' && next === '/') {
        inBlockComment = false;
        index++;
      }
      continue;
    }
    if (inString) {
      if (current === '\\') {
        index++;
      } else if (current === '"') {
        inString = false;
      }
      continue;
    }
    if (current === '/' && next === '/') {
      inLineComment = true;
      index++;
    } else if (current === '/' && next === '*') {
      inBlockComment = true;
      index++;
    } else if (current === '"') {
      inString = true;
    } else if (current === '{') {
      depth++;
    } else if (current === '}' && --depth === 0) {
      return index + 1;
    }
  }
  return content.length;
}

function findLeadingDocumentationStart(content: string, headerStart: number): number {
  let start = content.lastIndexOf('\n', headerStart - 1) + 1;
  while (start > 0) {
    const previousEnd = start - 1;
    const previousStart = content.lastIndexOf('\n', previousEnd - 1) + 1;
    const line = content.slice(previousStart, previousEnd).trim();
    if (line.length > 0 && !line.startsWith('///')) break;
    start = previousStart;
  }
  return start;
}
