/** Types for render.mjs, so the site and tests can import it. */
export declare const AREAS: Record<string, [string, string, string]>;
export declare function esc(value: unknown): string;
export declare function validate(data: unknown): void;
export declare function renderReport(data: unknown): { subject: string; html: string; text: string };
