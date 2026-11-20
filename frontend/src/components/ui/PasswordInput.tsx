import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { inputClassName } from "./FormField";

interface PasswordInputProps {
    id: string;
    registration: UseFormRegisterReturn;
    autoComplete?: "current-password" | "new-password";
}

/** Password field with a show/hide toggle. */
export function PasswordInput({ id, registration, autoComplete = "current-password" }: PasswordInputProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="relative">
            <input
                id={id}
                type={isVisible ? "text" : "password"}
                autoComplete={autoComplete}
                className={`${inputClassName} pr-10`}
                {...registration}
            />
            <button
                type="button"
                onClick={() => setIsVisible((visible) => !visible)}
                aria-label={isVisible ? "Sakrij lozinku" : "Prikaži lozinku"}
                className="absolute inset-y-0 right-2 flex items-center text-gray-600 hover:text-black"
            >
                {isVisible ? <IoEyeOff size={20} /> : <IoEye size={20} />}
            </button>
        </div>
    );
}
