import { createContext, useContext } from "react";
import type { User } from "../types";

export interface AuthContextValue {
    /** The logged-in user, or null when logged out (or while still loading). */
    user: User | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    /** True while the user behind a stored token is being fetched on startup. */
    isLoading: boolean;
    /** Stores a new token (after sign-in or an email change) and loads the user. */
    login: (token: string) => Promise<void>;
    logout: () => void;
    /** Re-fetches the logged-in user, e.g. after they edited their profile. */
    refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
