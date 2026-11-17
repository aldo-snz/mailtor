import {validateEmail, type ValidateOptions} from './validate.js';
import {suggestEmail, type SuggestOptions} from './suggest.js';
export type AnalyzeOptions = ValidateOptions & SuggestOptions;
export function analyzeEmail(email: string, options: AnalyzeOptions = {}) {
  const validation = validateEmail(email, options);
  return {...validation, suggestion: validation.valid ? suggestEmail(email, options) : null};
}
