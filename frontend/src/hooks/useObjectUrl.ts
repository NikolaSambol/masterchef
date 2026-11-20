import { useEffect, useState } from "react";

/**
 * Returns a temporary URL for previewing a selected file (e.g. in an <img>),
 * and frees it again when the file changes or the component unmounts.
 */
export function useObjectUrl(file: File | null | undefined): string | undefined {
    const [url, setUrl] = useState<string>();

    useEffect(() => {
        if (!file) {
            setUrl(undefined);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return url;
}
