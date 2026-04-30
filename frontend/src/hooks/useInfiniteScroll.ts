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
        if (isLoading || !hasMore) return;
        setIsLoading(true);
        try {
            const res = await apiClient.get<any>(`${fetchUrl}?page=${page}&limit=${limit}`);
            const data: T[] = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
            
            if (data.length < limit) setHasMore(false);
            setItems((prev) => [...prev, ...data]);
            setPage((p) => p + 1);
        } catch {
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [fetchUrl, page, limit, isLoading, hasMore]);

  
    useEffect(() => {
        if (hasFetchedOnce.current) return;
        hasFetchedOnce.current = true;
        loadMore();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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