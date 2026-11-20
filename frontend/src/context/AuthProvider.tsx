import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../api/authApi";
import { setUnauthorizedHandler } from "../api/client";
import type { User } from "../types";
import { isTokenExpired, tokenStorage } from "../utils/tokenStorage";
import { AuthContext, type AuthContextValue } from "./AuthContext";

function readValidToken(): string | null {
    const token = tokenStorage.get();
    if (token && isTokenExpired(token)) {
        tokenStorage.clear();
        return null;
    }
    return token;
}

/**
 * Holds the authentication state for the whole app.
 *
 * The user's role is always taken from the backend (/auth/user), never from localStorage,
 * so it can't be faked by editing browser storage. (The backend enforces permissions anyway;
 * this only decides what the UI shows.)
 */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(readValidToken);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(token !== null);

    const logout = useCallback(() => {
        tokenStorage.clear();
        setToken(null);
        setUser(null);
        setIsLoading(false);
    }, []);

    const loadUser = useCallback(
        async (signal?: AbortSignal) => {
            try {
                setUser(await authApi.getCurrentUser(signal));
            } catch {
                if (signal?.aborted) return;
                // Token is invalid or the backend is unreachable: start over as logged out.
                logout();
                return;
            }
            setIsLoading(false);
        },
        [logout],
    );

    // Load the user whenever the token changes (app start, sign-in, email change).
    useEffect(() => {
        if (!token) return;
        const controller = new AbortController();
        void loadUser(controller.signal);
        return () => controller.abort();
    }, [token, loadUser]);

    // Log out automatically when the backend rejects our token (expired or suspended user).
    useEffect(() => {
        setUnauthorizedHandler(() => {
            logout();
            toast.error("Sesija je istekla. Prijavite se ponovno.", { id: "session-expired" });
        });
        return () => setUnauthorizedHandler(null);
    }, [logout]);

    const login = useCallback(async (newToken: string) => {
        tokenStorage.set(newToken);
        setIsLoading(true);
        setToken(newToken);
    }, []);

    const refreshUser = useCallback(() => loadUser(), [loadUser]);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: token !== null,
            isAdmin: user?.role.includes("ROLE_ADMIN") ?? false,
            isLoading,
            login,
            logout,
            refreshUser,
        }),
        [user, token, isLoading, login, logout, refreshUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
