import { validateEmail } from './validate.js';
export const DEFAULT_DOMAINS = ['gmail.com', 'googlemail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com', 'aol.com', 'proton.me'];
// Bounded Damerau-Levenshtein distance, including adjacent transpositions.
function distance(a, b, limit) {
    if (Math.abs(a.length - b.length) > limit)
        return limit + 1;
    const rows = Array.from({ length: a.length + 1 }, () => []);
    for (let i = 0; i <= a.length; i++)
        rows[i][0] = i;
    for (let j = 0; j <= b.length; j++)
        rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        let minimum = limit + 1;
        for (let j = 1; j <= b.length; j++) {
            let value = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
                value = Math.min(value, rows[i - 2][j - 2] + 1);
            rows[i][j] = value;
            minimum = Math.min(minimum, value);
        }
        if (minimum > limit + 1)
            return limit + 1;
    }
    return rows[a.length][b.length];
}
export function suggestEmail(email, options = {}) {
    const validation = validateEmail(email, options);
    if (!validation.valid || !validation.local || !validation.domain)
        return null;
    const original = validation.domain.toLowerCase();
    const domains = options.domains ?? DEFAULT_DOMAINS;
    const limit = options.maxDistance ?? 2;
    let best = limit + 1;
    let winner = null;
    let ambiguous = false;
    // Configured lists are bounded to keep UI work predictable.
    for (const raw of domains.slice(0, 500)) {
        if (typeof raw !== 'string' || raw.length > 253)
            continue;
        const candidate = raw.toLowerCase();
        if (!validateEmail('x@' + candidate, options).valid)
            continue;
        if (candidate === original)
            return null;
        // A different TLD is too risky to correct, e.g. company.co vs company.com.
        if (candidate.split('.').at(-1) !== original.split('.').at(-1))
            continue;
        const d = distance(original, candidate, limit);
        if (d < best) {
            best = d;
            winner = candidate;
            ambiguous = false;
        }
        else if (d === best && candidate !== winner)
            ambiguous = true;
    }
    if (!winner || best > limit || ambiguous)
        return null;
    return { address: validation.local + '@' + winner, domain: winner, originalDomain: validation.domain };
}
