import type { RegisterOptions } from "react-hook-form";

/** Validation rules shared by sign-up, sign-in and profile forms. */

export const EMAIL_RULES = {
    required: "Email je obavezan",
    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Unesite ispravnu email adresu" },
} satisfies RegisterOptions;

export const PASSWORD_RULES = {
    required: "Lozinka je obavezna",
    minLength: { value: 6, message: "Lozinka mora imati barem 6 znakova" },
} satisfies RegisterOptions;

export const nameRules = (label: string) =>
    ({
        required: `${label} je obavezno`,
        minLength: { value: 2, message: `${label} je prekratko` },
    }) satisfies RegisterOptions;
