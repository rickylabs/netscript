/**
 * @component Dropzone
 * @layer 2
 * @depends theme-seed
 * @description File-drop affordance — a dashed drop target with icon, label,
 * hint, and reusable file ingest for drag-drop, focused paste, and picker input.
 */

import type { JSX, VNode } from 'preact';
import { cn } from '../../lib/cn.ts';
import type { Renderable } from '../../lib/public-types.ts';

export const DROPZONE_INGEST_SOURCES = ['drop', 'paste', 'picker'] as const;
export const DROPZONE_REJECTED_REASONS = ['type', 'too-many'] as const;

export type DropzoneIngestSource = typeof DROPZONE_INGEST_SOURCES[number];
export type DropzoneRejectedReason = typeof DROPZONE_REJECTED_REASONS[number];

export interface DropzoneRejectedFile {
  /** File that did not pass Dropzone ingest policy. */
  file: File;
  /** Why the file was rejected. */
  reason: DropzoneRejectedReason;
  /** Ingest source that supplied the file. */
  source: DropzoneIngestSource;
}

export interface DropzoneIngestDetails {
  /** Files accepted after `accept` and `multiple` filtering. */
  acceptedFiles: readonly File[];
  /** Files rejected after `accept` and `multiple` filtering. */
  rejectedFiles: readonly DropzoneRejectedFile[];
  /** Ingest source that supplied the files. */
  source: DropzoneIngestSource;
  /** Original browser event. */
  event: Event;
}

export interface DropzoneProps
  extends
    Omit<JSX.HTMLAttributes<HTMLLabelElement>, 'class' | 'onDrop' | 'onDragOver' | 'onPaste'> {
  /** Primary call-to-action text. */
  label?: string;
  /** Secondary hint (accepted types, size limits). */
  hint?: string;
  /** Leading glyph or icon node. */
  icon?: Renderable;
  /** Active (drag-over) state. */
  active?: boolean;
  /** Typically a visually-hidden <input type="file">. */
  children?: Renderable;
  /** Native accept string applied to drop, paste, and picker ingest. */
  accept?: string;
  /** Whether the dropzone accepts more than one file per ingest event. */
  multiple?: boolean;
  /** Called with the first accepted file for simple single-file consumers. */
  onFile?: (file: File, details: DropzoneIngestDetails) => void;
  /** Called with every accepted file from drop, paste, or picker ingest. */
  onFiles?: (files: readonly File[], details: DropzoneIngestDetails) => void;
  /** Called with every rejected file from drop, paste, or picker ingest. */
  onReject?: (files: readonly DropzoneRejectedFile[], details: DropzoneIngestDetails) => void;
  onDrop?: JSX.DragEventHandler<HTMLLabelElement>;
  onDragOver?: JSX.DragEventHandler<HTMLLabelElement>;
  onPaste?: JSX.ClipboardEventHandler<HTMLLabelElement>;
  class?: string;
}

function filesFromList(list: FileList | readonly File[] | null | undefined): File[] {
  return list ? Array.from(list) : [];
}

function filesFromItems(items: DataTransferItemList | readonly DataTransferItem[] | null): File[] {
  if (!items) return [];
  return Array.from(items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));
}

function filesFromClipboard(data: DataTransfer | null | undefined): File[] {
  const files = filesFromList(data?.files);
  return files.length ? files : filesFromItems(data?.items ?? null);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesGlob(value: string, pattern: string): boolean {
  const source = pattern.split('*').map(escapeRegExp).join('.*');
  return new RegExp(`^${source}$`, 'i').test(value);
}

function acceptsFile(file: File, accept: string | undefined): boolean {
  const tokens = accept?.split(',').map((token) => token.trim()).filter(Boolean) ?? [];
  if (!tokens.length) return true;

  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();

  return tokens.some((token) => {
    const normalized = token.toLowerCase();
    if (normalized.startsWith('.')) {
      return normalized.includes('*')
        ? matchesGlob(fileName, `*${normalized}`)
        : fileName.endsWith(normalized);
    }
    if (normalized.endsWith('/*')) {
      return mimeType.startsWith(normalized.slice(0, -1));
    }
    return normalized.includes('*') ? matchesGlob(mimeType, normalized) : mimeType === normalized;
  });
}

function filterFiles(
  files: readonly File[],
  accept: string | undefined,
  multiple: boolean,
  source: DropzoneIngestSource,
): Pick<DropzoneIngestDetails, 'acceptedFiles' | 'rejectedFiles'> {
  const acceptedByType: File[] = [];
  const rejectedFiles: DropzoneRejectedFile[] = [];

  for (const file of files) {
    if (acceptsFile(file, accept)) {
      acceptedByType.push(file);
    } else {
      rejectedFiles.push({ file, reason: 'type', source });
    }
  }

  if (multiple) return { acceptedFiles: acceptedByType, rejectedFiles };

  const [firstFile, ...extraFiles] = acceptedByType;
  rejectedFiles.push(...extraFiles.map((file) => ({ file, reason: 'too-many' as const, source })));
  return { acceptedFiles: firstFile ? [firstFile] : [], rejectedFiles };
}

function announceIngest(event: Event, details: DropzoneIngestDetails): void {
  if (typeof Element === 'undefined') return;

  const target = event.currentTarget instanceof Element
    ? event.currentTarget
    : event.target instanceof Element
    ? event.target
    : null;
  const host = target instanceof HTMLInputElement ? target.closest('.ns-dropzone') : target;
  const status = host?.querySelector<HTMLElement>('[data-dropzone-status]');
  if (!status) return;

  const acceptedCount = details.acceptedFiles.length;
  const rejectedCount = details.rejectedFiles.length;
  status.textContent = rejectedCount
    ? `${acceptedCount} file${acceptedCount === 1 ? '' : 's'} accepted, ${rejectedCount} rejected.`
    : `${acceptedCount} file${acceptedCount === 1 ? '' : 's'} accepted.`;
}

/**
 * Renders a file drop target with drag, focused paste, and picker ingest.
 */
export function Dropzone(
  {
    label = 'Drop files or click to upload',
    hint,
    icon,
    active,
    class: className,
    children,
    accept,
    multiple = false,
    onFile,
    onFiles,
    onReject,
    onDrop,
    onDragOver,
    onPaste,
    ...props
  }: DropzoneProps,
): VNode {
  function ingestFiles(
    files: readonly File[],
    source: DropzoneIngestSource,
    event: Event,
  ): void {
    if (!files.length) return;
    const filtered = filterFiles(files, accept, multiple, source);
    const details: DropzoneIngestDetails = { ...filtered, source, event };
    announceIngest(event, details);
    if (details.acceptedFiles.length) {
      onFile?.(details.acceptedFiles[0], details);
      onFiles?.(details.acceptedFiles, details);
    }
    if (details.rejectedFiles.length) onReject?.(details.rejectedFiles, details);
  }

  function handleDragOver(event: JSX.TargetedEvent<HTMLLabelElement, DragEvent>): void {
    event.preventDefault();
    onDragOver?.(event);
  }

  function handleDrop(event: JSX.TargetedEvent<HTMLLabelElement, DragEvent>): void {
    event.preventDefault();
    ingestFiles(filesFromList(event.dataTransfer?.files), 'drop', event);
    onDrop?.(event);
  }

  function handlePaste(event: JSX.TargetedEvent<HTMLLabelElement, ClipboardEvent>): void {
    ingestFiles(filesFromClipboard(event.clipboardData), 'paste', event);
    onPaste?.(event);
  }

  function handlePickerChange(event: JSX.TargetedEvent<HTMLInputElement, Event>): void {
    ingestFiles(filesFromList(event.currentTarget.files), 'picker', event);
    event.currentTarget.value = '';
  }

  return (
    <label
      {...props}
      class={cn('ns-dropzone', className)}
      data-active={active ? '' : undefined}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <span class='ns-dropzone__icon' aria-hidden='true'>{icon ?? '↑'}</span>
      <span class='ns-dropzone__label'>{label}</span>
      {hint ? <span class='ns-dropzone__hint'>{hint}</span> : null}
      <input
        class='ns-dropzone__input'
        type='file'
        accept={accept}
        multiple={multiple}
        onChange={handlePickerChange}
      />
      <span class='ns-dropzone__status' aria-live='polite' data-dropzone-status>
        No files selected.
      </span>
      {children}
    </label>
  );
}
