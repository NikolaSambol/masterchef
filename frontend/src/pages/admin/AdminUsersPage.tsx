import { useState } from "react";
import toast from "react-hot-toast";
import { BsFillFileEarmarkPdfFill } from "react-icons/bs";
import { FaTimes } from "react-icons/fa";
import { FcCheckmark } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { pdfApi } from "../../api/pdfApi";
import { userApi } from "../../api/userApi";
import { ActionMenu } from "../../components/ui/ActionMenu";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { PageLoader } from "../../components/ui/PageLoader";
import { useAsync } from "../../hooks/useAsync";
import type { User } from "../../types";
import { getErrorMessage } from "../../utils/errors";
import { formatDate, fullName } from "../../utils/format";

type PendingAction = { type: "suspend" | "delete"; user: User } | null;

export default function AdminUsersPage() {
    const navigate = useNavigate();
    const { data, isLoading, error, reload } = useAsync(userApi.getAll);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);

    // Admins are not listed: they can't be suspended or deleted from here.
    const users = (data ?? []).filter((user) => !user.role.includes("ROLE_ADMIN"));

    const confirmPendingAction = async () => {
        if (!pendingAction) return;
        const { type, user } = pendingAction;
        try {
            if (type === "suspend") {
                await userApi.suspend(user.id);
                toast.success("Korisnik je suspendiran.");
            } else {
                await userApi.remove(user.id);
                toast.success("Korisnik je izbrisan.");
            }
            reload();
        } catch (actionError) {
            toast.error(getErrorMessage(actionError));
        } finally {
            setPendingAction(null);
        }
    };

    const handlePdf = async () => {
        try {
            await pdfApi.downloadAllUsers();
        } catch (pdfError) {
            toast.error(getErrorMessage(pdfError, "PDF nije moguće preuzeti."));
        }
    };

    if (isLoading && !data) return <PageLoader text="Učitavanje korisnika..." />;
    if (error) return <ErrorMessage error={error} onRetry={reload} />;

    return (
        <div className="p-2 md:p-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Korisnici</h1>
                <button
                    type="button"
                    onClick={handlePdf}
                    className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700"
                >
                    <BsFillFileEarmarkPdfFill size={20} />
                    Izvezi u PDF
                </button>
            </div>
            <hr className="mb-6 border-gray-300" />

            <div className="mx-auto max-w-6xl overflow-x-auto rounded-lg bg-white shadow-md">
                <table className="min-w-full table-auto border-collapse bg-[#BAE0FF]">
                    <thead>
                        <tr className="bg-blue-400 text-left text-sm font-medium text-black">
                            <th className="px-6 py-3">Ime</th>
                            <th className="px-6 py-3">Prezime</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Datum registracije</th>
                            <th className="px-6 py-3">Omogućen</th>
                            <th className="px-6 py-3 text-center">Akcije</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="border-t hover:bg-blue-300">
                                <td className="px-6 py-4">{user.name}</td>
                                <td className="px-6 py-4">{user.surname}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">{formatDate(user.creationDate)}</td>
                                <td className="px-6 py-4">
                                    {user.enabled ? (
                                        <FcCheckmark size={28} aria-label="Da" />
                                    ) : (
                                        <FaTimes color="red" size={28} aria-label="Ne" />
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <ActionMenu
                                        label={`Akcije za korisnika ${fullName(user)}`}
                                        items={[
                                            { label: "Profil", onClick: () => navigate(`/useredit/${user.id}`) },
                                            ...(user.enabled
                                                ? [
                                                      {
                                                          label: "Suspendiraj",
                                                          variant: "danger" as const,
                                                          onClick: () => setPendingAction({ type: "suspend", user }),
                                                      },
                                                  ]
                                                : []),
                                            {
                                                label: "Obriši",
                                                variant: "danger",
                                                onClick: () => setPendingAction({ type: "delete", user }),
                                            },
                                        ]}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && <p className="py-6 text-center text-gray-500">Nema registriranih korisnika.</p>}
            </div>

            {pendingAction && (
                <ConfirmDialog
                    title={pendingAction.type === "delete" ? "Brisanje korisnika" : "Suspendiranje korisnika"}
                    message={
                        pendingAction.type === "delete"
                            ? `Jeste li sigurni da želite izbrisati korisnika ${fullName(pendingAction.user)} i sve njegove recepte?`
                            : `Jeste li sigurni da želite suspendirati korisnika ${fullName(pendingAction.user)}?`
                    }
                    confirmLabel={pendingAction.type === "delete" ? "Izbriši" : "Suspendiraj"}
                    onConfirm={confirmPendingAction}
                    onCancel={() => setPendingAction(null)}
                />
            )}
        </div>
    );
}
