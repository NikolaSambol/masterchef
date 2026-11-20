import { type FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { categoryApi } from "../../api/categoryApi";
import { ActionMenu } from "../../components/ui/ActionMenu";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { useCategories } from "../../hooks/useCategories";
import type { Category } from "../../types";
import { getErrorMessage, getErrorStatus } from "../../utils/errors";

export default function AdminCategoriesPage() {
    const { categories, isLoading, error, reload } = useCategories();
    const [newName, setNewName] = useState("");
    const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
    const [toDelete, setToDelete] = useState<Category | null>(null);

    const handleAdd = async (event: FormEvent) => {
        event.preventDefault();
        const name = newName.trim();
        if (!name) {
            toast.error("Naziv kategorije ne može biti prazan.");
            return;
        }
        try {
            await categoryApi.create(name);
            toast.success("Kategorija je dodana.");
            setNewName("");
            reload();
        } catch (addError) {
            toast.error(getErrorMessage(addError, "Kategorija nije dodana."));
        }
    };

    const handleUpdate = async () => {
        if (!editing) return;
        const name = editing.name.trim();
        if (!name) {
            toast.error("Naziv kategorije ne može biti prazan.");
            return;
        }
        try {
            await categoryApi.update(editing.id, name);
            toast.success("Kategorija je ažurirana.");
            setEditing(null);
            reload();
        } catch (updateError) {
            toast.error(getErrorMessage(updateError, "Kategorija nije ažurirana."));
        }
    };

    const handleDelete = async () => {
        if (!toDelete) return;
        try {
            await categoryApi.remove(toDelete.id);
            toast.success("Kategorija je izbrisana.");
            reload();
        } catch (deleteError) {
            // The backend refuses to delete a category that recipes still use.
            toast.error(
                getErrorStatus(deleteError) === 400
                    ? "Kategorija nije izbrisana jer je koriste postojeći recepti."
                    : getErrorMessage(deleteError, "Kategorija nije izbrisana."),
            );
        } finally {
            setToDelete(null);
        }
    };

    return (
        <div className="p-2 md:p-6">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-lg bg-white shadow-md">
                <h1 className="my-6 text-center text-2xl font-bold text-gray-800">Kategorije recepata</h1>

                <form
                    onSubmit={handleAdd}
                    className="flex flex-col items-center justify-center gap-4 border-b border-gray-200 p-4 md:flex-row"
                >
                    <input
                        type="text"
                        aria-label="Naziv nove kategorije"
                        placeholder="Nova kategorija"
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        className="w-full max-w-sm rounded border px-4 py-2"
                    />
                    <button type="submit" className="rounded bg-[#4CAF50] px-6 py-2 text-white hover:bg-green-700">
                        Dodaj
                    </button>
                </form>

                {error ? (
                    <ErrorMessage error={error} onRetry={reload} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse bg-[#BAE0FF]">
                            <thead>
                                <tr className="bg-blue-400 text-left text-sm font-medium text-black">
                                    <th className="px-6 py-3">ID</th>
                                    <th className="px-6 py-3">Naziv kategorije</th>
                                    <th className="px-6 py-3 text-center">Akcije</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && categories.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-6 text-center">
                                            Učitavanje...
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && categories.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-6 text-center text-gray-500">
                                            Nema kategorija.
                                        </td>
                                    </tr>
                                )}
                                {categories.map((category) => {
                                    const isEditing = editing?.id === category.id;
                                    return (
                                        <tr key={category.id} className="h-20 border-t hover:bg-blue-300">
                                            <td className="px-6 py-4">{category.id}</td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        aria-label="Novi naziv kategorije"
                                                        value={editing.name}
                                                        onChange={(event) =>
                                                            setEditing({ id: category.id, name: event.target.value })
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (event.key === "Enter") void handleUpdate();
                                                            if (event.key === "Escape") setEditing(null);
                                                        }}
                                                        autoFocus
                                                        className="w-full rounded border px-3 py-2"
                                                    />
                                                ) : (
                                                    category.categoryName
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isEditing ? (
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={handleUpdate}
                                                            className="rounded bg-green-600 px-3 py-1 text-sm text-white shadow hover:bg-green-700"
                                                        >
                                                            Spremi
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditing(null)}
                                                            className="rounded bg-gray-300 px-3 py-1 text-sm shadow hover:bg-gray-400"
                                                        >
                                                            Odustani
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <ActionMenu
                                                        label={`Akcije za kategoriju ${category.categoryName}`}
                                                        items={[
                                                            {
                                                                label: "Uredi",
                                                                onClick: () =>
                                                                    setEditing({
                                                                        id: category.id,
                                                                        name: category.categoryName,
                                                                    }),
                                                            },
                                                            {
                                                                label: "Obriši",
                                                                variant: "danger",
                                                                onClick: () => setToDelete(category),
                                                            },
                                                        ]}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {toDelete && (
                <ConfirmDialog
                    title="Brisanje kategorije"
                    message={
                        <>
                            Jeste li sigurni da želite izbrisati kategoriju <strong>{toDelete.categoryName}</strong>?
                            <br />
                            Kategorija se može izbrisati samo ako je ne koristi nijedan recept.
                        </>
                    }
                    confirmLabel="Izbriši"
                    onConfirm={handleDelete}
                    onCancel={() => setToDelete(null)}
                />
            )}
        </div>
    );
}
