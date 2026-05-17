import type { Anchors } from './anchor-loader.js';
import type { CheckReport } from './index.js';

const STATUS_ICON: Record<string, string> = { pass: '✅', warn: '⚠️ ', block: '❌' };

export const Reporter = {
  text(report: CheckReport): string {
    const lines: string[] = [];
    lines.push('── maw anchor-check ──');
    lines.push('');
    lines.push(`  Mission: ${STATUS_ICON[report.mission.status]} ${report.mission.reason}`);
    lines.push(`  Goal:    ${STATUS_ICON[report.goal.status]} ${report.goal.reason}`);
    lines.push(`  Reality: ${STATUS_ICON[report.reality.status]} ${report.reality.reason}`);
    lines.push('');
    lines.push(`  Overall: ${STATUS_ICON[report.overall]} ${report.overall.toUpperCase()}`);
    return lines.join('\n');
  },

  anchors(a: Anchors): string {
    const lines: string[] = [];
    lines.push('── Anchors ──');
    lines.push('');
    lines.push('Mission:');
    lines.push(indent(a.mission, 2));
    lines.push('');
    lines.push('Goal:');
    lines.push(indent(a.goal, 2));
    lines.push('');
    lines.push('Reality rules:');
    for (const r of a.reality) {
      lines.push(`  - ${r.label}: ${r.description}`);
    }
    return lines.join('\n');
  },
};

function indent(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text.split('\n').map(l => `${pad}${l}`).join('\n');
}
