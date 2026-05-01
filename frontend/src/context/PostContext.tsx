"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface PostState {
  liked: boolean;
  likeCount: number;
  shared: boolean;
  shareCount: number;
  saved: boolean;
  commentCount: number;
  deleted: boolean;
  hidden: boolean;
}

interface PostContextValue {
  getState: (postId: string) => PostState | null;
  setState: (postId: string, update: Partial<PostState>) => void;
}

const PostContext = createContext<PostContextValue | null>(null);

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [states, setStates] = useState<Record<string, PostState>>({});

  const getState = useCallback((postId: string) => {
    return states[postId] ?? null;
  }, [states]);

  const setState = useCallback((postId: string, update: Partial<PostState>) => {
    setStates((prev) => ({
      ...prev,
      [postId]: { ...prev[postId], ...update },
    }));
  }, []);

  return (
    <PostContext.Provider value={{ getState, setState }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePostContext() {
  const ctx = useContext(PostContext);
  if (!ctx) throw new Error("usePostContext must be inside PostProvider");
  return ctx;
}