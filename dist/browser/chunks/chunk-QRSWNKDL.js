// src/validate.ts
var encoder = new TextEncoder();
var localChars = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~.]+$/;
var asciiLabel = /^[A-Za-z0-9-]+$/;
var unicodeLabel = /^[\p{L}\p{N}-]+$/u;
function validateEmail(email, options = {}) {
  const errors = [];
  const warnings = [];
  const result = (local2, domain2) => ({ valid: errors.length === 0, errors, warnings, local: local2, domain: domain2 });
  if (typeof email !== "string" || email.length === 0) {
    errors.push("EMPTY");
    return result(null, null);
  }
  if (email.length > 1024) {
    errors.push("TOO_LONG");
    return result(null, null);
  }
  const at = email.indexOf("@");
  if (at < 0 || at !== email.lastIndexOf("@")) {
    errors.push("AT_SIGN");
    return result(null, null);
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local) errors.push("LOCAL_EMPTY");
  if (!domain) errors.push("DOMAIN_EMPTY");
  if (!local || !domain) return result(local, domain);
  if (local.startsWith('"') || local.includes('"')) errors.push("UNSUPPORTED_QUOTED");
  else if (/[\u0080-\uFFFF]/u.test(local)) errors.push("UNSUPPORTED_UNICODE_LOCAL");
  else if (!localChars.test(local)) errors.push("LOCAL_CHARACTER");
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) errors.push("LOCAL_DOT");
  if (encoder.encode(local).length > 64) errors.push("LOCAL_TOO_LONG");
  if (domain.startsWith("[") || domain.endsWith("]")) errors.push("UNSUPPORTED_DOMAIN_LITERAL");
  let canonical = domain.toLowerCase();
  if (/[\u0080-\uFFFF]/u.test(domain)) {
    if (!options.allowUnicodeDomain) errors.push("DOMAIN_LABEL");
    else {
      warnings.push("IDN_DOMAIN");
      try {
        canonical = new URL("http://" + domain).hostname;
      } catch {
        errors.push("DOMAIN_LABEL");
      }
    }
  }
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) errors.push("DOMAIN_DOT");
  const labels = domain.split(".");
  if (labels.length === 1) {
    if (options.requireTld !== false) errors.push("DOMAIN_TLD");
    else warnings.push("SINGLE_LABEL_DOMAIN");
  }
  for (const label of labels) {
    if (encoder.encode(label).length > 63) errors.push("DOMAIN_LABEL_TOO_LONG");
    if (!label || label.startsWith("-") || label.endsWith("-") || !(options.allowUnicodeDomain ? unicodeLabel : asciiLabel).test(label)) errors.push("DOMAIN_LABEL");
  }
  if (labels.length > 1 && (labels.at(-1)?.length ?? 0) < 2) errors.push("DOMAIN_TLD");
  if (encoder.encode(canonical).length > 253) errors.push("DOMAIN_TOO_LONG");
  if (encoder.encode(email).length > 254) errors.push("TOO_LONG");
  return result(local, domain);
}

// src/suggest.ts
var DEFAULT_DOMAINS = ["gmail.com", "googlemail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com", "aol.com", "proton.me"];
var DEFAULT_PROTECTED_DOMAINS = [...DEFAULT_DOMAINS, "mail.com"];
function distance(a, b, limit) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  const rows = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) rows[i][0] = i;
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let minimum = limit + 1;
    for (let j = 1; j <= b.length; j++) {
      let value = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, rows[i - 2][j - 2] + 1);
      rows[i][j] = value;
      minimum = Math.min(minimum, value);
    }
    if (minimum > limit + 1) return limit + 1;
  }
  return rows[a.length][b.length];
}
function suggestEmail(email, options = {}) {
  const validation = validateEmail(email, options);
  if (!validation.valid || !validation.local || !validation.domain) return null;
  const original = validation.domain.toLowerCase();
  if (DEFAULT_PROTECTED_DOMAINS.includes(original) || (options.protectedDomains ?? []).slice(0, 500).some((domain) => typeof domain === "string" && domain.toLowerCase() === original) || (options.domains ?? []).slice(0, 500).some((domain) => typeof domain === "string" && domain.toLowerCase() === original)) return null;
  const mapped = options.corrections?.[original];
  if (typeof mapped === "string") {
    const target = mapped.toLowerCase();
    if (target !== original && validateEmail("x@" + target, options).valid) {
      return { address: validation.local + "@" + target, domain: target, originalDomain: validation.domain };
    }
  }
  if (original.split(".")[0].length < 4) return null;
  const domains = options.domains ?? DEFAULT_DOMAINS;
  const limit = options.maxDistance ?? 2;
  let winner = null;
  const seen = /* @__PURE__ */ new Set();
  for (const raw of domains.slice(0, 500)) {
    if (typeof raw !== "string" || raw.length > 253) continue;
    const candidate = raw.toLowerCase();
    if (!validateEmail("x@" + candidate, options).valid) continue;
    if (candidate === original) return null;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    if (candidate.split(".").at(-1) !== original.split(".").at(-1)) continue;
    const d = distance(original, candidate, limit);
    if (d <= limit) {
      if (winner) return null;
      winner = candidate;
    }
  }
  if (!winner) return null;
  return { address: validation.local + "@" + winner, domain: winner, originalDomain: validation.domain };
}

// src/analyze.ts
function analyzeEmail(email, options = {}) {
  const validation = validateEmail(email, options);
  return { ...validation, suggestion: validation.valid ? suggestEmail(email, options) : null };
}

export {
  validateEmail,
  DEFAULT_DOMAINS,
  DEFAULT_PROTECTED_DOMAINS,
  suggestEmail,
  analyzeEmail
};
