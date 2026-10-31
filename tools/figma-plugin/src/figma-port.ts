/** Minimal structural Plugin API surface; production uses Figma's async local-variable API. */
export type FigmaValue = string | number | boolean | { type: 'VARIABLE_ALIAS'; id: string } | {
  r: number;
  g: number;
  b: number;
  a?: number;
};
/** Mutable variable handle returned by Figma. */
export interface VariableHandle {
  readonly id: string;
  readonly variableCollectionId: string;
  name: string;
  readonly resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  scopes: string[];
  description: string;
  readonly codeSyntax: { WEB?: string };
  readonly valuesByMode: Readonly<Record<string, FigmaValue>>;
  setValueForMode(mode: string, value: FigmaValue): void;
  setVariableCodeSyntax(platform: 'WEB', value: string): void;
  removeVariableCodeSyntax(platform: 'WEB'): void;
}
/** Mutable collection handle; the first mode is the default. */
export interface CollectionHandle {
  readonly id: string;
  readonly name: string;
  readonly modes: readonly { modeId: string; name: string }[];
  addMode(name: string): string;
  renameMode(id: string, name: string): void;
}
/** The actual effects exercised by the mock and the host entrypoint. */
export interface FigmaVariablesPort {
  getLocalVariableCollectionsAsync(): Promise<readonly CollectionHandle[]>;
  getLocalVariablesAsync(): Promise<readonly VariableHandle[]>;
  createVariableCollection(name: string): CollectionHandle;
  createVariable(
    name: string,
    collection: CollectionHandle,
    type: VariableHandle['resolvedType'],
  ): VariableHandle;
}
