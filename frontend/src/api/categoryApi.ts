import type { Category } from "../types";
import { apiClient } from "./client";

export const categoryApi = {
    async getAll(signal?: AbortSignal): Promise<Category[]> {
        const { data } = await apiClient.get<Category[]>("/categories/public", { signal });
        return data;
    },

    async create(categoryName: string): Promise<void> {
        await apiClient.post("/categories", { categoryName });
    },

    async update(id: number, categoryName: string): Promise<void> {
        await apiClient.post(`/categories/update/${id}`, { categoryName });
    },

    /** Fails with 400 while recipes still use the category. */
    async remove(id: number): Promise<void> {
        await apiClient.delete(`/categories/${id}`);
    },
};
