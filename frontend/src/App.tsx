import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import LandingPage from "./pages/LandingPage";

// Pages are loaded on demand ("code splitting"), so the first visit only downloads
// the code for the page being opened. The landing page is loaded eagerly since it's the entry point.
const AllRecipesPage = lazy(() => import("./pages/recipes/AllRecipesPage"));
const RecipeDetailsPage = lazy(() => import("./pages/recipes/RecipeDetailsPage"));
const MyRecipesPage = lazy(() => import("./pages/recipes/MyRecipesPage"));
const AddRecipePage = lazy(() => import("./pages/recipes/AddRecipePage"));
const AddComponentsPage = lazy(() => import("./pages/recipes/AddComponentsPage"));
const SigninPage = lazy(() => import("./pages/auth/SigninPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminWelcome = lazy(() => import("./pages/admin/AdminLayout").then((m) => ({ default: m.AdminWelcome })));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminCategoriesPage = lazy(() => import("./pages/admin/AdminCategoriesPage"));
const AccessDeniedPage = lazy(() => import("./pages/AccessDeniedPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    {/* Public pages */}
                    <Route index element={<LandingPage />} />
                    <Route path="allrecipes" element={<AllRecipesPage />} />
                    <Route path="recipedetails/:id" element={<RecipeDetailsPage />} />
                    <Route path="signin" element={<SigninPage />} />
                    <Route path="signup" element={<SignupPage />} />
                    <Route path="access-denied" element={<AccessDeniedPage />} />

                    {/* Logged-in users */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="addrecipe" element={<AddRecipePage />} />
                        <Route path="recipe/:id/addcomponent" element={<AddComponentsPage />} />
                        <Route path="alluserrecipes" element={<MyRecipesPage />} />
                        <Route path="useredit/:id?" element={<ProfilePage />} />
                    </Route>

                    {/* Admins */}
                    <Route path="admin" element={<ProtectedRoute requireAdmin />}>
                        <Route element={<AdminLayout />}>
                            <Route index element={<AdminWelcome />} />
                            <Route path="users" element={<AdminUsersPage />} />
                            <Route path="categories" element={<AdminCategoriesPage />} />
                        </Route>
                    </Route>

                    {/* Old URLs, kept so existing links and bookmarks still work */}
                    <Route path="adminuser" element={<Navigate to="/admin/users" replace />} />
                    <Route path="category" element={<Navigate to="/admin/categories" replace />} />

                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
