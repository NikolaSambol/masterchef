import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { type UpdateUserRequest, userApi } from "../../api/userApi";
import { FormField } from "../../components/ui/FormField";
import { useAuth } from "../../context/AuthContext";
import type { User } from "../../types";
import { getErrorMessage } from "../../utils/errors";
import { EMAIL_RULES, nameRules } from "../auth/validation";

interface EditUserFormProps {
    user: User;
    /** True when users edit their own profile (as opposed to an admin editing someone else). */
    isOwnProfile: boolean;
    onSaved: () => void;
    onCancel: () => void;
}

const inputClass = "w-full rounded border px-3 py-2";

export function EditUserForm({ user, isOwnProfile, onSaved, onCancel }: EditUserFormProps) {
    const { login, refreshUser } = useAuth();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<UpdateUserRequest>({
        defaultValues: { name: user.name, surname: user.surname, email: user.email },
    });

    const onSubmit = async (data: UpdateUserRequest) => {
        try {
            const response = await userApi.update(user.id, data);
            // The email is the JWT subject, so the backend issues a new token for the edited user.
            // Only use it when users edit themselves – otherwise an admin editing someone else
            // would silently be logged in as that user.
            if (isOwnProfile) {
                if (response) await login(response.jwtToken);
                else await refreshUser();
            }
            toast.success("Podaci su ažurirani.");
            onSaved();
        } catch (error) {
            toast.error(getErrorMessage(error, "Podaci nisu ažurirani."));
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mx-auto max-w-md space-y-4">
            <h2 className="text-center text-xl font-bold">Ažuriraj podatke</h2>

            <FormField label="Ime" htmlFor="profile-name" error={errors.name?.message}>
                <input id="profile-name" type="text" className={inputClass} {...register("name", nameRules("Ime"))} />
            </FormField>

            <FormField label="Prezime" htmlFor="profile-surname" error={errors.surname?.message}>
                <input
                    id="profile-surname"
                    type="text"
                    className={inputClass}
                    {...register("surname", nameRules("Prezime"))}
                />
            </FormField>

            <FormField label="Email" htmlFor="profile-email" error={errors.email?.message}>
                <input id="profile-email" type="email" className={inputClass} {...register("email", EMAIL_RULES)} />
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
