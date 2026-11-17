export type EmailErrorCode = 'EMPTY' | 'TOO_LONG' | 'AT_SIGN' | 'LOCAL_EMPTY' | 'DOMAIN_EMPTY' | 'LOCAL_TOO_LONG' | 'DOMAIN_TOO_LONG' | 'LOCAL_DOT' | 'LOCAL_CHARACTER' | 'DOMAIN_DOT' | 'DOMAIN_LABEL' | 'DOMAIN_LABEL_TOO_LONG' | 'DOMAIN_TLD' | 'UNSUPPORTED_QUOTED' | 'UNSUPPORTED_UNICODE_LOCAL' | 'UNSUPPORTED_DOMAIN_LITERAL';
export type EmailWarningCode = 'IDN_DOMAIN' | 'SINGLE_LABEL_DOMAIN';
export interface ValidateOptions {
    allowUnicodeDomain?: boolean;
    requireTld?: boolean;
}
export interface ValidationResult {
    valid: boolean;
    errors: EmailErrorCode[];
    warnings: EmailWarningCode[];
    local: string | null;
    domain: string | null;
}
export declare function validateEmail(email: string, options?: ValidateOptions): ValidationResult;
