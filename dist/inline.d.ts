import { analyzeEmail, type AnalyzeOptions } from './analyze.js';
import type { EmailErrorCode } from './validate.js';
export interface InlineOptions extends AnalyzeOptions {
    mode?: 'blur' | 'submit' | 'input';
    form?: HTMLFormElement | null;
    onResult?: (result: ReturnType<typeof analyzeEmail>) => void;
    messages?: Partial<Record<EmailErrorCode, string>>;
}
export declare function attachEmailValidation(input: HTMLInputElement, options?: InlineOptions): () => void;
