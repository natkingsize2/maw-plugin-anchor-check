#!/usr/bin/env node
import { loadAnchors } from './anchor-loader.js';
import { missionFilter } from './mission-filter.js';
import { goalFilter } from './goal-filter.js';
import { realityFilter } from './reality-filter.js';
import { Reporter } from './reporter.js';

export interface Verdict {
  status: 'pass' | 'warn' | 'block';
  reason: string;
}

export interface CheckReport {
  mission: Verdict;
  goal: Verdict;
  reality: Verdict;
  overall: 'pass' | 'warn' | 'block';
}

export function runCheck(decision: string, anchors?: ReturnType<typeof loadAnchors>): CheckReport {
  const a = anchors ?? loadAnchors();
  const mission = missionFilter(decision, a.mission);
  const goal = goalFilter(decision, a.goal);
  const reality = realityFilter(decision, a.reality);

  const statuses = [mission.status, goal.status, reality.status];
  let overall: 'pass' | 'warn' | 'block';
  if (statuses.some(s => s === 'block')) {
    overall = 'block';
  } else if (statuses.every(s => s === 'pass')) {
    overall = 'pass';
  } else {
    overall = 'warn';
  }

  return { mission, goal, reality, overall };
}

// ── CLI entry point (only runs when executed directly) ──
const isMain = process.argv[1]?.replace(/\\/g, '/').includes('/src/index.');
if (isMain) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: maw anchor-check "<decision>" | --verify HEAD | --show-anchors');
    process.exit(2);
  }

  if (args[0] === '--show-anchors') {
    const a = loadAnchors();
    console.log(Reporter.anchors(a));
    process.exit(0);
  }

  if (args[0] === '--verify') {
    const decision = `Verify: ${args.slice(1).join(' ')}`;
    const report = runCheck(decision);
    console.log(Reporter.text(report));
    process.exit(report.overall === 'pass' ? 0 : report.overall === 'warn' ? 1 : 2);
  }

  const decision = args.join(' ');
  const report = runCheck(decision);
  console.log(Reporter.text(report));
  process.exit(report.overall === 'pass' ? 0 : report.overall === 'warn' ? 1 : 2);
}

// === maw plugin SDK exports ===
export const command = {
  name: "anchor-check",
  description: "Filter decisions/specs against 3 anchors (mission, goal, reality)",
};

export default async function handler(ctx: any) {
  const args = (ctx.args as string[]) ?? [];
  const writer = ctx.writer ?? ((...a: any[]) => console.log(...a));

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    writer("Usage: maw anchor-check <decision text>");
    writer("       maw anchor-check --show-anchors");
    return { ok: true };
  }

  if (args.includes("--show-anchors")) {
    const a = loadAnchors();
    writer(JSON.stringify(a, null, 2));
    return { ok: true };
  }

  const decision = args.filter(a => !a.startsWith("--")).join(" ");
  const report = runCheck(decision);
  // fixed
  writer(Reporter.text(report));
  const exitCode = report.overall === "block" ? 2 : report.overall === "warn" ? 1 : 0;
  return { ok: exitCode <= 1, exitCode };
}
