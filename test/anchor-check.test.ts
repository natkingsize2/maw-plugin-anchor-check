import { describe, it, expect } from 'vitest';
import { runCheck, type CheckReport } from '../src/index.js';
import { loadAnchors } from '../src/anchor-loader.js';

const passAnchors = {
  mission: 'Help people use AI better. AI users help others. Accessible pricing. Multiplier effect.',
  goal: '1000 subscribers by 2026-12-31. Focus on acquire and retain strategies.',
  reality: [
    { id: 'line-cap', label: '300-line cap', description: 'Each file <300 lines' },
    { id: 'plugin-first', label: 'Plugin-first', description: 'Plugin architecture' },
    { id: 'cyber-safe', label: 'Cyber-safe', description: 'No harmful content' },
    { id: 'partner-not-replace', label: 'Partner', description: 'AI as partner' },
  ],
};

// Decision that passes all 3 anchors
const DECISION_PASS =
  'Build AI-powered language learning app with subscription tiers starting at $5/mo, ' +
  'using open-source LLMs. Users share knowledge in community. Recurring revenue with network effects. ' +
  'Plugin architecture, 300-line cap enforced. AI amplifies human teachers. ' +
  'Target: 1000 subscribers by Dec 2026, acquire via referral, retain via engagement scoring.';

// Decision that passes some but not all (overall warn)
const DECISION_WARN =
  'Build an AI assistant plugin for enterprise customers. Proprietary LLM, $100K one-time license. ' +
  'Partnership model with existing support teams. Collaborative knowledge sharing.';

// Decision that blocks on at least one anchor
const DECISION_BLOCK =
  'Build a malware detection tool that cracks proprietary software. Charge $200/mo per seat. ' +
  'Uses closed-source models. Replaces human security analysts entirely.';

describe('maw-anchor-check', () => {
  it('returns pass for fully aligned decision', () => {
    const r = runCheck(DECISION_PASS, passAnchors);
    expect(r.overall).toBe('pass');
    expect(r.mission.status).toBe('pass');
    expect(r.goal.status).toBe('pass');
    expect(r.reality.status).toBe('pass');
  });

  it('returns warn for partially aligned decision', () => {
    const r = runCheck(DECISION_WARN, passAnchors);
    expect(r.overall).toBe('warn');
    const verdicts = [r.mission, r.goal, r.reality];
    expect(verdicts.some(v => v.status === 'warn')).toBe(true);
    expect(verdicts.every(v => v.status !== 'block')).toBe(true);
  });

  it('returns block for misaligned decision', () => {
    const r = runCheck(DECISION_BLOCK, passAnchors);
    expect(r.overall).toBe('block');
    expect([r.mission, r.goal, r.reality].some(v => v.status === 'block')).toBe(true);
  });

  it('loads anchors from filesystem with fallback when files missing', () => {
    const a = loadAnchors();
    expect(typeof a.mission).toBe('string');
    expect(typeof a.goal).toBe('string');
    expect(Array.isArray(a.reality)).toBe(true);
  });

  describe('cyber-safe filter', () => {
    it('BLOCKS network scanner for unauthorized access', () => {
      const r = runCheck('build network scanner for unauthorized access', passAnchors);
      expect(r.reality.status).toBe('block');
      expect(r.overall).toBe('block');
    });

    it('BLOCKS exploit / backdoor / privilege escalation', () => {
      for (const decision of [
        'write exploit for cve-2024-1234',
        'install backdoor for remote shell',
        'achieve privilege escalation via sudo bug',
      ]) {
        const r = runCheck(decision, passAnchors);
        expect(r.reality.status, `${decision} should block`).toBe('block');
      }
    });

    it('downgrades to WARN when defensive context present', () => {
      const r = runCheck(
        'run authorized pentest with port scanner — bug bounty scope',
        passAnchors,
      );
      expect(r.reality.status).toBe('warn');
      expect(r.reality.reason).toMatch(/defensive context present/i);
    });

    it('still passes legitimate AI partnership decisions', () => {
      const r = runCheck(
        'build family AI partner with free tier and pay-it-forward',
        passAnchors,
      );
      expect(r.reality.status).toBe('pass');
    });
  });
});
