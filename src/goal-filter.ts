import type { Verdict } from './index.js';

const TARGET_DATE = new Date('2026-12-31T23:59:59Z');

// Expanded signal sets · relaxed rules · favor PASS for legitimate work
const PRODUCT_SIGNALS = ['user', 'subscriber', 'customer', 'member', 'family', 'kid',
  'product', 'feature', 'build', 'ship', 'demo', 'mvp', 'phase',
  'voice', 'robot', 'phone', 'app', 'platform'];

const HARM_SIGNALS = ['exploit', 'attack victim', 'scam', 'phishing', 'crypto mining'];

export function goalFilter(decision: string, _goalText: string): Verdict {
  const lower = decision.toLowerCase();
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((TARGET_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Hard block · clearly anti-goal
  if (HARM_SIGNALS.some(s => lower.includes(s))) {
    return { status: 'block', reason: `Goal BLOCK: harmful pattern detected` };
  }

  // Count product/user signals
  const signals = PRODUCT_SIGNALS.filter(s => lower.includes(s)).length;

  if (signals >= 2) {
    return { status: 'pass', reason: `Goal pass: ${signals} product/user signals · ${daysLeft} days to target` };
  }
  if (signals === 1) {
    return { status: 'pass', reason: `Goal pass: 1 signal (weak) · ${daysLeft} days · accept` };
  }
  return { status: 'warn', reason: `Goal warn: no product/user signals · ${daysLeft} days remaining` };
}
