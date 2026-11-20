import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, type Location, useLocation, useNavigate } from "react-router-dom";
import { authApi, type SigninRequest } from "../../api/authApi";
import { FormField, inputClassName } from "../../components/ui/FormField";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage, getErrorStatus } from "../../utils/errors";
import { AuthCard, submitButtonClass } from "./AuthCard";
import { EMAIL_RULES } from "./validation";

export default function SigninPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    // Set by ProtectedRoute when the user was sent here from a page that needs a login.
    const redirectedFrom = (location.state as { from?: Location } | null)?.from;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SigninRequest>();

    const onSubmit = async (data: SigninRequest) => {
        try {
            const { jwtToken } = await authApi.signin(data);
            await login(jwtToken);
            toast.success("Uspješno ste se prijavili!");
            navigate(redirectedFrom ? `${redirectedFrom.pathname}${redirectedFrom.search}` : "/", { replace: true });
        } catch (error) {
            // The backend answers 400 for a wrong email/password and for suspended accounts.
            toast.error(getErrorStatus(error) === 400 ? "Pogrešan email ili lozinka." : getErrorMessage(error));
        }
    };

    return (
        <AuthCard title="Prijava" subtitle="Prijavite se za pristup aplikaciji." onSubmit={handleSubmit(onSubmit)}>
            {redirectedFrom && (
                <p role="status" className="mb-4 rounded bg-yellow-50 p-2 text-center text-sm text-yellow-800">
                    Prijavite se da biste mogli pristupiti toj stranici.
                </p>
            )}

            <div className="flex flex-col gap-3">
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
                        registration={register("password", { required: "Lozinka je obavezna" })}
                    />
                </FormField>
            </div>

            <button type="submit" disabled={isSubmitting} className={submitButtonClass}>
                {isSubmitting ? "Prijava..." : "Prijava"}
            </button>
            <p className="mt-4 text-center text-sm text-gray-700">
                Nemate račun?{" "}
                <Link to="/signup" className="font-medium text-[#E30C37] hover:underline">
                    Registrirajte se
                </Link>
            </p>
        </AuthCard>
    );
}
