import type { LoginResponse, User } from "../types";
import { apiClient } from "./client";

export interface SigninRequest {
    email: string;
    password: string;
}

export interface SignupRequest {
    name: string;
    surname: string;
    email: string;
    password: string;
}

export interface ChangePasswordRequest {
    newPassword: string;
    /** Required when users change their own password; omitted when an admin resets someone else's. */
    oldPassword?: string;
}

export const authApi = {
    async signin(request: SigninRequest): Promise<LoginResponse> {
        const { data } = await apiClient.post<LoginResponse>("/auth/public/signin", request);
        return data;
    },

    async signup(request: SignupRequest): Promise<void> {
        await apiClient.post("/auth/public/signup", request);
    },

    async getCurrentUser(signal?: AbortSignal): Promise<User> {
        const { data } = await apiClient.get<User>("/auth/user", { signal });
        return data;
    },

    async changePassword(userId: number, request: ChangePasswordRequest): Promise<void> {
        await apiClient.post(`/auth/change-password/${userId}`, request);
    },
};
