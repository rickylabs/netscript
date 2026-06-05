import { outputText } from '../../../presentation/output/default-output.ts';
/**
 * @module shared/infra/deploy/install
 *
 * File sync and XML path helpers for Windows deployment install/copy flows.
 */

import { exists } from '@std/fs';
import { green, yellow } from '@std/fmt/colors';
import { join } from '@std/path';

function getXmlValue(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}

function extractInstallDirFromXml(xml: string): string | null {
  const exePath = getXmlValue(xml, 'ExecutablePath');
  if (!exePath) return null;
  const match = exePath.match(/^(.+?)\\bin\\[^\\]+$/);
  return match ? match[1] : null;
}

/** Sync deployment artifacts to the install directory. */
export async function syncDeployToInstallDir(
  sourceDir: string,
  installDir: string,
  verbose: boolean,
): Promise<{ copied: number; skipped: number; failed: number }> {
  outputText(`📦 Syncing files to install location...`);
  outputText(`   Source:  ${sourceDir}`);
  outputText(`   Target:  ${installDir}`);
  outputText('');

  await Deno.mkdir(installDir, { recursive: true });

  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for (const dir of ['bin', 'config', 'logs', 'runtime', 'scripts']) {
    const srcPath = join(sourceDir, dir);
    if (await exists(srcPath)) {
      const dstPath = join(installDir, dir);
      const result = await syncDir(srcPath, dstPath, verbose);
      copied += result.copied;
      skipped += result.skipped;
      failed += result.failed;
    }
  }

  for (const fileName of ['.env', '.env.template']) {
    const src = join(sourceDir, fileName);
    const dst = join(installDir, fileName);
    if (await exists(src)) {
      if (await shouldCopyFile(src, dst)) {
        if (verbose) outputText(`   📄 Syncing ${fileName}...`);
        try {
          await Deno.copyFile(src, dst);
          copied++;
        } catch {
          if (verbose) outputText(`   ${yellow('⚠')} Skipped ${fileName} (locked)`);
          failed++;
        }
      } else {
        skipped++;
      }
    }
  }

  const manifestSrc = join(sourceDir, 'config', 'services.json');
  const manifestDst = join(installDir, 'services.json');
  if (await exists(manifestSrc)) {
    if (await shouldCopyFile(manifestSrc, manifestDst)) {
      if (verbose) outputText(`   📄 Syncing services.json...`);
      try {
        await Deno.copyFile(manifestSrc, manifestDst);
        copied++;
      } catch {
        if (verbose) outputText(`   ${yellow('⚠')} Skipped services.json (locked)`);
        failed++;
      }
    } else {
      skipped++;
    }
  }

  if (copied > 0) {
    outputText(
      `   ${green('✓')} Synced ${copied} file(s)${skipped > 0 ? `, ${skipped} unchanged` : ''}`,
    );
  } else {
    outputText(`   ✓ All ${skipped} file(s) up to date`);
  }
  if (failed > 0) {
    outputText(
      `   ${yellow('⚠')} ${failed} file(s) locked (stop services first to update binaries)`,
    );
  }
  outputText('');

  return { copied, skipped, failed };
}

/** Check whether a source file should be copied to the destination. */
export async function shouldCopyFile(src: string, dst: string): Promise<boolean> {
  try {
    const [srcStat, dstStat] = await Promise.all([Deno.stat(src), Deno.stat(dst)]);
    if (srcStat.size !== dstStat.size) return true;
    if (srcStat.mtime && dstStat.mtime && srcStat.mtime > dstStat.mtime) return true;
    return false;
  } catch {
    return true;
  }
}

/** Recursively sync a directory. */
export async function syncDir(
  src: string,
  dst: string,
  verbose: boolean,
): Promise<{ copied: number; skipped: number; failed: number }> {
  await Deno.mkdir(dst, { recursive: true });
  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for await (const entry of Deno.readDir(src)) {
    const srcPath = join(src, entry.name);
    const dstPath = join(dst, entry.name);
    if (entry.isDirectory) {
      const sub = await syncDir(srcPath, dstPath, verbose);
      copied += sub.copied;
      skipped += sub.skipped;
      failed += sub.failed;
    } else if (entry.isFile) {
      if (await shouldCopyFile(srcPath, dstPath)) {
        try {
          await Deno.copyFile(srcPath, dstPath);
          if (verbose) outputText(`   📄 ${entry.name}`);
          copied++;
        } catch {
          if (verbose) outputText(`   ${yellow('⚠')} ${entry.name} (locked, skipped)`);
          failed++;
        }
      } else {
        skipped++;
      }
    }
  }

  return { copied, skipped, failed };
}

/** Update all XML config files to point to the install directory. */
export async function updateXmlPaths(
  configDir: string,
  installDir: string,
  serviceNames: string[],
  verbose: boolean,
): Promise<number> {
  outputText('📝 Verifying XML config paths...');

  let xmlUpdated = 0;

  for (const name of serviceNames) {
    const xmlPath = join(configDir, `${name}.xml`);
    if (!(await exists(xmlPath))) continue;

    let content = await Deno.readTextFile(xmlPath);
    const currentPath = extractInstallDirFromXml(content);

    if (currentPath && currentPath !== installDir) {
      if (verbose) {
        outputText(`   ${name}.xml: updating paths ${currentPath} → ${installDir}`);
      }
      const sourcePattern = currentPath.replace(/\\/g, '\\\\');
      content = content.replace(new RegExp(sourcePattern, 'g'), installDir);
      await Deno.writeTextFile(xmlPath, content);
      xmlUpdated++;
    }
  }

  if (xmlUpdated === 0) {
    outputText('   ✓ All XML paths already correct');
  } else {
    outputText(`   ✓ Updated ${xmlUpdated} XML file(s)`);
  }
  outputText('');

  return xmlUpdated;
}
