import { Avatar } from "@/components/ui";
import type { Post } from "@/types";

interface PostCardProps {
    post: Post;
}

export function PostCard({ post }: PostCardProps) {
    return (
        <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center gap-3">
                <Avatar src={post.author.avatarUrl} alt={post.author.username} size={36} />
                <div>
                    <p className="text-sm font-semibold text-gray-900">
                        @{post.author.username}
                    </p>
                    <p className="text-xs text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
                {post.content}
            </p>
            <div className="mt-4 flex gap-4 text-xs text-gray-500">
                <button className="transition hover:text-primary-600">
                    ♥ {post.likesCount}
                </button>
                <button className="transition hover:text-primary-600">
                    💬 {post.commentsCount}
                </button>
            </div>
        </article>
    );
}
