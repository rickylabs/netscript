import type { FigmaVariable } from '../../../../packages/fresh-ui/tokens.ts';
import type { ImportReceipt } from '../contract.ts';
import type { LibraryDigest } from '../validate-library.ts';

/** Small ownership/identity records stay below native plugin-data size limits. */
export const DATA_KEYS = {
  owner: 'library-owner',
  hash: 'library-hash',
  selection: 'library-selection',
  status: 'library-status',
  item: 'registry-item',
  part: 'contract-part',
  binding: 'token-binding',
} as const;
/** Native alias identity, checked against the host's actual local variable handles. */
export interface NativeAlias {
  readonly type: 'VARIABLE_ALIAS';
  readonly id: string;
}
/** The solid paint subset created on token inspection layers. */
export interface NativePaint {
  readonly type: 'SOLID';
  readonly color: { readonly r: number; readonly g: number; readonly b: number };
  readonly opacity?: number;
  readonly boundVariables?: { readonly color?: NativeAlias };
}
/** Native base handles are retained so a failed import can remove only its own new nodes. */
export interface NativeNode {
  readonly id: string;
  name: string;
  readonly removed: boolean;
  getPluginData(key: string): string;
  setPluginData(key: string, value: string): void;
  remove(): void;
}
/** Only node fields used by the importer and its independent exporter are exposed. */
export interface NativeLayout extends NativeNode {
  x: number;
  y: number;
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisSizingMode: 'AUTO' | 'FIXED';
  counterAxisSizingMode: 'AUTO' | 'FIXED';
  itemSpacing: number;
  fills: readonly NativePaint[];
  readonly boundVariables?: Readonly<
    Record<string, NativeAlias | readonly NativeAlias[] | undefined>
  >;
  resize(width: number, height: number): void;
  setBoundVariable(field: 'itemSpacing' | 'visible', variable: NativeVariable | null): void;
}
/** Flat anatomy comes from the contract, which deliberately contains no style-specific hierarchy. */
export interface NativeFrame extends NativeLayout {
  readonly type: 'FRAME';
  readonly children: readonly NativeScene[];
  appendChild(node: NativeScene): void;
}
/** Variant properties are read back from the native component, not trusted from plugin data. */
export interface NativeComponent extends NativeLayout {
  readonly type: 'COMPONENT';
  readonly children: readonly NativeScene[];
  readonly variantProperties: Readonly<Record<string, string>> | null;
  appendChild(node: NativeScene): void;
}
/** The native definition exposes both the variant vocabulary and the default value. */
export interface NativeSet extends NativeLayout {
  readonly type: 'COMPONENT_SET';
  readonly children: readonly NativeScene[];
  readonly componentPropertyDefinitions: Readonly<
    Record<string, {
      readonly type: string;
      readonly defaultValue: string | boolean;
      readonly variantOptions?: readonly string[];
    }>
  >;
}
/** String variables are inspected as text content without rebinding the specimen's font. */
export interface NativeText extends NativeNode {
  readonly type: 'TEXT';
  fontName: { readonly family: string; readonly style: string };
  characters: string;
  readonly boundVariables?: Readonly<
    Record<string, NativeAlias | readonly NativeAlias[] | undefined>
  >;
  setBoundVariable(field: 'characters', variable: NativeVariable | null): void;
}
/** All scene nodes created by this isolated tool. */
export type NativeScene = NativeFrame | NativeComponent | NativeSet | NativeText;
/** A generated page is the sole native mutation boundary. */
export interface NativePage extends NativeNode {
  readonly type: 'PAGE';
  readonly children: readonly NativeScene[];
  loadAsync(): Promise<void>;
  appendChild(node: NativeScene): void;
}
/** Native values are resolved in their real consumer's active mode. */
export interface NativeVariable {
  readonly id: string;
  readonly name: string;
  readonly variableCollectionId: string;
  readonly resolvedType: FigmaVariable['type'];
  readonly codeSyntax: { readonly WEB?: string };
  resolveForConsumer(node: NativeScene): { readonly value: unknown; readonly resolvedType: string };
}
/** Actual external effects; tests substitute a stateful native tree, never editor evidence. */
export interface FigmaComponentsPort {
  readonly fileKey?: string;
  readonly root: { readonly children: readonly NativePage[] };
  readonly variables: {
    getLocalVariableCollectionsAsync(): Promise<
      readonly {
        readonly id: string;
        readonly name: string;
        readonly modes: readonly { readonly modeId: string; readonly name: string }[];
      }[]
    >;
    getLocalVariablesAsync(): Promise<readonly NativeVariable[]>;
    setBoundVariableForPaint(
      paint: NativePaint,
      field: 'color',
      variable: NativeVariable,
    ): NativePaint;
  };
  loadFontAsync(font: { readonly family: string; readonly style: string }): Promise<void>;
  createPage(): NativePage;
  createFrame(): NativeFrame;
  createText(): NativeText;
  createComponent(): NativeComponent;
  combineAsVariants(nodes: readonly NativeComponent[], parent: NativePage): NativeSet;
}
/** Provenance is supplied only at the host boundary and is explicitly self-reported. */
export interface NativeContext {
  readonly provenance: ImportReceipt['provenance'];
  readonly fileKey: string;
  readonly signal: Pick<AbortSignal, 'throwIfAborted'>;
  readonly digest?: LibraryDigest;
}
