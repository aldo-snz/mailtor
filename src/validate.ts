export type EmailErrorCode = 'EMPTY' | 'TOO_LONG' | 'AT_SIGN' | 'LOCAL_EMPTY' | 'DOMAIN_EMPTY' | 'LOCAL_TOO_LONG' | 'DOMAIN_TOO_LONG' | 'LOCAL_DOT' | 'LOCAL_CHARACTER' | 'DOMAIN_DOT' | 'DOMAIN_LABEL' | 'DOMAIN_LABEL_TOO_LONG' | 'DOMAIN_TLD' | 'UNSUPPORTED_QUOTED' | 'UNSUPPORTED_UNICODE_LOCAL' | 'UNSUPPORTED_DOMAIN_LITERAL';
export type EmailWarningCode = 'IDN_DOMAIN' | 'SINGLE_LABEL_DOMAIN';
export interface ValidateOptions { allowUnicodeDomain?: boolean; requireTld?: boolean }
export interface ValidationResult { valid: boolean; errors: EmailErrorCode[]; warnings: EmailWarningCode[]; local: string | null; domain: string | null }
const encoder = new TextEncoder();
const localChars = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~.]+$/;
const asciiLabel = /^[A-Za-z0-9-]+$/;
const unicodeLabel = /^[\p{L}\p{N}-]+$/u;

export function validateEmail(email: string, options: ValidateOptions = {}): ValidationResult {
  const errors: EmailErrorCode[] = [];
  const warnings: EmailWarningCode[] = [];
  const result = (local: string | null, domain: string | null): ValidationResult => ({valid: errors.length === 0, errors, warnings, local, domain});
  if (typeof email !== 'string' || email.length === 0) { errors.push('EMPTY'); return result(null, null); }
  // Cap before any expensive work, including UTF-8 encoding and IDN conversion.
  if (email.length > 1024) { errors.push('TOO_LONG'); return result(null, null); }
  const at = email.indexOf('@');
  if (at < 0 || at !== email.lastIndexOf('@')) { errors.push('AT_SIGN'); return result(null, null); }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local) errors.push('LOCAL_EMPTY');
  if (!domain) errors.push('DOMAIN_EMPTY');
  if (!local || !domain) return result(local, domain);
  if (local.startsWith('"') || local.includes('"')) errors.push('UNSUPPORTED_QUOTED');
  else if (/[\u0080-\uFFFF]/u.test(local)) errors.push('UNSUPPORTED_UNICODE_LOCAL');
  else if (!localChars.test(local)) errors.push('LOCAL_CHARACTER');
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) errors.push('LOCAL_DOT');
  if (encoder.encode(local).length > 64) errors.push('LOCAL_TOO_LONG');
  if (domain.startsWith('[') || domain.endsWith(']')) errors.push('UNSUPPORTED_DOMAIN_LITERAL');
  let canonical = domain.toLowerCase();
  if (/[\u0080-\uFFFF]/u.test(domain)) {
    if (!options.allowUnicodeDomain) errors.push('DOMAIN_LABEL');
    else {
      warnings.push('IDN_DOMAIN');
      try { canonical = new URL('http://' + domain).hostname; }
      catch { errors.push('DOMAIN_LABEL'); }
    }
  }
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..')) errors.push('DOMAIN_DOT');
  const labels = domain.split('.');
  if (labels.length === 1) {
    if (options.requireTld !== false) errors.push('DOMAIN_TLD');
    else warnings.push('SINGLE_LABEL_DOMAIN');
  }
  for (const label of labels) {
    if (encoder.encode(label).length > 63) errors.push('DOMAIN_LABEL_TOO_LONG');
    if (!label || label.startsWith('-') || label.endsWith('-') || !(options.allowUnicodeDomain ? unicodeLabel : asciiLabel).test(label)) errors.push('DOMAIN_LABEL');
  }
  if (labels.length > 1 && (labels.at(-1)?.length ?? 0) < 2) errors.push('DOMAIN_TLD');
  if (encoder.encode(canonical).length > 253) errors.push('DOMAIN_TOO_LONG');
  if (encoder.encode(email).length > 254) errors.push('TOO_LONG');
  return result(local, domain);
}
