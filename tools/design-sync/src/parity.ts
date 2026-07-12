/**
 * ParityReport: manifest units vs emitted conversions vs preview cards.
 * This is the fitness-gate artifact — `ok` means every included unit of a
 * card-bearing kind produced both a conversion and a card, and every other
 * included unit was at least consumed (emitted, shimmed, or folded into the
 * CSS closure).
 */
import type { ConversionResult, ParityReport, RegistryUnit, SyncConfig } from './types.ts';

export function buildParity(
  cfg: SyncConfig,
  units: RegistryUnit[],
  conversions: ConversionResult[],
  cardFiles: Map<string, string>,
): ParityReport {
  const convByUnit = new Map(conversions.map((c) => [c.unit, c]));
  const cardUnits = new Set(
    conversions.filter((c) =>
      c.group && c.exportName &&
      cardFiles.has(`components/${c.group}/${c.exportName}/${c.exportName}.html`)
    ).map((c) => c.unit),
  );

  const kinds = [...new Set(units.map((u) => u.item.kind))].sort();
  const rows = kinds.map((kind) => {
    const ofKind = units.filter((u) => u.item.kind === kind);
    const included = ofKind.filter((u) => !u.excluded);
    return {
      kind,
      manifest: ofKind.length,
      converted: included.filter((u) => convByUnit.has(u.item.name)).length,
      cards: included.filter((u) => cardUnits.has(u.item.name)).length,
      excluded: ofKind.length - included.length,
    };
  });

  const missing: string[] = [];
  for (const unit of units) {
    if (unit.excluded) continue;
    const conv = convByUnit.get(unit.item.name);
    if (!conv) {
      missing.push(`${unit.item.name}: no conversion`);
      continue;
    }
    if (conv.errors.length) missing.push(`${unit.item.name}: ${conv.errors.join('; ')}`);
    if (cfg.groups[unit.item.kind] && !cardUnits.has(unit.item.name)) {
      missing.push(`${unit.item.name}: card-bearing kind "${unit.item.kind}" but no card emitted`);
    }
  }

  return {
    rows,
    missing,
    excluded: units.filter((u) => u.excluded).map((u) => ({
      unit: u.item.name,
      reason: u.excluded as string,
    })),
    ok: missing.length === 0,
  };
}
