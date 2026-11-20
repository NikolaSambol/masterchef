import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { getErrorMessage, getErrorStatus } from "./errors";

function httpError(status: number, data: unknown): AxiosError {
    const config = { headers: new AxiosHeaders() };
    const response = { status, data, statusText: "", headers: {}, config } as AxiosResponse;
    return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, {}, response);
}

describe("getErrorMessage", () => {
    it("shows plain-string error bodies from GlobalExceptionHandler", () => {
        expect(getErrorMessage(httpError(400, "Neispravni podaci: duplicate"))).toBe("Neispravni podaci: duplicate");
    });

    it("shows { message } error bodies from the auth endpoints", () => {
        expect(getErrorMessage(httpError(400, { message: "Old password is incorrect!" }))).toBe(
            "Old password is incorrect!",
        );
    });

    it("uses fixed messages for auth and server errors instead of leaking server details", () => {
        expect(getErrorMessage(httpError(403, "Nemate ovlasti"))).toBe("Nemate ovlasti za ovu radnju.");
        expect(getErrorMessage(httpError(500, "NullPointerException at ..."))).toBe(
            "Greška na serveru. Pokušajte kasnije.",
        );
    });

    it("reports network errors (no response)", () => {
        expect(getErrorMessage(new AxiosError("Network Error"))).toBe("Greška u mreži. Provjerite internet vezu.");
    });

    it("falls back for non-axios errors", () => {
        expect(getErrorMessage(new Error("boom"), "Nešto nije u redu")).toBe("Nešto nije u redu");
    });
});

describe("getErrorStatus", () => {
    it("returns the HTTP status of axios errors only", () => {
        expect(getErrorStatus(httpError(404, ""))).toBe(404);
        expect(getErrorStatus(new Error("x"))).toBeUndefined();
    });
});
