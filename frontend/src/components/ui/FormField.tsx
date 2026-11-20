import type { ReactNode } from "react";

interface FormFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    children: ReactNode;
    className?: string;
}

/** Label + input + validation message, so every form looks and behaves the same. */
export function FormField({ label, htmlFor, error, children, className = "" }: FormFieldProps) {
    return (
        <div className={className}>
            <label htmlFor={htmlFor} className="mb-1 block font-medium text-gray-800">
                {label}
            </label>
            {children}
            {error && (
                <p role="alert" className="mt-1 text-sm text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
}

export const inputClassName = "w-full rounded border border-black px-3 py-2";
