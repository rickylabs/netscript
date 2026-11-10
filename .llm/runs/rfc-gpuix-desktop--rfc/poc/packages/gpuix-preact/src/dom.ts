/**
 * A minimal DOM facade that Preact (10.x and 11.x) can diff against, backed by
 * GPUIX's retained element tree.
 *
 * Preact touches a small, stable DOM surface: `document.createElementNS` /
 * `createTextNode` (10.x through the global `document`, 11.x through
 * `parentDom.ownerDocument`), `insertBefore`, `removeChild`, sibling/parent
 * pointers, `style[key] = value`, `setAttribute`, `addEventListener`, and
 * `text.data`. Every operation here is translated into GPUIX's batched mutation
 * protocol (`createElement`, `appendChild`, `insertBefore`, `setStyle`,
 * `setText`, `setCustomProp`, `setEventListener`, `destroyElement`), the same
 * protocol the upstream React and Solid adapters feed.
 *
 * Nodes are created detached; the native element is created only when a node
 * is inserted under a mounted parent (mirrors the Solid host in @gpuix/solid).
 *
 * @module
 */
import {
  BUILT_IN_TYPES,
  registerEventHandler,
  serializeCustomProp,
  unregisterEventHandler,
  unregisterEventHandlers,
  UNIVERSAL_PROPS,
} from '@gpuix/native/host';
import type { EventHandlerMap, MutationRenderer, NativeRenderer, StyleDesc } from '@gpuix/native/host';
import type { EventPayload } from '@gpuix/native';

/** Native element types GPUIX paints. Tags with a `-` are Rust custom elements. */
const NATIVE_TYPES = new Set([
  'div', 'text', 'img', 'svg', 'canvas', 'input', 'textarea', 'anchored', 'code', 'diff',
  'markdown', 'virtual-list',
]);

/**
 * HTML tags accepted for authoring convenience. They map to a native `div` and
 * receive a tiny user-agent style. This is the "tag mapping" layer a Fresh
 * native target would need; it is deliberately small.
 */
const HTML_TAG_DEFAULTS: Record<string, StyleDesc> = {
  span: {}, p: {}, section: {}, header: {}, footer: {}, main: {}, nav: {}, aside: {},
  article: {}, label: {}, ul: {}, ol: {}, li: {}, form: {}, a: {}, button: {}, strong: { fontWeight: 600 },
  h1: { fontSize: 28, fontWeight: 600 }, h2: { fontSize: 22, fontWeight: 600 },
  h3: { fontSize: 17, fontWeight: 600 }, h4: { fontSize: 15, fontWeight: 600 },
};

const PX_NUMBER = /^(-?\d+(?:\.\d+)?)px$/;
const RESERVED_ATTRS = new Set(['class', 'className', 'key', 'ref', 'children', 'style']);

/** Root-scoped services every node reaches once mounted. */
export interface HostScope {
  readonly mutations: MutationRenderer;
  readonly renderer: NativeRenderer;
  readonly eventHandlers: EventHandlerMap;
  allocateId(): number;
  markStyleDirty(element: GElement): void;
  requestFlush(): void;
}

type Listener = { preactName: string; proxy: (event: unknown) => unknown; native: (event: EventPayload) => void };

/** Shared node behaviour: an intrusive doubly linked child list (O(1) siblings). */
export abstract class GNode {
  abstract readonly nodeType: number;
  parentNode: GElement | null = null;
  firstChild: GNode | null = null;
  lastChild: GNode | null = null;
  nextSibling: GNode | null = null;
  previousSibling: GNode | null = null;
  /** GPUIX element id; 0 until mounted. Named to avoid colliding with JSX props. */
  __gid = 0;
  __mounted = false;
  __scope: HostScope | null = null;

  constructor(readonly ownerDocument: GDocument) {}

  get childNodes(): GNode[] {
    const out: GNode[] = [];
    for (let child = this.firstChild; child; child = child.nextSibling) out.push(child);
    return out;
  }

  get parentElement(): GElement | null {
    return this.parentNode;
  }

  remove(): void {
    this.parentNode?.removeChild(this);
  }
}

/** A text run. Preact writes `.data`; GPUIX gets `setText`. */
export class GText extends GNode {
  readonly nodeType = 3;
  #data: string;

  constructor(ownerDocument: GDocument, data: unknown) {
    super(ownerDocument);
    this.#data = String(data ?? '');
  }

  get data(): string {
    return this.#data;
  }

  set data(value: string) {
    const next = String(value ?? '');
    if (next === this.#data) return;
    this.#data = next;
    if (this.__mounted && this.__scope) {
      this.__scope.mutations.setText(this.__gid, next);
      this.__scope.requestFlush();
    }
  }

  get nodeValue(): string {
    return this.#data;
  }

  get textContent(): string {
    return this.#data;
  }
}

/** An element. `localName` is what the author wrote; `__type` is the native type. */
export class GElement extends GNode {
  readonly nodeType = 1;
  readonly localName: string;
  readonly __type: string;
  readonly __props = new Map<string, unknown>();
  __style: StyleDesc;
  readonly __listeners = new Map<string, Listener>();
  readonly style: Record<string, unknown>;

  constructor(ownerDocument: GDocument, tag: string) {
    super(ownerDocument);
    this.localName = tag;
    if (NATIVE_TYPES.has(tag) || tag.includes('-')) {
      this.__type = tag;
      this.__style = {};
    } else if (tag in HTML_TAG_DEFAULTS) {
      this.__type = 'div';
      this.__style = { ...HTML_TAG_DEFAULTS[tag] };
    } else {
      throw new Error(`gpuix-preact: unsupported element <${tag}>`);
    }
    this.style = createStyleFacade(this);
  }

  get tagName(): string {
    return this.localName.toUpperCase();
  }

  // ---- tree -------------------------------------------------------------

  insertBefore<T extends GNode>(node: T, reference: GNode | null): T {
    if (reference && reference.parentNode !== this) {
      throw new Error('gpuix-preact: insertBefore reference is not a child of this node');
    }
    if (node === reference) return node;
    if (node.parentNode) unlink(node.parentNode, node);
    link(this, node, reference);
    const scope = this.__mounted ? this.__scope : null;
    if (!scope) return node;
    mountTree(scope, node);
    if (reference && reference.__mounted) {
      scope.mutations.insertBefore(this.__gid, node.__gid, reference.__gid);
    } else {
      scope.mutations.appendChild(this.__gid, node.__gid);
    }
    scope.requestFlush();
    return node;
  }

  appendChild<T extends GNode>(node: T): T {
    return this.insertBefore(node, null);
  }

  removeChild<T extends GNode>(node: T): T {
    if (node.parentNode !== this) return node;
    unlink(this, node);
    if (node.__mounted && node.__scope) {
      const scope = node.__scope;
      const id = node.__gid;
      unmountTree(node);
      scope.mutations.destroyElement(id);
      scope.requestFlush();
    }
    return node;
  }

  replaceChild<T extends GNode>(node: GNode, old: T): T {
    this.insertBefore(node, old);
    return this.removeChild(old);
  }

  // ---- attributes / custom props ---------------------------------------

  setAttribute(name: string, value: unknown): void {
    if (RESERVED_ATTRS.has(name)) return;
    this.__props.set(name, value);
    this.#sendProp(name, value);
  }

  removeAttribute(name: string): void {
    if (!this.__props.has(name)) return;
    this.__props.delete(name);
    this.#sendProp(name, null);
  }

  getAttribute(name: string): unknown {
    return this.__props.get(name) ?? null;
  }

  hasAttribute(name: string): boolean {
    return this.__props.has(name);
  }

  #sendProp(name: string, value: unknown): void {
    if (!this.__mounted || !this.__scope || !customPropAllowed(this, name)) return;
    this.__scope.mutations.setCustomProp(this.__gid, name, serializeProp(value));
    this.__scope.requestFlush();
  }

  // ---- events -------------------------------------------------------------

  /**
   * Preact registers `name` exactly as derived from the JSX prop (`onClick` →
   * `Click`, because no `onclick` exists on this object) and dispatches by
   * `event.type`. GPUIX names events lowerCamel (`click`, `keyDown`, `change`).
   */
  addEventListener(name: string, proxy: (event: unknown) => unknown): void {
    const nativeType = name[0].toLowerCase() + name.slice(1);
    const native = (payload: EventPayload) => {
      const event = Object.create(payload as object) as Record<string, unknown>;
      event.type = name;
      event.target = this;
      event.currentTarget = this;
      proxy.call(this, event);
    };
    const had = this.__listeners.has(nativeType);
    this.__listeners.set(nativeType, { preactName: name, proxy, native });
    if (!this.__mounted || !this.__scope) return;
    registerEventHandler(this.__scope.eventHandlers, this.__gid, nativeType, native);
    if (!had) {
      this.__scope.mutations.setEventListener(this.__gid, nativeType, true);
      this.__scope.requestFlush();
    }
  }

  removeEventListener(name: string): void {
    const nativeType = name[0].toLowerCase() + name.slice(1);
    if (!this.__listeners.delete(nativeType)) return;
    if (!this.__mounted || !this.__scope) return;
    unregisterEventHandler(this.__scope.eventHandlers, this.__gid, nativeType);
    this.__scope.mutations.setEventListener(this.__gid, nativeType, false);
    this.__scope.requestFlush();
  }

  // ---- imperative helpers for refs ---------------------------------------

  focus(): void {
    if (this.__mounted) this.__scope?.renderer.focusElement?.(this.__gid);
  }

  blur(): void {
    this.__scope?.renderer.blur?.();
  }

  scrollIntoView(): void {
    if (this.__mounted) this.__scope?.renderer.scrollIntoView?.(this.__gid);
  }

  setImage(bytes: Uint8Array): void {
    if (this.__mounted) this.__scope?.renderer.setImage?.(this.__gid, bytes as never);
  }

  get textContent(): string {
    let out = '';
    for (let child = this.firstChild; child; child = child.nextSibling) {
      out += (child as GText | GElement).textContent;
    }
    return out;
  }

  /** Internal: apply one style key coming from Preact. */
  __setStyle(key: string, value: unknown): void {
    if (key === 'cssText') {
      this.__style = { ...(HTML_TAG_DEFAULTS[this.localName] ?? {}), ...parseCssText(String(value ?? '')) };
    } else if (value === '' || value == null) {
      delete (this.__style as Record<string, unknown>)[key];
    } else {
      (this.__style as Record<string, unknown>)[key] = normalizeStyleValue(value);
    }
    if (this.__mounted) this.__scope?.markStyleDirty(this);
  }
}

/** The document Preact creates nodes from. */
export class GDocument {
  readonly nodeType = 9;
  activeElement: GElement | null = null;

  createElement(tag: string): GElement {
    return new GElement(this, tag);
  }

  createElementNS(_namespace: string | null, tag: string): GElement {
    return new GElement(this, tag);
  }

  createTextNode(data: unknown): GText {
    return new GText(this, data);
  }

  /** Comments only appear in hydration paths; render them as empty text. */
  createComment(_data: string): GText {
    return new GText(this, '');
  }
}

// ---- helpers ---------------------------------------------------------------

function createStyleFacade(element: GElement): Record<string, unknown> {
  return new Proxy(Object.create(null) as Record<string, unknown>, {
    get(_target, key) {
      if (key === 'setProperty') {
        return (name: string, value: unknown) => element.__setStyle(name, value);
      }
      if (key === 'removeProperty') return (name: string) => element.__setStyle(name, null);
      if (key === 'cssText') return '';
      return typeof key === 'string' ? (element.__style as Record<string, unknown>)[key] : undefined;
    },
    set(_target, key, value) {
      if (typeof key === 'string') element.__setStyle(key, value);
      return true;
    },
  });
}

function normalizeStyleValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const px = PX_NUMBER.exec(value);
  return px ? Number(px[1]) : value;
}

function parseCssText(text: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const declaration of text.split(';')) {
    const at = declaration.indexOf(':');
    if (at < 0) continue;
    const name = declaration.slice(0, at).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const raw = declaration.slice(at + 1).trim();
    if (!name) continue;
    const numeric = Number(raw);
    out[name] = raw !== '' && Number.isFinite(numeric) ? numeric : normalizeStyleValue(raw);
  }
  return out;
}

function serializeProp(value: unknown): object | string | number | boolean | null {
  return serializeCustomProp(value as never) as object | string | number | boolean | null;
}

/** Props built-in `div`/`text` forward to Rust (0.11.0 has no `isUniversalProp`). */
function isUniversalProp(name: string): boolean {
  return UNIVERSAL_PROPS.has(name) || name.startsWith('aria-');
}

function customPropAllowed(element: GElement, name: string): boolean {
  return !BUILT_IN_TYPES.has(element.__type) || isUniversalProp(name);
}

function link(parent: GElement, node: GNode, reference: GNode | null): void {
  node.parentNode = parent;
  if (reference) {
    node.nextSibling = reference;
    node.previousSibling = reference.previousSibling;
    if (reference.previousSibling) reference.previousSibling.nextSibling = node;
    else parent.firstChild = node;
    reference.previousSibling = node;
  } else {
    node.previousSibling = parent.lastChild;
    node.nextSibling = null;
    if (parent.lastChild) parent.lastChild.nextSibling = node;
    else parent.firstChild = node;
    parent.lastChild = node;
  }
}

function unlink(parent: GElement, node: GNode): void {
  if (node.previousSibling) node.previousSibling.nextSibling = node.nextSibling;
  else parent.firstChild = node.nextSibling;
  if (node.nextSibling) node.nextSibling.previousSibling = node.previousSibling;
  else parent.lastChild = node.previousSibling;
  node.parentNode = null;
  node.nextSibling = null;
  node.previousSibling = null;
}

/** Create the native subtree for a node that just became reachable from the root. */
export function mountTree(scope: HostScope, node: GNode): void {
  if (node.__mounted) return;
  node.__scope = scope;
  node.__gid = scope.allocateId();
  node.__mounted = true;
  const { mutations } = scope;
  if (node instanceof GText) {
    mutations.createElement(node.__gid, 'text');
    mutations.setText(node.__gid, node.data);
    return;
  }
  const element = node as GElement;
  mutations.createElement(element.__gid, element.__type);
  if (Object.keys(element.__style).length > 0) mutations.setStyle(element.__gid, { ...element.__style });
  for (const [name, value] of element.__props) {
    if (customPropAllowed(element, name)) {
      mutations.setCustomProp(element.__gid, name, serializeProp(value));
    }
  }
  for (const [nativeType, listener] of element.__listeners) {
    registerEventHandler(scope.eventHandlers, element.__gid, nativeType, listener.native);
    mutations.setEventListener(element.__gid, nativeType, true);
  }
  for (let child = element.firstChild; child; child = child.nextSibling) {
    mountTree(scope, child);
    mutations.appendChild(element.__gid, child.__gid);
  }
}

/** Forget native identity for a subtree whose native root was destroyed. */
export function unmountTree(node: GNode): void {
  if (node.__scope) unregisterEventHandlers(node.__scope.eventHandlers, node.__gid);
  node.__mounted = false;
  node.__gid = 0;
  for (let child = node.firstChild; child; child = child.nextSibling) unmountTree(child);
}
