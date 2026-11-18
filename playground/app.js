// src/validate.ts
var encoder = new TextEncoder();
var localChars = /^[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~.]+$/;
var asciiLabel = /^[A-Za-z0-9-]+$/;
var unicodeLabel = /^[\p{L}\p{N}-]+$/u;
function validateEmail(email2, options2 = {}) {
  const errors = [];
  const warnings = [];
  const result = (local2, domain2) => ({ valid: errors.length === 0, errors, warnings, local: local2, domain: domain2 });
  if (typeof email2 !== "string" || email2.length === 0) {
    errors.push("EMPTY");
    return result(null, null);
  }
  if (email2.length > 1024) {
    errors.push("TOO_LONG");
    return result(null, null);
  }
  const at = email2.indexOf("@");
  if (at < 0 || at !== email2.lastIndexOf("@")) {
    errors.push("AT_SIGN");
    return result(null, null);
  }
  const local = email2.slice(0, at);
  const domain = email2.slice(at + 1);
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
    if (!options2.allowUnicodeDomain) errors.push("DOMAIN_LABEL");
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
  const labels2 = domain.split(".");
  if (labels2.length === 1) {
    if (options2.requireTld !== false) errors.push("DOMAIN_TLD");
    else warnings.push("SINGLE_LABEL_DOMAIN");
  }
  for (const label of labels2) {
    if (encoder.encode(label).length > 63) errors.push("DOMAIN_LABEL_TOO_LONG");
    if (!label || label.startsWith("-") || label.endsWith("-") || !(options2.allowUnicodeDomain ? unicodeLabel : asciiLabel).test(label)) errors.push("DOMAIN_LABEL");
  }
  if (labels2.length > 1 && (labels2.at(-1)?.length ?? 0) < 2) errors.push("DOMAIN_TLD");
  if (encoder.encode(canonical).length > 253) errors.push("DOMAIN_TOO_LONG");
  if (encoder.encode(email2).length > 254) errors.push("TOO_LONG");
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
function suggestEmail(email2, options2 = {}) {
  const validation = validateEmail(email2, options2);
  if (!validation.valid || !validation.local || !validation.domain) return null;
  const original = validation.domain.toLowerCase();
  if (DEFAULT_PROTECTED_DOMAINS.includes(original) || (options2.protectedDomains ?? []).slice(0, 500).some((domain) => typeof domain === "string" && domain.toLowerCase() === original) || (options2.domains ?? []).slice(0, 500).some((domain) => typeof domain === "string" && domain.toLowerCase() === original)) return null;
  const mapped = options2.corrections?.[original];
  if (typeof mapped === "string") {
    const target = mapped.toLowerCase();
    if (target !== original && validateEmail("x@" + target, options2).valid) {
      return { address: validation.local + "@" + target, domain: target, originalDomain: validation.domain };
    }
  }
  if (original.split(".")[0].length < 4) return null;
  const domains2 = options2.domains ?? DEFAULT_DOMAINS;
  const limit = options2.maxDistance ?? 2;
  let winner = null;
  const seen = /* @__PURE__ */ new Set();
  for (const raw of domains2.slice(0, 500)) {
    if (typeof raw !== "string" || raw.length > 253) continue;
    const candidate = raw.toLowerCase();
    if (!validateEmail("x@" + candidate, options2).valid) continue;
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
function analyzeEmail(email2, options2 = {}) {
  const validation = validateEmail(email2, options2);
  return { ...validation, suggestion: validation.valid ? suggestEmail(email2, options2) : null };
}

// src/inline.ts
var labels = {
  EMPTY: "Ingres\xE1 un email.",
  TOO_LONG: "El email es demasiado largo.",
  AT_SIGN: "Us\xE1 una sola arroba (@).",
  LOCAL_EMPTY: "Falta el texto antes de @.",
  DOMAIN_EMPTY: "Falta el dominio despu\xE9s de @.",
  LOCAL_TOO_LONG: "La parte anterior a @ es demasiado larga.",
  DOMAIN_TOO_LONG: "El dominio es demasiado largo.",
  LOCAL_DOT: "Revis\xE1 los puntos antes de @.",
  LOCAL_CHARACTER: "Hay caracteres no admitidos antes de @.",
  DOMAIN_DOT: "Revis\xE1 los puntos del dominio.",
  DOMAIN_LABEL: "El dominio contiene caracteres o guiones inv\xE1lidos.",
  DOMAIN_LABEL_TOO_LONG: "Una parte del dominio es demasiado larga.",
  DOMAIN_TLD: "Complet\xE1 el dominio, incluido su sufijo.",
  UNSUPPORTED_QUOTED: "Las direcciones entre comillas no son compatibles.",
  UNSUPPORTED_UNICODE_LOCAL: "Los caracteres Unicode antes de @ no son compatibles.",
  UNSUPPORTED_DOMAIN_LITERAL: "Los dominios entre corchetes no son compatibles."
};
var idCounter = 0;
function attachEmailValidation(input, options2 = {}) {
  const form2 = options2.form === void 0 ? input.form : options2.form;
  const container = document.createElement("div");
  container.className = "mailtor-feedback";
  const error = document.createElement("p");
  const suggestion = document.createElement("div");
  const status = document.createElement("span");
  const accept = document.createElement("button");
  const dismiss = document.createElement("button");
  error.id = "mailtor-error-" + ++idCounter;
  error.setAttribute("aria-live", "polite");
  status.setAttribute("aria-live", "polite");
  accept.type = "button";
  dismiss.type = "button";
  accept.textContent = "Usar sugerencia";
  dismiss.textContent = "Descartar";
  suggestion.hidden = true;
  suggestion.append(status, accept, dismiss);
  container.append(error, suggestion);
  input.insertAdjacentElement("afterend", container);
  const originalInvalid = input.getAttribute("aria-invalid");
  const originalDescribedby = input.getAttribute("aria-describedby");
  input.setAttribute("aria-describedby", [originalDescribedby, error.id].filter(Boolean).join(" "));
  let exposed = false;
  let dismissedFor = "";
  let candidate = null;
  const mode2 = options2.mode ?? "blur";
  function render(force = false) {
    if (!exposed && !force) return;
    exposed = true;
    const value = input.value;
    const result = analyzeEmail(value, options2);
    error.textContent = result.errors.map((code2) => options2.messages?.[code2] ?? labels[code2]).join(" ");
    if (result.valid) input.setAttribute("aria-invalid", "false");
    else input.setAttribute("aria-invalid", "true");
    candidate = result.suggestion?.address ?? null;
    const showSuggestion = Boolean(candidate && dismissedFor !== value);
    suggestion.hidden = !showSuggestion;
    status.textContent = showSuggestion ? "\xBFQuisiste escribir " + candidate + "? " : "";
    options2.onResult?.(result);
  }
  function onInput() {
    if (mode2 === "input" || exposed) render(true);
  }
  function onBlur() {
    if (mode2 === "blur" || mode2 === "input") render(true);
  }
  function onSubmit(event) {
    render(true);
    if (input.getAttribute("aria-invalid") === "true") event.preventDefault();
  }
  function onAccept() {
    if (!candidate) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) setter.call(input, candidate);
    else input.value = candidate;
    dismissedFor = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
  }
  function onDismiss() {
    dismissedFor = input.value;
    suggestion.hidden = true;
    status.textContent = "";
    input.focus();
  }
  input.addEventListener("input", onInput);
  input.addEventListener("blur", onBlur);
  form2?.addEventListener("submit", onSubmit);
  accept.addEventListener("click", onAccept);
  dismiss.addEventListener("click", onDismiss);
  return () => {
    input.removeEventListener("input", onInput);
    input.removeEventListener("blur", onBlur);
    form2?.removeEventListener("submit", onSubmit);
    accept.removeEventListener("click", onAccept);
    dismiss.removeEventListener("click", onDismiss);
    container.remove();
    if (originalInvalid === null) input.removeAttribute("aria-invalid");
    else input.setAttribute("aria-invalid", originalInvalid);
    if (originalDescribedby === null) input.removeAttribute("aria-describedby");
    else input.setAttribute("aria-describedby", originalDescribedby);
  };
}

// playground/app.ts
var $ = (id) => document.getElementById(id);
var email = $("email");
var form = $("email-form");
var mode = $("mode");
var validateNow = $("validate-now");
var domains = $("domains");
var protectedDomains = $("protected-domains");
var corrections = $("corrections");
var distance2 = $("distance");
var unicode = $("unicode");
var tld = $("tld");
var json = $("json");
var code = $("code");
var clean = () => {
};
function lines(value) {
  return value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}
function mappings(value) {
  const result = /* @__PURE__ */ Object.create(null);
  for (const line of lines(value).slice(0, 500)) {
    const index = line.indexOf("=");
    if (index > 0) result[line.slice(0, index).trim().toLowerCase()] = line.slice(index + 1).trim().toLowerCase();
  }
  return result;
}
function options() {
  return { mode: mode.value, domains: lines(domains.value), protectedDomains: lines(protectedDomains.value), corrections: mappings(corrections.value), maxDistance: Number(distance2.value), allowUnicodeDomain: unicode.checked, requireTld: tld.checked };
}
function showResult() {
  json.textContent = JSON.stringify(analyzeEmail(email.value, options()), null, 2);
}
function updateCode() {
  const o = options();
  code.textContent = `import { attachEmailValidation } from 'mailtor/inline';

const cleanup = attachEmailValidation(
  document.querySelector('#email'),
  ${JSON.stringify({ mode: o.mode, domains: o.domains, protectedDomains: o.protectedDomains, corrections: o.corrections, maxDistance: o.maxDistance, allowUnicodeDomain: o.allowUnicodeDomain, requireTld: o.requireTld }, null, 2)}
);

// Al desmontar el componente: cleanup();`;
}
function attach() {
  clean();
  clean = attachEmailValidation(email, { ...options(), onResult: showResult });
  validateNow.hidden = mode.value === "input";
  updateCode();
  showResult();
}
for (const element of [mode, domains, protectedDomains, corrections, distance2, unicode, tld]) element.addEventListener("change", attach);
for (const element of [domains, protectedDomains, corrections]) element.addEventListener("input", attach);
email.addEventListener("input", showResult);
form.addEventListener("submit", (e) => e.preventDefault());
for (const button of document.querySelectorAll("[data-example]")) button.addEventListener("click", () => {
  email.value = button.dataset.example ?? "";
  email.dispatchEvent(new Event("input", { bubbles: true }));
  email.focus();
});
$("run-list").addEventListener("click", () => {
  const rows = $("list").value.split(/\r?\n/).filter(Boolean).slice(0, 500);
  const body = $("results");
  body.replaceChildren();
  for (const value of rows) {
    const r = analyzeEmail(value, options());
    const tr = document.createElement("tr");
    for (const text of [value, r.valid ? "V\xE1lido" : "Inv\xE1lido", r.errors.join(", ") || "\u2014", r.suggestion?.address ?? "\u2014"]) {
      const td = document.createElement("td");
      td.textContent = text;
      tr.append(td);
    }
    body.append(tr);
  }
});
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(code.textContent ?? "");
    $("copy-status").textContent = "Copiado.";
  } catch {
    $("copy-status").textContent = "No se pudo copiar.";
  }
});
attach();
