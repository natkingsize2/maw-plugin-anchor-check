import type { Verdict } from './index.js';
import type { RealityRule } from './anchor-loader.js';

// Hard-block offensive-security intent · keywords AND intent verbs
const CYBER_SAFE_BLOCK = [
  // Tools / payloads
  'malware', 'ransomware', 'spyware', 'rootkit', 'trojan', 'worm', 'botnet',
  'keylogger', 'stealer', 'rat tool', 'c2 server', 'command and control',
  'exploit', 'zero-day', '0day', 'cve-', 'shellcode', 'payload',
  'hack tool', 'crack', 'keygen', 'ddos tool', 'phishing kit',
  'credential harvest', 'credential stuffing', 'password cracker',
  'backdoor', 'rootkit',
  // Offensive intent + targets
  'unauthorized access', 'unauthorized entry',
  'bypass authentication', 'bypass auth', 'bypass mfa', 'bypass 2fa',
  'privilege escalation', 'lateral movement', 'persistence mechanism',
  'session hijack', 'token theft', 'cookie theft',
  'sql injection', 'xss attack', 'csrf attack', 'rce exploit',
  'man-in-the-middle attack', 'mitm attack',
  'network scanner', 'port scanner', 'vuln scanner', 'vulnerability scanner',
  // Allow defensive framing only if "defensive" / "authorized" present (handled below)
];

const DEFENSIVE_CONTEXT = [
  'defensive', 'authorized', 'penetration test', 'pentest', 'red team',
  'bug bounty', 'responsible disclosure', 'security audit',
  'with permission', 'on own', 'with consent',
];

const PARTNER_KEYWORDS = [
  'partner', 'amplif', 'augment', 'assist', 'copilot', 'together',
  'human+ai', 'collaborat', 'family', 'help', 'support',
  // Thai variants
  'ช่วย', 'ครอบครัว', 'ร่วม', 'เพื่อน',
];

export function realityFilter(decision: string, _rules: RealityRule[]): Verdict {
  const lower = decision.toLowerCase();

  const matchedBlock = CYBER_SAFE_BLOCK.filter(k => lower.includes(k));
  if (matchedBlock.length > 0) {
    const hasDefensiveContext = DEFENSIVE_CONTEXT.some(k => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower));
    if (!hasDefensiveContext) {
      return {
        status: 'block',
        reason: `Reality BLOCK: cyber-unsafe (${matchedBlock.slice(0, 3).join(', ')}) · add defensive context (e.g. "authorized pentest") if intent is legitimate`,
      };
    }
    // Defensive context present — downgrade to warn so user double-checks
    return {
      status: 'warn',
      reason: `Reality WARN: offensive-security keywords (${matchedBlock.slice(0, 3).join(', ')}) found but defensive context present · verify scope`,
    };
  }

  // Soft check · partner framing (just warn if missing · don't block)
  const partner = PARTNER_KEYWORDS.some(k => lower.includes(k));
  if (partner) {
    return { status: 'pass', reason: 'Reality pass: partner framing present · cyber-safe' };
  }
  return { status: 'pass', reason: 'Reality pass: cyber-safe (partner framing soft · OK)' };
}
