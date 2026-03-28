"use client";

import { PostCard } from "./PostCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Post } from "@/types";

interface FeedListProps {
    initialPosts?: Post[];
}

export function FeedList({ initialPosts = [] }: FeedListProps) {
    const { ref, items } = useInfiniteScroll<Post>({
        initialItems: initialPosts,
        fetchUrl: "/api/posts/feed",
    });

    return (
        <div className="flex flex-col gap-4">
            {items.map((post) => (
                <PostCard key={post.id} post={post} />
            ))}
            <div ref={ref} className="h-4" />
        </div>
    );
}
