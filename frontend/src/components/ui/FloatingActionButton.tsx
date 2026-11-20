import { type ReactNode, useState } from "react";

export interface FabAction {
    label: string;
    icon?: ReactNode;
    color?: string;
    textColor?: string;
    onClick: () => void;
}

interface FloatingActionButtonProps {
    actions: FabAction[];
    icon?: ReactNode;
    color?: string;
}

/** Round "+" button fixed in the bottom-right corner that expands into a list of actions. */
export function FloatingActionButton({ actions, icon = "+", color = "#3171DE" }: FloatingActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (actions.length === 0) return null;

    return (
        <div className="fixed right-6 bottom-6 z-40">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-label={isOpen ? "Zatvori izbornik akcija" : "Otvori izbornik akcija"}
                aria-expanded={isOpen}
                className="flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white shadow-lg transition-transform duration-300 hover:scale-110"
                style={{ backgroundColor: color }}
            >
                {icon}
            </button>

            <div
                className={`absolute right-0 bottom-20 flex flex-col items-end transition-opacity duration-300 ${
                    isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
                }`}
            >
                {actions.map((action) => (
                    <button
                        key={action.label}
                        type="button"
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => {
                            action.onClick();
                            setIsOpen(false);
                        }}
                        className="mb-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap shadow-md transition-colors duration-200 hover:bg-black/10"
                        style={{ backgroundColor: action.color ?? "#ffffff", color: action.textColor ?? "#000000" }}
                    >
                        {action.icon && <span className="text-lg">{action.icon}</span>}
                        <span>{action.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
