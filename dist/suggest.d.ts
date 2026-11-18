import { type ValidateOptions } from './validate.js';
export declare const DEFAULT_DOMAINS: readonly ["gmail.com", "googlemail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com", "aol.com", "proton.me"];
export declare const DEFAULT_PROTECTED_DOMAINS: readonly string[];
export interface SuggestOptions extends ValidateOptions {
    domains?: readonly string[];
    protectedDomains?: readonly string[];
    corrections?: Readonly<Record<string, string>>;
    maxDistance?: 1 | 2;
}
export interface Suggestion {
    address: string;
    domain: string;
    originalDomain: string;
}
export declare function suggestEmail(email: string, options?: SuggestOptions): Suggestion | null;
