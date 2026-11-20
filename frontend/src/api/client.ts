import axios from "axios";
import { tokenStorage } from "../utils/tokenStorage";

/** Shared axios instance. All requests go through here so auth and errors are handled in one place. */
export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
    const token = tokenStorage.get();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Called when the backend answers 401 for a request that carried a token, i.e. the token
 * expired or the user was suspended. AuthProvider registers a handler that logs the user out.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
    onUnauthorized = handler;
}

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401 && error.config?.headers?.Authorization) {
            onUnauthorized?.();
        }
        return Promise.reject(error);
    },
);
