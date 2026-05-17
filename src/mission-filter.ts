import type { Verdict } from './index.js';

// Expanded keyword sets · cover Thai + English + semantic variants
const Q1_KEYWORDS = ['ai', 'llm', 'learn', 'open source', 'knowledge', 'skill', 'capability',
  'voice', 'robot', 'assistant', 'agent', 'phone', 'app', 'tool', 'family',
  'เรียน', 'สอน', 'ทักษะ', 'พัฒนา'];
const Q2_KEYWORDS = ['share', 'refer', 'teach', 'mentor', 'community', 'collaborat', 'together',
  'help', 'family', 'friend', 'partner', 'serve', 'human', 'people', 'user',
  'ครอบครัว', 'เพื่อน', 'ช่วย', 'มนุษย์', 'คน'];
const Q3_KEYWORDS = ['afford', 'low cost', 'scale', 'subscription', 'free', 'accessible', 'budget',
  'cheap', 'thai', 'local', 'open', 'mvp',
  'ราคา', 'เข้าถึง', 'ฟรี', 'ไทย'];
const Q4_KEYWORDS = ['multiplier', 'compound', 'recurring', 'network', 'viral', 'exponential', 'leverage',
  'family', 'kids', 'children', 'phase', 'venture', 'product',
  'ขยาย', 'เพิ่ม', 'ทวีคูณ'];

// Anti-pattern · explicit mission violations
const HARM_KEYWORDS = ['exploit', 'malware', 'attack', 'scam', 'phishing', 'crypto mining',
  'spam', 'harvest credentials', 'offensive', 'hack into', 'bypass auth'];

function scoreKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter(k => lower.includes(k)).length;
}

export function missionFilter(decision: string, _missionText: string): Verdict {
  const lower = decision.toLowerCase();

  // Hard block · harm patterns
  const harm = scoreKeywords(decision, HARM_KEYWORDS);
  if (harm > 0) {
    return { status: 'block', reason: `Mission BLOCK: harmful pattern detected` };
  }

  const q1 = scoreKeywords(decision, Q1_KEYWORDS);
  const q2 = scoreKeywords(decision, Q2_KEYWORDS);
  const q3 = scoreKeywords(decision, Q3_KEYWORDS);
  const q4 = scoreKeywords(decision, Q4_KEYWORDS);
  const total = q1 + q2 + q3 + q4;

  // Mission requires AI (Q1/Q2) AND access-or-multiplier (Q3 OR Q4)
  // Without Q3/Q4 we have an AI product without the mission's compound pillar
  if (total === 0) {
    return { status: 'warn', reason: 'Mission warn: no mission keywords matched · review' };
  }
  if (total >= 2 && (q3 + q4) >= 1) {
    return { status: 'pass', reason: `Mission pass: ${total} signals (Q1=${q1} Q2=${q2} Q3=${q3} Q4=${q4})` };
  }
  if (total >= 2) {
    return {
      status: 'warn',
      reason: `Mission warn: ${total} signals but missing access/multiplier pillar (Q3=${q3} Q4=${q4}) · add scale/affordability or compound effect`,
    };
  }
  return { status: 'warn', reason: `Mission warn: weak signal (only ${total} keyword) · clarify` };
}
