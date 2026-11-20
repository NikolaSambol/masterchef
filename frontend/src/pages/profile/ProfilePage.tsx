import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { BsFillFileEarmarkPdfFill } from "react-icons/bs";
import { useNavigate, useParams } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { pdfApi } from "../../api/pdfApi";
import { recipeApi } from "../../api/recipeApi";
import { userApi } from "../../api/userApi";
import { AddRecipeFab } from "../../components/recipe/AddRecipeFab";
import { ActionMenu } from "../../components/ui/ActionMenu";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Modal } from "../../components/ui/Modal";
import { PageLoader } from "../../components/ui/PageLoader";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import type { RecipeSummary, User } from "../../types";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, fullName } from "../../utils/format";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { EditUserForm } from "./EditUserForm";

type OpenDialog = "edit" | "password" | "suspend" | "delete" | { deleteRecipe: RecipeSummary } | null;

/**
 * `/useredit`      – the logged-in user's own profile.
 * `/useredit/:id`  – an admin looking at another user's profile.
 */
export default function ProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, isAdmin, logout } = useAuth();
    const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
    const closeDialog = useCallback(() => setOpenDialog(null), []);
    /** Incremented after a recipe is deleted so the recipes table re-fetches. */
    const [recipesVersion, setRecipesVersion] = useState(0);

    const viewedUserId = id ? Number(id) : undefined;
    const isOwnProfile = viewedUserId === undefined || viewedUserId === currentUser?.id;

    const loadUser = useCallback(
        (signal: AbortSignal) =>
            isOwnProfile ? authApi.getCurrentUser(signal) : userApi.getById(viewedUserId as number, signal),
        [isOwnProfile, viewedUserId],
    );
    const { data: user, isLoading, error, reload } = useAsync(loadUser);

    if (isLoading && !user) return <PageLoader text="Učitavanje korisnika..." />;
    if (error || !user) return <ErrorMessage error={error} onRetry={reload} />;

    const isTargetAdmin = user.role.includes("ROLE_ADMIN");

    const handleDeleteUser = async () => {
        try {
            await userApi.remove(user.id);
            toast.success("Korisnik je izbrisan.");
            if (isOwnProfile) {
                navigate("/");
                logout();
            } else {
                navigate("/admin/users");
            }
        } catch (deleteError) {
            toast.error(getErrorMessage(deleteError, "Korisnik nije izbrisan."));
            closeDialog();
        }
    };

    const handleSuspend = async () => {
        try {
            await userApi.suspend(user.id);
            toast.success("Korisnik je suspendiran.");
            reload();
        } catch (suspendError) {
            toast.error(getErrorMessage(suspendError, "Korisnik nije suspendiran."));
        } finally {
            closeDialog();
        }
    };

    const handlePdf = async () => {
        try {
            await pdfApi.downloadUser(user.id);
        } catch (pdfError) {
            toast.error(getErrorMessage(pdfError, "PDF nije moguće preuzeti."));
        }
    };

    return (
        <div className="flex min-h-screen justify-center bg-[#F9F9F9] px-4 py-8">
            <div className={`grid w-full max-w-7xl gap-6 ${isAdmin ? "lg:grid-cols-10" : "max-w-xl"}`}>
                <section
                    className={`flex flex-col rounded-md bg-white p-6 shadow-md ${isAdmin ? "lg:col-span-4" : ""}`}
                >
                    <h1 className="mb-6 text-center text-xl font-bold">Profil korisnika {fullName(user)}</h1>

                    {isAdmin && (
                        <div className="mb-6 flex justify-center">
                            <button
                                type="button"
                                onClick={handlePdf}
                                className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
                            >
                                <BsFillFileEarmarkPdfFill className="h-5 w-5" />
                                Izvezi u PDF
                            </button>
                        </div>
                    )}

                    <ProfileDetails user={user} />

                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => setOpenDialog("edit")}
                            className="rounded bg-[#FF9800] px-4 py-2 text-white hover:bg-yellow-500"
                        >
                            Ažuriraj podatke
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpenDialog("password")}
                            className="rounded bg-[#FF9800] px-4 py-2 text-white hover:bg-yellow-500"
                        >
                            {isOwnProfile ? "Promijeni lozinku" : "Postavi novu lozinku"}
                        </button>
                    </div>

                    <div className="mt-3 flex flex-wrap justify-center gap-4">
                        {isAdmin && !isOwnProfile && !isTargetAdmin && user.enabled && (
                            <button
                                type="button"
                                onClick={() => setOpenDialog("suspend")}
                                className="rounded bg-[#E30C37] px-4 py-2 text-white hover:bg-red-800"
                            >
                                Suspendiraj korisnika
                            </button>
                        )}
                        {!isTargetAdmin && (
                            <button
                                type="button"
                                onClick={() => setOpenDialog("delete")}
                                className="rounded bg-[#E30C37] px-4 py-2 text-white hover:bg-red-700"
                            >
                                Izbriši profil
                            </button>
                        )}
                    </div>
                </section>

                {isAdmin && (
                    <UserRecipesTable
                        userId={isOwnProfile ? undefined : user.id}
                        onDelete={(recipe) => setOpenDialog({ deleteRecipe: recipe })}
                        version={recipesVersion}
                    />
                )}
            </div>

            <AddRecipeFab />

            {openDialog === "edit" && (
                <Modal label="Ažuriraj podatke" onClose={closeDialog}>
                    <EditUserForm
                        user={user}
                        isOwnProfile={isOwnProfile}
                        onSaved={() => {
                            closeDialog();
                            reload();
                        }}
                        onCancel={closeDialog}
                    />
                </Modal>
            )}
            {openDialog === "password" && (
                <Modal label="Promijeni lozinku" onClose={closeDialog}>
                    <ChangePasswordForm
                        userId={user.id}
                        requireOldPassword={isOwnProfile}
                        onSaved={closeDialog}
                        onCancel={closeDialog}
                    />
                </Modal>
            )}
            {openDialog === "suspend" && (
                <ConfirmDialog
                    title="Suspendiranje korisnika"
                    message={`Jeste li sigurni da želite suspendirati korisnika ${fullName(user)}?`}
                    confirmLabel="Suspendiraj"
                    onConfirm={handleSuspend}
                    onCancel={closeDialog}
                />
            )}
            {openDialog === "delete" && (
                <ConfirmDialog
                    title="Brisanje korisnika"
                    message={
                        isOwnProfile
                            ? "Jeste li sigurni da želite izbrisati svoj profil? Izbrisat će se i svi vaši recepti."
                            : `Jeste li sigurni da želite izbrisati korisnika ${fullName(user)} i sve njegove recepte?`
                    }
                    confirmLabel="Izbriši"
                    onConfirm={handleDeleteUser}
                    onCancel={closeDialog}
                />
            )}
            {openDialog !== null && typeof openDialog === "object" && (
                <ConfirmDialog
                    title="Brisanje recepta"
                    message={`Jeste li sigurni da želite izbrisati recept "${openDialog.deleteRecipe.recipeName}"?`}
                    confirmLabel="Izbriši"
                    onConfirm={async () => {
                        try {
                            await recipeApi.remove(openDialog.deleteRecipe.id);
                            toast.success("Recept je izbrisan.");
                            setRecipesVersion((version) => version + 1);
                        } catch (deleteError) {
                            toast.error(getErrorMessage(deleteError, "Recept nije izbrisan."));
                        } finally {
                            closeDialog();
                        }
                    }}
                    onCancel={closeDialog}
                />
            )}
        </div>
    );
}

function ProfileDetails({ user }: { user: User }) {
    const rows: [label: string, value: string][] = [
        ["Ime", user.name],
        ["Prezime", user.surname],
        ["Email", user.email],
        ["Uloga", user.role.includes("ROLE_ADMIN") ? "Administrator" : "Korisnik"],
        ["Omogućen", user.enabled ? "Da" : "Ne"],
        ["Datum kreiranja", formatDate(user.creationDate)],
    ];

    return (
        <dl className="flex-grow space-y-4">
            {rows.map(([label, value]) => (
                <div key={label}>
                    <dt className="mb-1 font-medium text-gray-800">{label}</dt>
                    <dd className="w-full rounded border bg-gray-100 px-3 py-2 text-gray-600">{value}</dd>
                </div>
            ))}
        </dl>
    );
}

interface UserRecipesTableProps {
    /** undefined = the logged-in user's own recipes. */
    userId: number | undefined;
    onDelete: (recipe: RecipeSummary) => void;
    /** Changing this re-fetches the list. */
    version: number;
}

/** Admin-only table of a user's recipes with "open" / "delete" actions. */
function UserRecipesTable({ userId, onDelete, version }: UserRecipesTableProps) {
    const navigate = useNavigate();
    const loadRecipes = useCallback(
        (signal: AbortSignal) => recipeApi.getSummariesByUser(userId, signal),
        // `version` is intentionally a dependency: changing it re-runs the request.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [userId, version],
    );
    const { data: recipes, isLoading, error, reload } = useAsync(loadRecipes);

    return (
        <section className="overflow-x-auto rounded-md bg-white p-6 shadow-md lg:col-span-6">
            <h2 className="mb-4 text-xl font-bold">Recepti korisnika</h2>
            {isLoading && !recipes ? (
                <PageLoader />
            ) : error ? (
                <ErrorMessage error={error} onRetry={reload} />
            ) : !recipes || recipes.length === 0 ? (
                <p className="text-gray-600">Korisnik nema recepata.</p>
            ) : (
                <table className="min-w-full table-auto border-2 bg-[#BAE0FF]">
                    <thead>
                        <tr className="bg-blue-400 text-left text-sm font-medium text-black">
                            <th className="px-6 py-3">Naziv recepta</th>
                            <th className="px-6 py-3">Datum kreiranja</th>
                            <th className="px-6 py-3 text-center">Akcije</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recipes.map((recipe) => (
                            <tr key={recipe.id} className="h-20 border-t hover:bg-blue-300">
                                <td className="px-6 py-4">{recipe.recipeName}</td>
                                <td className="px-6 py-4">{formatDate(recipe.creationDate)}</td>
                                <td className="px-6 py-4 text-center">
                                    <ActionMenu
                                        label={`Akcije za recept ${recipe.recipeName}`}
                                        items={[
                                            {
                                                label: "Cijeli recept",
                                                onClick: () => navigate(`/recipedetails/${recipe.id}`),
                                            },
                                            {
                                                label: "Obriši recept",
                                                variant: "danger",
                                                onClick: () => onDelete(recipe),
                                            },
                                        ]}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}
