import { describe, expect, it } from "vitest";
import { imageSrc, videoSrc } from "./media";

describe("imageSrc", () => {
    it("detects the image type from the Base64 data", () => {
        expect(imageSrc("/9j/4AAQ")).toBe("data:image/jpeg;base64,/9j/4AAQ");
        expect(imageSrc("iVBORw0KGgoAAA")).toBe("data:image/png;base64,iVBORw0KGgoAAA");
    });

    it("returns undefined when there is no image", () => {
        expect(imageSrc(null)).toBeUndefined();
        expect(imageSrc("")).toBeUndefined();
    });
});

describe("videoSrc", () => {
    it("defaults to mp4 and detects webm", () => {
        expect(videoSrc("AAAAIGZ0eXA")).toBe("data:video/mp4;base64,AAAAIGZ0eXA");
        expect(videoSrc("GkXfo59ChoEB")).toBe("data:video/webm;base64,GkXfo59ChoEB");
    });
});
