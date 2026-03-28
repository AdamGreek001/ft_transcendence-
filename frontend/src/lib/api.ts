import axios from "axios";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://localhost/api";

const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Attach JWT token to every request
instance.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Handle 401 by redirecting to login
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    },
);

export const apiClient = {
    get: async <T>(url: string, config?: Parameters<typeof instance.get>[1]): Promise<T> => {
        const { data } = await instance.get<T>(url, config);
        return data;
    },
    post: async <T>(url: string, body?: unknown): Promise<T> => {
        const { data } = await instance.post<T>(url, body);
        return data;
    },
    put: async <T>(url: string, body?: unknown): Promise<T> => {
        const { data } = await instance.put<T>(url, body);
        return data;
    },
    patch: async <T>(url: string, body?: unknown): Promise<T> => {
        const { data } = await instance.patch<T>(url, body);
        return data;
    },
    delete: async <T>(url: string): Promise<T> => {
        const { data } = await instance.delete<T>(url);
        return data;
    },
};
