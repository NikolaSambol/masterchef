import axios from "axios";

/**
 * Turns any error thrown by an API call into a message that can be shown to the user.
 *
 * The backend returns errors either as a plain string (GlobalExceptionHandler)
 * or as `{ message: string }` (auth endpoints), so both shapes are handled.
 */
export function getErrorMessage(error: unknown, fallback = "Došlo je do greške."): string {
    if (!axios.isAxiosError(error)) {
        return fallback;
    }

    if (!error.response) {
        return "Greška u mreži. Provjerite internet vezu.";
    }

    const { status, data } = error.response;
    const serverMessage = extractServerMessage(data);

    switch (status) {
        case 400:
            return serverMessage ?? fallback;
        case 401:
            return "Niste prijavljeni ili je sesija istekla.";
        case 403:
            return "Nemate ovlasti za ovu radnju.";
        case 404:
            return "Podatak nije pronađen.";
        default:
            return status >= 500 ? "Greška na serveru. Pokušajte kasnije." : (serverMessage ?? fallback);
    }
}

export function getErrorStatus(error: unknown): number | undefined {
    return axios.isAxiosError(error) ? error.response?.status : undefined;
}

function extractServerMessage(data: unknown): string | undefined {
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
        return data.message;
    }
    return undefined;
}
