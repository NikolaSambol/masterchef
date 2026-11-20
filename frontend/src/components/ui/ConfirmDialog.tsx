import { type ReactNode, useState } from "react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    /** May return a promise; the buttons are disabled until it settles. */
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

/** "Are you sure?" dialog used before deleting or suspending something. */
export function ConfirmDialog({
    title,
    message,
    confirmLabel = "Potvrdi",
    cancelLabel = "Odustani",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const [isWorking, setIsWorking] = useState(false);

    const handleConfirm = async () => {
        setIsWorking(true);
        try {
            await onConfirm();
        } finally {
            setIsWorking(false);
        }
    };

    return (
        <Modal label={title} onClose={isWorking ? () => {} : onCancel} size="sm">
            <h2 className="mb-4 text-center text-xl font-semibold">{title}</h2>
            <div className="mb-6 text-center text-black">{message}</div>
            <div className="flex justify-center gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isWorking}
                    className="rounded bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400 disabled:opacity-50"
                >
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isWorking}
                    className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                >
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    );
}
