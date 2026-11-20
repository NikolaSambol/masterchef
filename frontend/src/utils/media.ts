/**
 * The backend sends images and videos as Base64 strings. To build a `data:` URL we need
 * the MIME type, which we detect from the first bytes ("magic numbers") of the file.
 */
const IMAGE_SIGNATURES: [prefix: string, mime: string][] = [
    ["/9j/", "image/jpeg"],
    ["iVBORw0KGgo", "image/png"],
    ["R0lGOD", "image/gif"],
    ["UklGR", "image/webp"],
];

const VIDEO_SIGNATURES: [prefix: string, mime: string][] = [["GkXfo", "video/webm"]];

function detectMime(base64: string, signatures: [string, string][], fallback: string): string {
    return signatures.find(([prefix]) => base64.startsWith(prefix))?.[1] ?? fallback;
}

export function imageSrc(base64: string | null | undefined): string | undefined {
    if (!base64) return undefined;
    return `data:${detectMime(base64, IMAGE_SIGNATURES, "image/jpeg")};base64,${base64}`;
}

export function videoSrc(base64: string | null | undefined): string | undefined {
    if (!base64) return undefined;
    return `data:${detectMime(base64, VIDEO_SIGNATURES, "video/mp4")};base64,${base64}`;
}
