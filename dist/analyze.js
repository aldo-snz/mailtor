import { validateEmail } from './validate.js';
import { suggestEmail } from './suggest.js';
export function analyzeEmail(email, options = {}) {
    const validation = validateEmail(email, options);
    return { ...validation, suggestion: validation.valid ? suggestEmail(email, options) : null };
}
