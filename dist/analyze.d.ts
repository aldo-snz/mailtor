import { type ValidateOptions } from './validate.js';
import { type SuggestOptions } from './suggest.js';
export type AnalyzeOptions = ValidateOptions & SuggestOptions;
export declare function analyzeEmail(email: string, options?: AnalyzeOptions): {
    suggestion: import("./suggest.js").Suggestion | null;
    valid: boolean;
    errors: import("./validate.js").EmailErrorCode[];
    warnings: import("./validate.js").EmailWarningCode[];
    local: string | null;
    domain: string | null;
};
