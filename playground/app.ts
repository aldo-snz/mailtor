import {analyzeEmail} from '../src/analyze.js';
import {attachEmailValidation} from '../src/inline.js';
import type {InlineOptions} from '../src/inline.js';
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const email = $<HTMLInputElement>('email');
const form = $<HTMLFormElement>('email-form');
const mode = $<HTMLSelectElement>('mode');
const domains = $<HTMLTextAreaElement>('domains');
const distance = $<HTMLSelectElement>('distance');
const unicode = $<HTMLInputElement>('unicode');
const tld = $<HTMLInputElement>('tld');
const json = $<HTMLElement>('json');
const code = $<HTMLElement>('code');
let clean = () => {};
function options(): InlineOptions { return {mode:mode.value as InlineOptions['mode'],domains:domains.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean),maxDistance:Number(distance.value) as 1|2,allowUnicodeDomain:unicode.checked,requireTld:tld.checked}; }
function showResult() {json.textContent = JSON.stringify(analyzeEmail(email.value, options()),null,2);}
function updateCode() {
  const o = options();
  code.textContent = `import { attachEmailValidation } from 'mailtor/inline';\n\nconst cleanup = attachEmailValidation(\n  document.querySelector('#email'),\n  ${JSON.stringify({mode:o.mode,domains:o.domains,maxDistance:o.maxDistance,allowUnicodeDomain:o.allowUnicodeDomain,requireTld:o.requireTld},null,2)}\n);\n\n// Al desmontar el componente: cleanup();`;
}
function attach() {clean(); clean = attachEmailValidation(email,{...options(),onResult:showResult}); updateCode(); showResult();}
for (const element of [mode,domains,distance,unicode,tld]) element.addEventListener('change',attach);
domains.addEventListener('input',attach);
email.addEventListener('input',showResult);
form.addEventListener('submit',e=>e.preventDefault());
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-example]')) button.addEventListener('click',()=>{email.value=button.dataset.example ?? '';email.dispatchEvent(new Event('input',{bubbles:true}));email.focus();});
$<HTMLButtonElement>('run-list').addEventListener('click',()=>{
  const rows = $<HTMLTextAreaElement>('list').value.split(/\r?\n/).filter(Boolean).slice(0,500);
  const body = $<HTMLTableSectionElement>('results');body.replaceChildren();
  for (const value of rows) {const r=analyzeEmail(value,options());const tr=document.createElement('tr');for (const text of [value,r.valid?'Válido':'Inválido',r.errors.join(', ') || '—',r.suggestion?.address ?? '—']) {const td=document.createElement('td');td.textContent=text;tr.append(td);}body.append(tr);}
});
$<HTMLButtonElement>('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(code.textContent ?? '');$<HTMLElement>('copy-status').textContent='Copiado.';}catch{$<HTMLElement>('copy-status').textContent='No se pudo copiar.';}});
attach();
