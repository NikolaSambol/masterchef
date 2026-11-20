import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { PageLoader } from "../ui/PageLoader";

interface ProtectedRouteProps {
    /** Only admins may see the page. */
    requireAdmin?: boolean;
    /** When omitted, nested routes are rendered through <Outlet />. */
    children?: ReactNode;
}

/**
 * Guards pages that need a logged-in user (or an admin).
 *
 * This is only for user experience: the backend is what actually enforces permissions.
 */
export function ProtectedRoute({ requireAdmin = false, children }: ProtectedRouteProps) {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        // Remember where the user wanted to go, so sign-in can send them back there.
        return <Navigate to="/signin" replace state={{ from: location }} />;
    }

    if (requireAdmin && !isAdmin) {
        return <Navigate to="/access-denied" replace />;
    }

    return children ?? <Outlet />;
}
