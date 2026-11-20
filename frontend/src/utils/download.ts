/** Reads the filename from a `Content-Disposition: attachment; filename="x.pdf"` header. */
export function filenameFromContentDisposition(header: string | undefined, fallback: string): string {
    const match = header ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header) : null;
    return match ? decodeURIComponent(match[1]) : fallback;
}

/** Saves a Blob as a file via a temporary <a download> link. */
export function saveBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Free the memory held by the Blob URL once the download has started.
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
