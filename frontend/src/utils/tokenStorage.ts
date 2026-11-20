import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "JWT_TOKEN";

/** Keys used by older versions of the app; removed on logout so nothing stale is left behind. */
const LEGACY_KEYS = ["USER", "IS_ADMIN", "LOGOUT_INTENT"];

/**
 * Single place that reads and writes the JWT in localStorage.
 *
 * Note: localStorage is readable by any script on the page, so an XSS bug would expose the token.
 * An httpOnly cookie set by the backend would be safer, but that needs changes in the backend's login.
 */
export const tokenStorage = {
    get(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    },
    set(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    },
    clear(): void {
        localStorage.removeItem(TOKEN_KEY);
        LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    },
};

/** True when the token cannot be decoded or its `exp` claim is in the past. */
export function isTokenExpired(token: string, now: number = Date.now()): boolean {
    try {
        const { exp } = jwtDecode(token);
        return exp !== undefined && exp * 1000 <= now;
    } catch {
        return true;
    }
}
