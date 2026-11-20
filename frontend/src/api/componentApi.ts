import type { RecipeComponent } from "../types";
import { apiClient } from "./client";

export interface ComponentFormValues {
    name: string;
    instructions: string;
    ingredients: string[];
    image?: File | null;
}

/**
 * The backend (ComponentServiceImpl.parseComponents) expects keys like
 * `components[0][name]`, `components[0][ingredients][1]`, `components[0][image]`.
 */
function toFormData(components: ComponentFormValues[]): FormData {
    const formData = new FormData();
    components.forEach((component, index) => {
        const prefix = `components[${index}]`;
        formData.append(`${prefix}[name]`, component.name);
        formData.append(`${prefix}[instructions]`, component.instructions);
        component.ingredients.forEach((ingredient, i) => {
            formData.append(`${prefix}[ingredients][${i}]`, ingredient);
        });
        if (component.image) {
            formData.append(`${prefix}[image]`, component.image);
        }
    });
    return formData;
}

export const componentApi = {
    async getForRecipe(recipeId: number, signal?: AbortSignal): Promise<RecipeComponent[]> {
        const { data } = await apiClient.get<RecipeComponent[]>(`/components/public/${recipeId}`, { signal });
        return data;
    },

    async create(recipeId: number, components: ComponentFormValues[]): Promise<void> {
        await apiClient.post(`/components/${recipeId}`, toFormData(components));
    },

    /** Components are matched to the existing ones by position, so keep the original order. */
    async update(recipeId: number, components: ComponentFormValues[]): Promise<void> {
        await apiClient.post(`/components/update/${recipeId}`, toFormData(components));
    },

    async remove(componentId: number): Promise<void> {
        await apiClient.delete(`/components/delete/${componentId}`);
    },
};
