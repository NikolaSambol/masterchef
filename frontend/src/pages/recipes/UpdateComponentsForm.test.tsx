import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { componentApi } from "../../api/componentApi";
import { UpdateComponentsForm } from "./UpdateComponentsForm";

vi.mock("../../api/componentApi", () => ({
    componentApi: {
        getForRecipe: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
    },
}));

const api = vi.mocked(componentApi);

beforeEach(() => {
    vi.clearAllMocks();
    api.getForRecipe.mockResolvedValue([
        {
            id: 11,
            componentName: "Tijesto",
            imagePath: null,
            ingredients: "brašno, jaja",
            instruction: "Umijesiti tijesto.",
        },
        {
            id: 12,
            componentName: "Nadjev",
            imagePath: null,
            ingredients: "sir",
            instruction: "Pomiješati sve sastojke.",
        },
    ]);
    api.update.mockResolvedValue();
    api.remove.mockResolvedValue();
});

function renderForm() {
    const onSaved = vi.fn();
    render(<UpdateComponentsForm recipeId={5} onSaved={onSaved} onCancel={() => {}} />);
    return { onSaved };
}

describe("UpdateComponentsForm", () => {
    it("splits the stored ingredient string into separate inputs", async () => {
        renderForm();
        expect(await screen.findByDisplayValue("brašno")).toBeInTheDocument();
        expect(screen.getByDisplayValue("jaja")).toBeInTheDocument();
    });

    it("deletes removed components only when saving, then updates the rest in order", async () => {
        const user = userEvent.setup();
        const { onSaved } = renderForm();
        await screen.findByDisplayValue("Tijesto");

        await user.click(screen.getAllByRole("button", { name: "Ukloni komponentu" })[0]);
        expect(api.remove).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "Spremi komponente" }));

        expect(api.remove).toHaveBeenCalledWith(11);
        expect(api.update).toHaveBeenCalledWith(5, [
            { name: "Nadjev", instructions: "Pomiješati sve sastojke.", ingredients: ["sir"], image: null },
        ]);
        expect(onSaved).toHaveBeenCalled();
    });

    it("never calls the delete endpoint for a component that was never saved", async () => {
        const user = userEvent.setup();
        renderForm();
        await screen.findByDisplayValue("Tijesto");

        await user.click(screen.getByRole("button", { name: "Dodaj novu komponentu" }));
        const removeButtons = screen.getAllByRole("button", { name: "Ukloni komponentu" });
        await user.click(removeButtons[removeButtons.length - 1]);
        await user.click(screen.getByRole("button", { name: "Spremi komponente" }));

        expect(api.remove).not.toHaveBeenCalled();
        expect(api.update).toHaveBeenCalledOnce();
    });

    it("blocks saving and shows errors when required fields are empty", async () => {
        const user = userEvent.setup();
        renderForm();
        await screen.findByDisplayValue("Tijesto");

        await user.clear(screen.getByDisplayValue("Tijesto"));
        await user.click(screen.getByRole("button", { name: "Spremi komponente" }));

        expect(screen.getByText("Naziv komponente je obavezan.")).toBeInTheDocument();
        expect(api.update).not.toHaveBeenCalled();
    });
});
