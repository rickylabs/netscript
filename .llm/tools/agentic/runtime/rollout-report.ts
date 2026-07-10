/** Human rollout report renderer for a validated canary outcome. */

import type { RolloutOutcome } from './rollout-canary.ts';

function escapeCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

/** Renders the human outcome from the same matrix used for machine decisions. */
export function renderRolloutReport(outcome: RolloutOutcome): string {
  const rows = outcome.canaries.map((row) =>
    `| \`${row.id}\` | ${row.status} | \`${row.classification}\` | ${row.evidenceMode} | ${
      escapeCell(row.actual)
    } |`
  ).join('\n');
  const details = outcome.canaries.map((row, index) =>
    [
      `### ${index + 1}. \`${row.id}\``,
      '',
      `- Reproduce: \`${row.command.replaceAll('`', '\\`')}\``,
      `- Expected: ${row.expected}`,
      `- Actual: ${row.actual}`,
      `- Evidence: ${row.evidence.summary}`,
      `- Classification: \`${row.classification}\` (${row.status}, ${row.evidenceMode})`,
      `- References: ${row.evidence.references?.join(', ') || 'none'}`,
      `- Residual risks: ${row.residualRisks.join('; ') || 'none'}`,
    ].join('\n')
  ).join('\n\n');
  return [
    '# Agentic runtime rollout outcome',
    '',
    `Generated from schema \`${outcome.schemaVersion}\` at ${outcome.generatedAt}. Baseline: \`${outcome.baseline}\`.`,
    '',
    '## Executive outcome',
    '',
    `Overall status: **${outcome.overallStatus}**. Promotion recommendation: **${outcome.promotionRecommendation}**.`,
    '',
    outcome.promotionBoundary,
    '',
    '| Canary | Status | Classification | Evidence mode | Actual outcome |',
    '| --- | --- | --- | --- | --- |',
    rows,
    '',
    '## Canary evidence',
    '',
    details,
    '',
    '## Residual risks',
    '',
    ...outcome.residualRisks.map((risk) => `- ${risk}`),
    '',
    '## Rollback status',
    '',
    `Status: \`${outcome.rollbackStatus}\`. PR #584 documents the proven native Windows Claude break-glass and restoration of native-provider defaults. This rollout does not execute rollback.`,
    '',
    '## Privacy and evidence handling',
    '',
    'The checked-in artifacts contain bounded summaries, exit codes, classifications, and repository/PR references only. Raw command output, credentials, account identity, host identity, and mobile session payloads are not persisted.',
    '',
    '## Promotion recommendation',
    '',
    outcome.promotionRecommendation === 'promote_with_conditions'
      ? 'Recommend promotion with conditions: the owner must explicitly accept the recorded interactive/auth/credential residual risks, and the Claude coordinator must perform the promotion. This report performs no promotion action.'
      : outcome.promotionRecommendation === 'promote'
      ? 'Recommend promotion after explicit owner approval and coordinator action. This report performs no promotion action.'
      : 'Do not promote until every failed canary is remediated and rerun. This report performs no promotion action.',
    '',
  ].join('\n');
}
