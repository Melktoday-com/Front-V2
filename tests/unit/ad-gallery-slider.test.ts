import { describe, expect, it } from "vitest";
import { AdGallerySlider } from "@/scenes/single-add/AdGallerySlider";
import { AdStoryModal } from "@/scenes/single-add/AdStoryModal";

describe("AdGallerySlider & AdStoryModal", () => {
    it("should export AdGallerySlider and AdStoryModal components", () => {
        expect(AdGallerySlider).toBeDefined();
        expect(typeof AdGallerySlider).toBe("function");

        expect(AdStoryModal).toBeDefined();
        expect(typeof AdStoryModal).toBe("function");
    });
});
