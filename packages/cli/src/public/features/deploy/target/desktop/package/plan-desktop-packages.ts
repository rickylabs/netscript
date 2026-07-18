/** Pure native desktop package invocation planner. */

import { extname, resolve } from '@std/path';
import {
  DENO_DESKTOP_TARGETS,
  type DesktopPackageInvocation,
  DesktopPackageError,
  type DesktopPackagePlanRequest,
  type DesktopPackageTarget,
  type NativePackageFormat,
} from './desktop-package-contract.ts';

const FORMAT_EXTENSIONS: Readonly<Record<NativePackageFormat, string>> = {
  app: '.app',
  dmg: '.dmg',
  appimage: '.AppImage',
  deb: '.deb',
  rpm: '.rpm',
  msi: '.msi',
};

function safeArtifactPart(value: string, label: string): string {
  const part = value.trim().replaceAll(/[^A-Za-z0-9._-]+/g, '-').replaceAll(/^-+|-+$/g, '');
  if (part.length === 0) {
    throw new DesktopPackageError('invalid-input', `${label} must contain a filename-safe value.`);
  }
  return part;
}

function resolveSelectedTargets(request: DesktopPackagePlanRequest): readonly DesktopPackageTarget[] {
  if (request.target !== undefined && request.allTargets === true) {
    throw new DesktopPackageError(
      'invalid-input',
      '--target and --all-targets are mutually exclusive.',
    );
  }

  if (request.allTargets === true) {
    return DENO_DESKTOP_TARGETS;
  }

  if (request.target !== undefined) {
    const target = DENO_DESKTOP_TARGETS.find((candidate) => candidate.triple === request.target);
    if (target === undefined) {
      throw new DesktopPackageError(
        'unsupported-target',
        `Unsupported Deno Desktop target "${request.target}".`,
      );
    }
    return [target];
  }

  const current = DENO_DESKTOP_TARGETS.find((candidate) =>
    candidate.os === request.currentTarget.os && candidate.arch === request.currentTarget.arch
  );
  if (current === undefined) {
    throw new DesktopPackageError(
      'unsupported-target',
      `Current target ${request.currentTarget.os}-${request.currentTarget.arch} is unsupported.`,
    );
  }
  return [current];
}

function selectedFormats(
  target: DesktopPackageTarget,
  requested: readonly NativePackageFormat[] | undefined,
): readonly NativePackageFormat[] {
  if (requested === undefined || requested.length === 0) return target.formats;
  return requested.filter((format) => target.formats.includes(format));
}

/** Build deterministic explicit-target invocations for a native package request. */
export function planDesktopPackages(
  request: DesktopPackagePlanRequest,
): readonly DesktopPackageInvocation[] {
  const targets = resolveSelectedTargets(request);
  const requestedFormats = request.formats === undefined ? undefined : [...new Set(request.formats)];
  const invocations: DesktopPackageInvocation[] = [];
  const appName = safeArtifactPart(request.appName, 'App name');
  const version = safeArtifactPart(request.version, 'App version');
  const taskName = request.packageTaskName.trim();

  if (taskName.length === 0) {
    throw new DesktopPackageError('invalid-input', 'Desktop package task name cannot be empty.');
  }

  for (const target of targets) {
    for (const format of selectedFormats(target, requestedFormats)) {
      if (format === 'dmg' && request.hostOperatingSystem !== target.os) {
        throw new DesktopPackageError(
          'host-format-mismatch',
          'Building a .dmg requires a macOS host because Deno Desktop invokes hdiutil.',
        );
      }

      const outputPath = resolve(
        request.outputDir,
        `${appName}-${version}-${target.os}-${target.arch}${FORMAT_EXTENSIONS[format]}`,
      );
      const args = ['task', taskName, '--target', target.triple];
      if (request.compression !== 'none') args.push(`--compress=${request.compression}`);
      args.push('-o', outputPath);

      invocations.push({
        command: 'deno',
        args,
        cwd: request.workdir,
        outputPath,
        target,
        format,
      });
    }
  }

  if (invocations.length === 0) {
    const requested = requestedFormats?.join(', ') ?? '(default formats)';
    throw new DesktopPackageError(
      'unsupported-format',
      `None of the requested formats (${requested}) support the selected target set.`,
    );
  }

  for (const format of requestedFormats ?? []) {
    if (!invocations.some((invocation) => invocation.format === format)) {
      throw new DesktopPackageError(
        'unsupported-format',
        `Format "${format}" is incompatible with the selected target set.`,
      );
    }
  }

  const outputs = new Set(invocations.map((invocation) => invocation.outputPath));
  if (outputs.size !== invocations.length) {
    throw new DesktopPackageError('invalid-input', 'Desktop package outputs must be unique.');
  }
  if ([...outputs].some((path) => extname(path).length === 0)) {
    throw new DesktopPackageError('invalid-input', 'Every desktop package requires an extension.');
  }

  return invocations;
}
