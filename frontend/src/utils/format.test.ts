import { describe, expect, it } from "vitest";
import { formatDate, fullName } from "./format";

describe("formatDate", () => {
    it("formats a LocalDate from the backend", () => {
        expect(formatDate("2025-06-01")).toBe("01.06.2025");
    });

    it("formats a LocalDateTime from the backend", () => {
        expect(formatDate("2025-12-31T23:59:59.123")).toBe("31.12.2025");
    });

    it("does not shift the day because of time zones", () => {
        // new Date("2025-01-01") is UTC midnight and would show 31.12.2024 west of UTC.
        expect(formatDate("2025-01-01")).toBe("01.01.2025");
    });

    it("returns unknown formats unchanged and empty values as empty string", () => {
        expect(formatDate("yesterday")).toBe("yesterday");
        expect(formatDate(null)).toBe("");
        expect(formatDate(undefined)).toBe("");
    });
});

describe("fullName", () => {
    it("joins name and surname", () => {
        expect(fullName({ name: "Ivana", surname: "Đurić" })).toBe("Ivana Đurić");
        expect(fullName(null)).toBe("");
    });
});
