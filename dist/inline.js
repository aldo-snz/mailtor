import { analyzeEmail } from './analyze.js';
const labels = {
    EMPTY: 'Ingresá un email.', TOO_LONG: 'El email es demasiado largo.', AT_SIGN: 'Usá una sola arroba (@).',
    LOCAL_EMPTY: 'Falta el texto antes de @.', DOMAIN_EMPTY: 'Falta el dominio después de @.',
    LOCAL_TOO_LONG: 'La parte anterior a @ es demasiado larga.', DOMAIN_TOO_LONG: 'El dominio es demasiado largo.',
    LOCAL_DOT: 'Revisá los puntos antes de @.', LOCAL_CHARACTER: 'Hay caracteres no admitidos antes de @.',
    DOMAIN_DOT: 'Revisá los puntos del dominio.', DOMAIN_LABEL: 'El dominio contiene caracteres o guiones inválidos.',
    DOMAIN_LABEL_TOO_LONG: 'Una parte del dominio es demasiado larga.', DOMAIN_TLD: 'Completá el dominio, incluido su sufijo.',
    UNSUPPORTED_QUOTED: 'Las direcciones entre comillas no son compatibles.',
    UNSUPPORTED_UNICODE_LOCAL: 'Los caracteres Unicode antes de @ no son compatibles.',
    UNSUPPORTED_DOMAIN_LITERAL: 'Los dominios entre corchetes no son compatibles.'
};
let idCounter = 0;
export function attachEmailValidation(input, options = {}) {
    const form = options.form === undefined ? input.form : options.form;
    const container = document.createElement('div');
    container.className = 'mailtor-feedback';
    const error = document.createElement('p');
    const suggestion = document.createElement('div');
    const status = document.createElement('span');
    const accept = document.createElement('button');
    const dismiss = document.createElement('button');
    error.id = 'mailtor-error-' + ++idCounter;
    error.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-live', 'polite');
    accept.type = 'button';
    dismiss.type = 'button';
    accept.textContent = 'Usar sugerencia';
    dismiss.textContent = 'Descartar';
    suggestion.hidden = true;
    suggestion.append(status, accept, dismiss);
    container.append(error, suggestion);
    input.insertAdjacentElement('afterend', container);
    const originalInvalid = input.getAttribute('aria-invalid');
    const originalDescribedby = input.getAttribute('aria-describedby');
    input.setAttribute('aria-describedby', [originalDescribedby, error.id].filter(Boolean).join(' '));
    let exposed = false;
    let dismissedFor = '';
    let candidate = null;
    const mode = options.mode ?? 'blur';
    function render(force = false) {
        if (!exposed && !force)
            return;
        exposed = true;
        const value = input.value;
        const result = analyzeEmail(value, options);
        error.textContent = result.errors.map(code => options.messages?.[code] ?? labels[code]).join(' ');
        if (result.valid)
            input.setAttribute('aria-invalid', 'false');
        else
            input.setAttribute('aria-invalid', 'true');
        candidate = result.suggestion?.address ?? null;
        const showSuggestion = Boolean(candidate && dismissedFor !== value);
        suggestion.hidden = !showSuggestion;
        status.textContent = showSuggestion ? '¿Quisiste escribir ' + candidate + '? ' : '';
        options.onResult?.(result);
    }
    function onInput() { if (mode === 'input' || exposed)
        render(true); }
    function onBlur() { if (mode === 'blur' || mode === 'input')
        render(true); }
    function onSubmit(event) {
        render(true);
        if (input.getAttribute('aria-invalid') === 'true')
            event.preventDefault();
    }
    function onAccept() { if (!candidate)
        return; input.value = candidate; dismissedFor = ''; render(true); input.focus(); }
    function onDismiss() { dismissedFor = input.value; suggestion.hidden = true; status.textContent = ''; input.focus(); }
    input.addEventListener('input', onInput);
    input.addEventListener('blur', onBlur);
    form?.addEventListener('submit', onSubmit);
    accept.addEventListener('click', onAccept);
    dismiss.addEventListener('click', onDismiss);
    return () => {
        input.removeEventListener('input', onInput);
        input.removeEventListener('blur', onBlur);
        form?.removeEventListener('submit', onSubmit);
        accept.removeEventListener('click', onAccept);
        dismiss.removeEventListener('click', onDismiss);
        container.remove();
        if (originalInvalid === null)
            input.removeAttribute('aria-invalid');
        else
            input.setAttribute('aria-invalid', originalInvalid);
        if (originalDescribedby === null)
            input.removeAttribute('aria-describedby');
        else
            input.setAttribute('aria-describedby', originalDescribedby);
    };
}
