import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthContext, type AuthContextValue } from "../../context/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

function renderAt(auth: Partial<AuthContextValue>, { requireAdmin = false } = {}) {
    const value: AuthContextValue = {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isLoading: false,
        login: async () => {},
        logout: () => {},
        refreshUser: async () => {},
        ...auth,
    };

    render(
        <AuthContext.Provider value={value}>
            <MemoryRouter initialEntries={["/secret"]}>
                <Routes>
                    <Route
                        path="/secret"
                        element={
                            <ProtectedRoute requireAdmin={requireAdmin}>
                                <p>secret page</p>
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/signin" element={<p>sign-in page</p>} />
                    <Route path="/access-denied" element={<p>access denied page</p>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    );
}

describe("ProtectedRoute", () => {
    it("sends anonymous visitors to the sign-in page", () => {
        renderAt({ isAuthenticated: false });
        expect(screen.getByText("sign-in page")).toBeInTheDocument();
    });

    it("waits while the user is still being loaded instead of redirecting", () => {
        renderAt({ isAuthenticated: true, isLoading: true });
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(screen.queryByText("sign-in page")).not.toBeInTheDocument();
    });

    it("shows the page to logged-in users", () => {
        renderAt({ isAuthenticated: true });
        expect(screen.getByText("secret page")).toBeInTheDocument();
    });

    it("sends non-admins away from admin pages", () => {
        renderAt({ isAuthenticated: true, isAdmin: false }, { requireAdmin: true });
        expect(screen.getByText("access denied page")).toBeInTheDocument();
    });

    it("shows admin pages to admins", () => {
        renderAt({ isAuthenticated: true, isAdmin: true }, { requireAdmin: true });
        expect(screen.getByText("secret page")).toBeInTheDocument();
    });
});
