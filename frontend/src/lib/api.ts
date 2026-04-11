import axios from "axios";
import Cookies from "js-cookie";
import { AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost/api";

const instance = axios.create({
<<<<<<< HEAD
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
=======
    baseURL: API_BASE_URL,
    timeout: 10000,
>>>>>>> origin
});

// Attach JWT token to every request and handle FormData
instance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
<<<<<<< HEAD
  }
  return config;
=======
    
    // Only set Content-Type for non-FormData requests
    if (!(config.data instanceof FormData)) {
        config.headers["Content-Type"] = "application/json";
    }
    
    return config;
>>>>>>> origin
});

// Handle 401 by redirecting to login
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("token", { path: "/" });
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const apiClient = {
  get: async <T>(
    url: string,
    config?: Parameters<typeof instance.get>[1],
  ): Promise<T> => {
    console.log("Calling URL:", API_BASE_URL + url);
    const { data } = await instance.get<T>(url, config);
    return data;
  },
  post: async <T>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const { data } = await instance.post<T>(url, body, config);
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
