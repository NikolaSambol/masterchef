import { type ReactNode, useEffect } from "react";

interface ModalProps {
    children: ReactNode;
    onClose: () => void;
    /** Accessible name of the dialog, read by screen readers. */
    label: string;
    size?: "sm" | "lg";
}

/** Centered dialog over a blurred backdrop. Closes on backdrop click and on Escape. */
export function Modal({ children, onClose, label, size = "lg" }: ModalProps) {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        // Prevent the page behind the modal from scrolling.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    const sizeClasses = size === "sm" ? "max-w-sm w-full" : "w-[90%] max-w-4xl";

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={label}
                className={`${sizeClasses} relative max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl`}
                onClick={(event) => event.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}
