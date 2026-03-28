import { Avatar } from "@/components/ui";
import type { UserProfile } from "@/types";

interface ProfileHeaderProps {
    user: UserProfile;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-6">
                <Avatar src={user.avatarUrl} alt={user.username} size={96} />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {user.displayName || `@${user.username}`}
                    </h1>
                    {user.bio && (
                        <p className="mt-1 max-w-md text-sm text-gray-500">{user.bio}</p>
                    )}
                    <div className="mt-3 flex gap-6 text-sm text-gray-600">
                        <span><strong>{user.postsCount}</strong> Posts</span>
                        <span><strong>{user.followersCount}</strong> Followers</span>
                        <span><strong>{user.followingCount}</strong> Following</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
