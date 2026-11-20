import { type ReactNode, useCallback, useState } from "react";
import toast from "react-hot-toast";
import { BsFillFileEarmarkPdfFill } from "react-icons/bs";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { useNavigate, useParams } from "react-router-dom";
import { pdfApi } from "../../api/pdfApi";
import { recipeApi } from "../../api/recipeApi";
import { AddRecipeFab } from "../../components/recipe/AddRecipeFab";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { Modal } from "../../components/ui/Modal";
import { PageLoader } from "../../components/ui/PageLoader";
import { useAuth } from "../../context/AuthContext";
import { useAsync } from "../../hooks/useAsync";
import { getErrorMessage, getErrorStatus } from "../../utils/errors";
import { formatDate, fullName } from "../../utils/format";
import { imageSrc, videoSrc } from "../../utils/media";
import NotFoundPage from "../NotFoundPage";
import { UpdateComponentsForm } from "./UpdateComponentsForm";
import { UpdateRecipeForm } from "./UpdateRecipeForm";

type OpenDialog = "editRecipe" | "editComponents" | "delete" | null;

export default function RecipeDetailsPage() {
    const recipeId = Number(useParams().id);
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
    const closeDialog = useCallback(() => setOpenDialog(null), []);

    const loadRecipe = useCallback((signal: AbortSignal) => recipeApi.getById(recipeId, signal), [recipeId]);
    const { data: recipe, isLoading, error, reload } = useAsync(loadRecipe);

    if (Number.isNaN(recipeId)) return <NotFoundPage />;
    if (isLoading && !recipe) return <PageLoader text="Učitavanje recepta..." />;
    // The backend answers 400 ("Recipe not found") or 404 for unknown ids.
    if ([400, 404].includes(getErrorStatus(error) ?? 0)) return <NotFoundPage />;
    if (error || !recipe) return <ErrorMessage error={error} onRetry={reload} />;

    // Only the author and admins see the edit buttons. The backend checks this again.
    const canEdit = isAdmin || (user !== null && user.email === recipe.user.email);

    const handleSaved = () => {
        closeDialog();
        reload();
    };

    const handleDelete = async () => {
        try {
            await recipeApi.remove(recipe.id);
            toast.success("Recept je izbrisan.");
            navigate("/allrecipes");
        } catch (deleteError) {
            toast.error(getErrorMessage(deleteError, "Recept nije izbrisan."));
            closeDialog();
        }
    };

    const handlePdf = async () => {
        try {
            await pdfApi.downloadRecipe(recipe.id);
        } catch (pdfError) {
            toast.error(getErrorMessage(pdfError, "PDF nije moguće preuzeti."));
        }
    };

    return (
        <div className="min-h-screen bg-[#FCFAF9] p-6 pb-32 md:p-12">
            <article className="mx-auto max-w-5xl overflow-hidden rounded-lg bg-white shadow-md">
                <div className="flex flex-wrap justify-start gap-3 border-b bg-gray-50 p-4">
                    <ToolbarButton color="#4CAF50" icon={<BsFillFileEarmarkPdfFill />} onClick={handlePdf}>
                        Izvezi u PDF
                    </ToolbarButton>
                    {canEdit && (
                        <>
                            <ToolbarButton
                                color="#FF9800"
                                icon={<FaEdit />}
                                onClick={() => setOpenDialog("editRecipe")}
                            >
                                Uredi recept
                            </ToolbarButton>
                            <ToolbarButton
                                color="#FF9800"
                                icon={<FaEdit />}
                                onClick={() => setOpenDialog("editComponents")}
                            >
                                Uredi komponente
                            </ToolbarButton>
                            <ToolbarButton
                                color="#E30C37"
                                icon={<RiDeleteBin6Fill />}
                                onClick={() => setOpenDialog("delete")}
                            >
                                Izbriši recept
                            </ToolbarButton>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-4 p-6 md:flex-row">
                    {recipe.image && (
                        <img
                            src={imageSrc(recipe.image)}
                            alt={recipe.recipeName}
                            className="h-auto max-h-[300px] w-full rounded-md object-cover md:w-2/5"
                        />
                    )}
                    {recipe.video && (
                        <video
                            controls
                            src={videoSrc(recipe.video)}
                            className="max-h-[300px] w-full rounded-md object-cover md:w-3/5"
                        >
                            Vaš preglednik ne podržava video.
                        </video>
                    )}
                </div>

                <div className="p-6">
                    <h1 className="mb-2 text-3xl font-bold text-gray-900">{recipe.recipeName}</h1>
                    <dl className="mb-4 space-y-1 text-sm text-black">
                        <Detail label="Autor">{fullName(recipe.user)}</Detail>
                        <Detail label="Datum">{formatDate(recipe.creationDate)}</Detail>
                        <Detail label="Kategorija">{recipe.category?.categoryName ?? "—"}</Detail>
                        <Detail label="Vrijeme pripreme">{recipe.preparationTime}</Detail>
                    </dl>

                    {recipe.components?.length === 0 && (
                        <p className="mt-6 border-t border-gray-200 pt-6 text-gray-600">
                            Ovaj recept još nema komponenti.
                        </p>
                    )}

                    {recipe.components?.map((component) => (
                        <section key={component.id} className="mt-6 mb-8 border-t border-gray-200 pt-6">
                            <h2 className="mb-2 text-2xl font-semibold text-black">{component.componentName}</h2>
                            {component.imagePath && (
                                <img
                                    src={imageSrc(component.imagePath)}
                                    alt={component.componentName}
                                    className="mb-4 h-auto max-h-[300px] w-full rounded-md object-cover md:w-2/5"
                                />
                            )}
                            <h3 className="text-lg font-medium text-black">Sastojci:</h3>
                            <p className="mb-4 whitespace-pre-line text-gray-800">{component.ingredients}</p>
                            <h3 className="text-lg font-medium text-black">Upute:</h3>
                            <p className="whitespace-pre-line text-gray-800">{component.instruction}</p>
                        </section>
                    ))}
                </div>
            </article>

            <AddRecipeFab />

            {openDialog === "editRecipe" && (
                <Modal label="Uredi recept" onClose={closeDialog}>
                    <UpdateRecipeForm recipe={recipe} onSaved={handleSaved} onCancel={closeDialog} />
                </Modal>
            )}
            {openDialog === "editComponents" && (
                <Modal label="Uredi komponente" onClose={closeDialog}>
                    <UpdateComponentsForm recipeId={recipe.id} onSaved={handleSaved} onCancel={closeDialog} />
                </Modal>
            )}
            {openDialog === "delete" && (
                <ConfirmDialog
                    title="Potvrda brisanja"
                    message={
                        <>
                            Jeste li sigurni da želite izbrisati recept <strong>{recipe.recipeName}</strong>?
                        </>
                    }
                    confirmLabel="Izbriši"
                    onConfirm={handleDelete}
                    onCancel={closeDialog}
                />
            )}
        </div>
    );
}

function ToolbarButton({
    color,
    icon,
    onClick,
    children,
}: {
    color: string;
    icon: ReactNode;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 rounded px-4 py-2 text-sm font-medium text-white shadow"
            style={{ backgroundColor: color }}
        >
            {icon}
            {children}
        </button>
    );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex gap-1">
            <dt>{label}:</dt>
            <dd>{children}</dd>
        </div>
    );
}
