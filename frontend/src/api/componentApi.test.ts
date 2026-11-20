import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { componentApi } from "./componentApi";

afterEach(() => vi.restoreAllMocks());

describe("componentApi.create", () => {
    it("sends the multipart keys the backend's parseComponents() expects", async () => {
        const post = vi.spyOn(apiClient, "post").mockResolvedValue({ data: undefined });
        const image = new File(["x"], "dough.png", { type: "image/png" });

        await componentApi.create(7, [
            { name: "Tijesto", instructions: "Umijesiti sve.", ingredients: ["brašno", "jaja"], image },
            { name: "Nadjev", instructions: "Pomiješati.", ingredients: ["sir"] },
        ]);

        expect(post).toHaveBeenCalledOnce();
        const [url, body] = post.mock.calls[0] as [string, FormData];
        expect(url).toBe("/components/7");
        expect(Object.fromEntries(body.entries())).toEqual({
            "components[0][name]": "Tijesto",
            "components[0][instructions]": "Umijesiti sve.",
            "components[0][ingredients][0]": "brašno",
            "components[0][ingredients][1]": "jaja",
            "components[0][image]": expect.any(File),
            "components[1][name]": "Nadjev",
            "components[1][instructions]": "Pomiješati.",
            "components[1][ingredients][0]": "sir",
        });
    });
});
