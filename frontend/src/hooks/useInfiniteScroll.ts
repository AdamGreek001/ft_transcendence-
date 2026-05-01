"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiClient } from "@/lib/api";

interface UseInfiniteScrollOptions<T> {
    initialItems?: T[];
    fetchUrl: string;
    limit?: number;
}

export function useInfiniteScroll<T extends { id: string }>({
    initialItems = [],
    fetchUrl,
    limit = 20,
}: UseInfiniteScrollOptions<T>) {
    const [items, setItems] = useState<T[]>(initialItems);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const hasFetchedOnce = useRef(false); 

    
    const loadMore = useCallback(async () => {
        if (isLoading || !hasMore || !fetchUrl) return;
        setIsLoading(true);
        try {
            const res = await apiClient.get<any>(`${fetchUrl}?page=${page}&limit=${limit}`);
            const data: T[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    
            setItems((prev) => {
                const existingIds = new Set(prev.map((p) => (p as any).feedItemId || p.id));
                const unique = data.filter((p) => !existingIds.has((p as any).feedItemId || p.id));
                if (data.length < limit) setHasMore(false);
                return [...prev, ...unique];
            });
            setPage((p) => p + 1);
        } catch {
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [fetchUrl, page, limit, isLoading, hasMore]);

  
    useEffect(() => {
        if (!fetchUrl) return;
        if (hasFetchedOnce.current) return;
        hasFetchedOnce.current = true;
        loadMore();
    }, [fetchUrl]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) loadMore();
            },
            { threshold: 0.5 },
        );

        const el = ref.current;
        if (el) observer.observe(el);
        return () => {
            if (el) observer.unobserve(el);
        };
    }, [loadMore]);

    return { items, isLoading, hasMore, ref, setItems };
}