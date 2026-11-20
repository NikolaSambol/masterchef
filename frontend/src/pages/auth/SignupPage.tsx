import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi, type SignupRequest } from "../../api/authApi";
import { FormField, inputClassName } from "../../components/ui/FormField";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { getErrorMessage } from "../../utils/errors";
import { AuthCard, submitButtonClass } from "./AuthCard";
import { EMAIL_RULES, PASSWORD_RULES, nameRules } from "./validation";

export default function SignupPage() {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SignupRequest>();

    const onSubmit = async (data: SignupRequest) => {
        try {
            await authApi.signup(data);
            toast.success("Uspješno ste se registrirali! Sada se možete prijaviti.");
            navigate("/signin");
        } catch (error) {
            const message = getErrorMessage(error);
            if (message === "Email address already in use!") {
                setError("email", { message: "Korisnik s ovom email adresom već postoji." });
            } else {
                toast.error(message);
            }
        }
    };

    return (
        <AuthCard title="Registracija" subtitle="Kreirajte novi račun" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-3">
                <FormField label="Ime" htmlFor="name" error={errors.name?.message}>
                    <input
                        id="name"
                        type="text"
                        autoComplete="given-name"
                        className={inputClassName}
                        {...register("name", nameRules("Ime"))}
                    />
                </FormField>

                <FormField label="Prezime" htmlFor="surname" error={errors.surname?.message}>
                    <input
                        id="surname"
                        type="text"
                        autoComplete="family-name"
                        className={inputClassName}
                        {...register("surname", nameRules("Prezime"))}
                    />
                </FormField>

                <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className={inputClassName}
                        {...register("email", EMAIL_RULES)}
                    />
                </FormField>

                <FormField label="Lozinka" htmlFor="password" error={errors.password?.message}>
                    <PasswordInput
                        id="password"
                        autoComplete="new-password"
                        registration={register("password", PASSWORD_RULES)}
                    />
                </FormField>
            </div>

            <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
                {isSubmitting ? "Registracija..." : "Registriraj se"}
            </button>
            <p className="mt-4 text-center text-sm text-gray-700">
                Već imate račun?{" "}
                <Link to="/signin" className="font-medium text-[#E30C37] hover:underline">
                    Prijavite se
                </Link>
            </p>
        </AuthCard>
    );
}
