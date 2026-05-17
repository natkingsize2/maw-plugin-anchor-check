import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

export interface Anchors {
  mission: string;
  goal: string;
  reality: RealityRule[];
}

export interface RealityRule {
  id: string;
  label: string;
  description: string;
}

function expandHome(p: string): string {
  return p.startsWith('~/') ? p.replace('~', homedir()) : p;
}

export function loadAnchors(overrides?: {
  missionPath?: string;
  goalPath?: string;
  realityPath?: string;
}): Anchors {
  const missionPath = overrides?.missionPath ?? '~/.claude/projects/-home-agent/memory/project_mission_statement.md';
  const goalPath = overrides?.goalPath ?? '~/.claude/projects/-home-agent/memory/project_goal_1000_subs_2026.md';
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const realityPath = overrides?.realityPath ?? resolve(__dirname, '..', 'reality-rules.json');

  const resolveOr = (p: string, fallback: string): string => {
    const full = expandHome(p);
    return existsSync(full) ? readFileSync(full, 'utf-8') : fallback;
  };

  const mission = resolveOr(missionPath, 'No mission file found. Default: help people use AI better.');
  const goal = resolveOr(goalPath, 'No goal file found. Default: 1000 subs by 2026-12-31.');
  const realityRaw = resolveOr(realityPath, '[]');

  let reality: RealityRule[];
  try {
    reality = JSON.parse(realityRaw);
  } catch {
    reality = [];
  }

  return { mission, goal, reality };
}
