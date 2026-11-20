import { getErrorMessage } from "../../utils/errors";

interface ErrorMessageProps {
    error: unknown;
    onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
    return (
        <div role="alert" className="mx-auto my-10 max-w-md text-center">
            <p className="mb-4 text-red-600">{getErrorMessage(error)}</p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="rounded bg-[#4056A1] px-4 py-2 text-white hover:bg-[#33468a]"
                >
                    Pokušaj ponovno
                </button>
            )}
        </div>
    );
}
