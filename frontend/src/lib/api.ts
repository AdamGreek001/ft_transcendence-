import axios from "axios";
import Cookies from "js-cookie";
import { AxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost/api";

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request and handle FormData
instance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 by redirecting to login, and retry 429 (rate limited)
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      Cookies.remove("token", { path: "/" });
      window.location.href = "/login";
    }

    // Retry once on 429 (Too Many Requests) after a short delay
    if (error.response?.status === 429 && !error.config.__retried) {
      error.config.__retried = true;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return instance(error.config);
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

export const api = {
  posts: {
  getFeed: (page = 1, limit = 20) =>
    apiClient.get<any>(`/posts/feed?page=${page}&limit=${limit}`),
  create: (content: string, imageUrl?: string) =>
    apiClient.post<any>("/posts", { content, imageUrl }),
  like: (postId: string) =>
    apiClient.post<{ liked: boolean }>(`/posts/${postId}/like`),
  share: (postId: string) =>
    apiClient.post<{ shared: boolean }>(`/posts/${postId}/share`),
  delete: (postId: string) =>
    apiClient.delete<void>(`/posts/${postId}`),
},

  comments: {
  getAll: (postId: string, page = 1) =>
    apiClient.get<any>(`/posts/${postId}/comments?page=${page}`),
  create: (postId: string, content: string, parentId?: string) =>
    apiClient.post<any>(`/posts/${postId}/comments`, { content, parentId }),
},

  media: {
  uploadPost: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ url: string }>("/media/upload/post", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
},
};