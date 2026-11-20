import type { LoginResponse, User } from "../types";
import { apiClient } from "./client";

export interface UpdateUserRequest {
    name: string;
    surname: string;
    email: string;
}

export const userApi = {
    /** Admin only. */
    async getAll(signal?: AbortSignal): Promise<User[]> {
        const { data } = await apiClient.get<User[]>("/admin/users", { signal });
        return data;
    },

    /** Admin only. */
    async getById(id: number, signal?: AbortSignal): Promise<User> {
        const { data } = await apiClient.get<User>(`/admin/user/${id}`, { signal });
        return data;
    },

    /**
     * The backend returns a fresh token for the edited user when the email is sent
     * (the email is the JWT subject), otherwise an empty body.
     */
    async update(id: number, request: UpdateUserRequest): Promise<LoginResponse | null> {
        const { data } = await apiClient.post<LoginResponse | "">(`/users/${id}`, request);
        return data && typeof data === "object" && data.jwtToken ? data : null;
    },

    async remove(id: number): Promise<void> {
        await apiClient.delete(`/users/${id}`);
    },

    /** Admin only. */
    async suspend(id: number): Promise<void> {
        await apiClient.post(`/admin/suspend-user/${id}`);
    },
};
