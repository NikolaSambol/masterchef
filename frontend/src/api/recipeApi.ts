import type { Page, Recipe, RecipeSummary } from "../types";
import { getErrorStatus } from "../utils/errors";
import { apiClient } from "./client";

export interface RecipeQuery {
    page: number;
    size: number;
    categoryId?: number | null;
    recipeName?: string | null;
}

/** Fields of the multipart form the backend binds to CreateRecipeRequest. */
export interface RecipeFormValues {
    name: string;
    preparationTime: string;
    category?: number | null;
    image?: File | null;
    video?: File | null;
    /** Only used on update: remove the existing video. */
    deleteVideo?: boolean;
}

function toFormData(values: RecipeFormValues): FormData {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("preparationTime", values.preparationTime);
    if (values.category != null) formData.append("category", String(values.category));
    if (values.image) formData.append("image", values.image);
    if (values.video) formData.append("video", values.video);
    if (values.deleteVideo) formData.append("deleteVideo", "true");
    return formData;
}

export const recipeApi = {
    async getPage({ page, size, categoryId, recipeName }: RecipeQuery, signal?: AbortSignal): Promise<Page<Recipe>> {
        const { data } = await apiClient.get<Page<Recipe>>("/recipes/public", {
            params: {
                page,
                size,
                // undefined params are left out of the query string
                categoryId: categoryId ?? undefined,
                recipeName: recipeName || undefined,
            },
            signal,
        });
        return data;
    },

    async getFrontPage(signal?: AbortSignal): Promise<Recipe[]> {
        const { data } = await apiClient.get<Recipe[]>("/recipes/public/frontpage", { signal });
        return data;
    },

    async getById(id: number, signal?: AbortSignal): Promise<Recipe> {
        const { data } = await apiClient.get<Recipe>(`/recipes/public/${id}`, { signal });
        return data;
    },

    /** Recipes of the logged-in user. */
    async getMine(signal?: AbortSignal): Promise<Recipe[]> {
        const { data } = await apiClient.get<Recipe[]>("/recipes/user", { signal });
        return data;
    },

    /**
     * Recipe summaries of a user (or of the logged-in user when `userId` is omitted).
     * The backend answers 404 when the user has no recipes, which we treat as an empty list.
     */
    async getSummariesByUser(userId?: number, signal?: AbortSignal): Promise<RecipeSummary[]> {
        try {
            const url = userId === undefined ? "/recipes" : `/recipes/${userId}`;
            const { data } = await apiClient.get<RecipeSummary[]>(url, { signal });
            return data;
        } catch (error) {
            if (getErrorStatus(error) === 404) return [];
            throw error;
        }
    },

    /** Returns the id of the new recipe. */
    async create(values: RecipeFormValues): Promise<number> {
        const { data } = await apiClient.post<number>("/recipes", toFormData(values));
        return data;
    },

    async update(id: number, values: RecipeFormValues): Promise<void> {
        await apiClient.post(`/recipes/update/${id}`, toFormData(values));
    },

    async remove(id: number): Promise<void> {
        await apiClient.delete(`/recipes/delete/${id}`);
    },
};
