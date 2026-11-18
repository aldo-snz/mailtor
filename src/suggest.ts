import {validateEmail, type ValidateOptions} from './validate.js';
export const DEFAULT_DOMAINS = ['gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'aol.com', 'proton.me'] as const;
// Exact matches are never corrected. This is a guardrail, not an email allowlist.
export const DEFAULT_PROTECTED_DOMAINS: readonly string[] = [...DEFAULT_DOMAINS, 'mail.com'];
export interface SuggestOptions extends ValidateOptions {
  domains?: readonly string[];
  protectedDomains?: readonly string[];
  corrections?: Readonly<Record<string, string>>;
  maxDistance?: 1 | 2;
}
export interface Suggestion { address: string; domain: string; originalDomain: string }
// Bounded Damerau-Levenshtein distance, including adjacent transpositions.
function distance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const rows: number[][] = Array.from({length: a.length + 1}, () => []);
  for (let i = 0; i <= a.length; i++) rows[i]![0] = i;
  for (let j = 0; j <= b.length; j++) rows[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    let minimum = limit + 1;
    for (let j = 1; j <= b.length; j++) {
      let value = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, rows[i - 2]![j - 2]! + 1);
      rows[i]![j] = value;
      minimum = Math.min(minimum, value);
    }
    if (minimum > limit + 1) return limit + 1;
  }
  return rows[a.length]![b.length]!;
}
export function suggestEmail(email: string, options: SuggestOptions = {}): Suggestion | null {
  const validation = validateEmail(email, options);
  if (!validation.valid || !validation.local || !validation.domain) return null;
  const original = validation.domain.toLowerCase();
  // Very short names have too many unrelated neighbors for a useful fuzzy hint.
  // Explicit corrections can still opt in to a reviewed short domain.
  if (DEFAULT_PROTECTED_DOMAINS.includes(original) ||
      (options.protectedDomains ?? []).slice(0, 500).some(domain => typeof domain === 'string' && domain.toLowerCase() === original) ||
      (options.domains ?? []).slice(0, 500).some(domain => typeof domain === 'string' && domain.toLowerCase() === original)) return null;
  // Explicit, reviewed mappings may cross a TLD boundary. Fuzzy matching may not.
  const mapped = options.corrections?.[original];
  if (typeof mapped === 'string') {
    const target = mapped.toLowerCase();
    if (target !== original && validateEmail('x@' + target, options).valid) {
      return {address: validation.local + '@' + target, domain: target, originalDomain: validation.domain};
    }
  }
  if (original.split('.')[0]!.length < 4) return null;
  const domains = options.domains ?? DEFAULT_DOMAINS;
  const limit = options.maxDistance ?? 2;
  let winner: string | null = null;
  const seen = new Set<string>();
  // Configured lists are bounded to keep UI work predictable.
  for (const raw of domains.slice(0, 500)) {
    if (typeof raw !== 'string' || raw.length > 253) continue;
    const candidate = raw.toLowerCase();
    if (!validateEmail('x@' + candidate, options).valid) continue;
    if (candidate === original) return null;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    // A different TLD is too risky to correct, e.g. company.co vs company.com.
    if (candidate.split('.').at(-1) !== original.split('.').at(-1)) continue;
    const d = distance(original, candidate, limit);
    if (d <= limit) {
      // Multiple plausible destinations are ambiguous even if one is closer.
      if (winner) return null;
      winner = candidate;
    }
  }
  if (!winner) return null;
  return {address: validation.local + '@' + winner, domain: winner, originalDomain: validation.domain};
}
