import { describe, expect, it } from "vitest";
import { isTokenExpired, tokenStorage } from "./tokenStorage";

/** Builds an unsigned JWT with the given payload (the signature isn't checked client-side). */
function fakeJwt(payload: object): string {
    const encode = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, "");
    return `${encode({ alg: "HS256" })}.${encode(payload)}.signature`;
}

describe("isTokenExpired", () => {
    const now = Date.UTC(2026, 0, 1);

    it("is false for a token that expires in the future", () => {
        expect(isTokenExpired(fakeJwt({ sub: "a@b.c", exp: now / 1000 + 60 }), now)).toBe(false);
    });

    it("is true for a token that has expired", () => {
        expect(isTokenExpired(fakeJwt({ sub: "a@b.c", exp: now / 1000 - 1 }), now)).toBe(true);
    });

    it("is true for garbage", () => {
        expect(isTokenExpired("not-a-jwt", now)).toBe(true);
    });
});

describe("tokenStorage.clear", () => {
    it("also removes keys left behind by the previous version of the app", () => {
        localStorage.setItem("JWT_TOKEN", "t");
        localStorage.setItem("IS_ADMIN", "true");
        localStorage.setItem("USER", "{}");

        tokenStorage.clear();

        expect(localStorage.length).toBe(0);
    });
});
