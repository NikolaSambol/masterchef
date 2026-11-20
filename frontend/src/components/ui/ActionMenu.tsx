import { useEffect, useRef, useState } from "react";
import { HiDotsVertical } from "react-icons/hi";

export interface MenuItem {
    label: string;
    onClick: () => void;
    variant?: "primary" | "danger";
}

/** The "⋮" button in table rows that opens a small list of actions. Closes on outside click / Escape. */
export function ActionMenu({ items, label }: { items: MenuItem[]; label: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const onPointerDown = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [isOpen]);

    return (
        <div ref={ref} className="relative inline-block">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                className="p-1"
            >
                <HiDotsVertical className="mx-auto h-6 w-6 text-gray-600 hover:text-black" />
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute top-1/2 right-full z-10 mr-2 flex -translate-y-1/2 flex-col space-y-2"
                >
                    {items.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setIsOpen(false);
                                item.onClick();
                            }}
                            className={`rounded px-3 py-1 text-sm whitespace-nowrap text-white shadow ${
                                item.variant === "danger"
                                    ? "bg-red-500 hover:bg-red-600"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
