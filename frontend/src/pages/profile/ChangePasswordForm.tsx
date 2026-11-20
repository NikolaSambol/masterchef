import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { authApi } from "../../api/authApi";
import { FormField } from "../../components/ui/FormField";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { getErrorMessage } from "../../utils/errors";
import { PASSWORD_RULES } from "../auth/validation";

interface ChangePasswordFormProps {
    userId: number;
    /**
     * Users changing their own password must enter the old one (the backend requires it).
     * Only an admin resetting someone else's password may skip it.
     */
    requireOldPassword: boolean;
    onSaved: () => void;
    onCancel: () => void;
}

interface FormValues {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function ChangePasswordForm({ userId, requireOldPassword, onSaved, onCancel }: ChangePasswordFormProps) {
    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>();

    const onSubmit = async ({ oldPassword, newPassword }: FormValues) => {
        try {
            await authApi.changePassword(userId, {
                newPassword,
                ...(requireOldPassword ? { oldPassword } : {}),
            });
            toast.success("Lozinka je promijenjena.");
            onSaved();
        } catch (error) {
            toast.error(getErrorMessage(error, "Lozinka nije promijenjena."));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto w-80 space-y-4">
            <h2 className="text-center text-xl font-bold">Promijeni lozinku</h2>

            {requireOldPassword && (
                <FormField label="Stara lozinka" htmlFor="old-password" error={errors.oldPassword?.message}>
                    <PasswordInput
                        id="old-password"
                        registration={register("oldPassword", { required: "Unesite staru lozinku" })}
                    />
                </FormField>
            )}

            <FormField label="Nova lozinka" htmlFor="new-password" error={errors.newPassword?.message}>
                <PasswordInput
                    id="new-password"
                    autoComplete="new-password"
                    registration={register("newPassword", PASSWORD_RULES)}
                />
            </FormField>

            <FormField label="Ponovi novu lozinku" htmlFor="confirm-password" error={errors.confirmPassword?.message}>
                <PasswordInput
                    id="confirm-password"
                    autoComplete="new-password"
                    registration={register("confirmPassword", {
                        required: "Ponovite novu lozinku",
                        validate: (value) => value === getValues("newPassword") || "Lozinke se ne podudaraju",
                    })}
                />
            </FormField>

            <div className="flex justify-end gap-4">
                <button type="button" onClick={onCancel} className="rounded bg-gray-300 px-4 py-2">
                    Odustani
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded bg-[#4CAF50] px-4 py-2 text-white disabled:opacity-60"
                >
                    {isSubmitting ? "Spremanje..." : "Spremi"}
                </button>
            </div>
        </form>
    );
}
