/** Must match spring.servlet.multipart.max-request-size in the backend. */
export const MAX_UPLOAD_MB = 4;

const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** react-hook-form `validate` rule for an optional file input. */
export function maxFileSize(files: FileList | null | undefined): true | string {
    const file = files?.[0];
    return !file || file.size <= MAX_UPLOAD_BYTES || `Datoteka je prevelika (najviše ${MAX_UPLOAD_MB} MB).`;
}

export function isFileTooLarge(file: File | null | undefined): boolean {
    return !!file && file.size > MAX_UPLOAD_BYTES;
}
