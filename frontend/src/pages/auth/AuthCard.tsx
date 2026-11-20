import type { FormEventHandler, ReactNode } from "react";

interface AuthCardProps {
    title: string;
    subtitle: string;
    onSubmit: FormEventHandler<HTMLFormElement>;
    children: ReactNode;
}

/** Centered white card used by the sign-in and sign-up forms. */
export function AuthCard({ title, subtitle, onSubmit, children }: AuthCardProps) {
    return (
        <div className="flex flex-1 items-center justify-center bg-[#FCFAF9] px-4 py-10">
            <form
                onSubmit={onSubmit}
                noValidate
                className="w-[360px] rounded-lg border border-gray-200 bg-white px-4 py-6 shadow-lg sm:w-[450px] sm:px-8"
            >
                <h1 className="text-center text-2xl font-bold text-gray-800">{title}</h1>
                <p className="mb-5 text-center text-slate-700">{subtitle}</p>
                {children}
            </form>
        </div>
    );
}

export const submitButtonClass =
    "mt-6 w-full rounded-md bg-[#E30C37] py-2 font-semibold text-white transition-colors duration-200 hover:bg-red-600 disabled:opacity-60";
