"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar } from "@/components/ui";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { apiClient, api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

// import your existing PostCard and normalizeAvatarUrl
import { PostCard, normalizeAvatarUrl } from "@/app/feed/page";
import { FollowListModal } from "@/components/profile/FollowingListModal";

type Tab = "posts" | "saved";

interface ProfilePageProps {
    params: Promise<{ username: string }>;
}

interface UserProfileResponse {
    id: string;
    username: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    _count: {
        posts: number;
        followers: number;
        following: number;
    };
}

interface FollowingRelation {
    followingId: string;
    following?: { id: string };
}

interface FollowerRelation {
    followerId: string;
    follower?: { id: string };
}

interface StartConversationResponse {
    id: string;
}

export default function ProfilePage({ params }: ProfilePageProps) {
    const router = useRouter();
    const { user: currentUser } = useAuth();

    const [username, setUsername] = useState<string>("");
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFriend, setIsFriend] = useState(false);
    const [profileFollowsCurrent, setProfileFollowsCurrent] = useState(false);
    const [isFollowBusy, setIsFollowBusy] = useState(false);
    const [isStartChatBusy, setIsStartChatBusy] = useState(false);
    const [isNavSidebarOpen, setIsNavSidebarOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // tabs
    const [activeTab, setActiveTab] = useState<Tab>("posts");
    const [followModal, setFollowModal] = useState<{
        open: boolean;
        tab: "followers" | "following";
    } | null>(null);

    const {
        items: posts,
        isLoading: postsLoading,
        hasMore: hasMorePosts,
        ref: postsLoaderRef,
        setItems: setPosts,
    } = useInfiniteScroll<any>({
        fetchUrl: profile ? `/posts/user/${profile.username}` : "",
        limit: 20,
    });
    
    const {
        items: savedPosts,
        isLoading: savedLoading,
        hasMore: hasMoreSaved,
        ref: savedLoaderRef,
    } = useInfiniteScroll<any>({
        fetchUrl: "/posts/saved",
        limit: 20,
    });

    const loadProfile = async () => {
        const resolved = await params;
        setUsername(resolved.username);
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.get<UserProfileResponse & { isFollowing?: boolean }>(
                `/users/${resolved.username}?currentUserId=${currentUser?.id ?? ""}`
            );
            setProfile(data);
            setIsFollowing(data.isFollowing ?? false);
        } catch (err: any) {
            const status = err?.response?.status;
            setProfile(null);
            setError(status === 404 ? "not_found" : "load_error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowChangeFromModal = (userId: string, nowFollowing: boolean) => {
      // if the profile user themselves was followed/unfollowed from the modal
      if (userId === profile?.id) {
        setIsFollowing(nowFollowing);
        setProfile((prev) => {
          if (!prev) return prev;
          const followers = prev._count?.followers ?? 0;
          return {
            ...prev,
            _count: {
              ...prev._count,
              followers: nowFollowing
                ? followers + 1
                : Math.max(0, followers - 1),
            },
          };
        });
        setIsFriend(nowFollowing ? profileFollowsCurrent : false);
      }
    };

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            const resolved = await params;
            if (cancelled) return;
            setUsername(resolved.username);
            setIsLoading(true);
            setError(null);
            try {
                const data = await apiClient.get<UserProfileResponse & { 
                    isFollowing?: boolean;
                    isFollowedBy?: boolean; // ← add this
                }>(
                    `/users/${resolved.username}?currentUserId=${currentUser?.id ?? ""}`
                );
                if (cancelled) return;
                setProfile(data);
                setIsFollowing(data.isFollowing ?? false);
                setProfileFollowsCurrent(data.isFollowedBy ?? false); // ← add this
                setIsFriend((data.isFollowing ?? false) && (data.isFollowedBy ?? false)); // ← add this
            } catch (err: any) {
                if (cancelled) return;
                const status = err?.response?.status;
                setProfile(null);
                setError(status === 404 ? "not_found" : "load_error");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [params, currentUser?.id]);
    
    const handleToggleFollow = async () => {
        if (!profile) return;
        setIsFollowBusy(true);
        try {
            if (isFollowing) {
                await apiClient.delete(`/users/${profile.id}/follow`);
                setIsFollowing(false);
                setIsFriend(false);
            } else {
                await apiClient.post(`/users/${profile.id}/follow`);
                setIsFollowing(true);
                setIsFriend(profileFollowsCurrent); // ← friend only if they follow back
            }
            setProfile((prev) => {
                if (!prev) return prev;
                const followers = prev._count?.followers ?? 0;
                return {
                    ...prev,
                    _count: {
                        ...prev._count,
                        followers: isFollowing
                            ? Math.max(0, followers - 1)
                            : followers + 1,
                    },
                };
            });
        } catch (error) {
            console.error("Failed to toggle follow:", error);
        } finally {
            setIsFollowBusy(false);
        }
    };

    const handleStartChat = async () => {
        if (!profile?.id || !isFriend) return;
        setIsStartChatBusy(true);
        try {
            const conv = await apiClient.post<StartConversationResponse>("/chat/conversations/start", {
                userId: profile.id,
            });
            router.push(`/messages?conversationId=${conv.id}`);
        } catch (error) {
            console.error("Failed to start chat:", error);
        } finally {
            setIsStartChatBusy(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen bg-[#0d0d0f]">
                <div className="hidden lg:block"><AppSidebar /></div>
                <div className="flex-1 flex items-center justify-center text-slate-500">Loading profile...</div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex h-screen bg-[#0d0d0f]">
                <div className="hidden lg:block"><AppSidebar /></div>
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    {error === "not_found" ? `User @${username} not found.` : (
                        <div className="flex flex-col items-center gap-3">
                            <span>Failed to load profile.</span>
                            <button onClick={loadProfile} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition">
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const isOwnProfile = currentUser?.username === profile.username;
    const currentPosts = activeTab === "posts" ? posts : savedPosts;

    return (
        <div className="flex min-h-screen md:h-[100dvh] bg-[#0d0d0f]">
            {isNavSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button type="button" onClick={() => setIsNavSidebarOpen(false)} className="absolute inset-0 bg-black/60" />
                    <div className="relative h-full w-[min(82vw,18rem)]">
                        <AppSidebar />
                    </div>
                </div>
            )}

            <div className="hidden lg:block"><AppSidebar /></div>

            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#0d0d0f]/95 backdrop-blur z-10 px-4 py-3 border-b border-gray-800/50">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setIsNavSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-800/50 rounded-full transition text-gray-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-semibold text-white">@{profile.username}</h1>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

                    {/* Cover / Profile header */}
                    <div className="rounded-2xl border border-slate-800 bg-[#1a1a1a] overflow-hidden">

                        {/* Cover banner */}
                        <div className="h-32 w-full" style={{ background: "linear-gradient(135deg, #1a0533 0%, #2d1b69 50%, #0f0f1a 100%)" }} />

                        {/* Avatar + info */}
                        <div className="px-6 pb-6">
                            <div className="flex items-end justify-between -mt-10 mb-4">
                                <div className="rounded-full border-4 border-[#1a1a1a] overflow-hidden">
                                    <Avatar
                                        src={normalizeAvatarUrl(profile.avatarUrl, profile.username)}
                                        alt={profile.username}
                                        size={80}
                                    />
                                </div>
                                {!isOwnProfile && (
                                    <div className="flex gap-2 mb-1">
                                        <button
                                            onClick={handleToggleFollow}
                                            disabled={isFollowBusy}
                                            className={`px-5 py-2 rounded-full text-sm font-bold text-white transition ${isFollowing ? "bg-slate-700 hover:bg-slate-600" : "bg-[#895af6] hover:opacity-90"}`}
                                        >
                                            {isFollowBusy ? "..." : isFollowing ? "Following" : "Follow"}
                                        </button>
                                        {isFriend && (
                                            <button
                                                onClick={handleStartChat}
                                                disabled={isStartChatBusy}
                                                className="px-5 py-2 rounded-full text-sm font-bold text-white bg-slate-700 hover:bg-slate-600 transition"
                                            >
                                                {isStartChatBusy ? "..." : "Message"}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {/* Name + username */}
                            <div className="flex flex-col gap-1 mb-3">
                                <h1 className="text-xl font-bold text-white">
                                    {profile.displayName || profile.username}
                                </h1>
                                <span className="text-sm text-slate-500">@{profile.username}</span>
                            </div>
                            
                            {/* Bio */}
                            {profile.bio && (
                                <p className="text-sm text-slate-300 leading-relaxed mb-4">{profile.bio}</p>
                            )}

                            {/* Stats */}
                            <div className="flex gap-6 text-sm">
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-white">{profile._count?.posts ?? 0}</span>
                                <span className="text-slate-500 text-xs">Posts</span>
                              </div>
                              <button
                                onClick={() => setFollowModal({ open: true, tab: "followers" })}
                                className="flex flex-col items-center hover:opacity-70 transition-opacity"
                              >
                                <span className="font-bold text-white">{profile._count?.followers ?? 0}</span>
                                <span className="text-slate-500 text-xs">Followers</span>
                              </button>
                              <button
                                onClick={() => setFollowModal({ open: true, tab: "following" })}
                                className="flex flex-col items-center hover:opacity-70 transition-opacity"
                              >
                                <span className="font-bold text-white">{profile._count?.following ?? 0}</span>
                                <span className="text-slate-500 text-xs">Following</span>
                              </button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs — only show saved on own profile */}
                    <div className="sticky top-0 z-50 bg-[#1a1a1a] border-b border-slate-800">
                        <div className="flex gap-1 p-1 rounded-xl">
                            <button
                                onClick={() => setActiveTab("posts")}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                    activeTab === "posts"
                                        ? "bg-[#895af6] text-white shadow-lg shadow-[#895af6]/20"
                                        : "text-slate-500 hover:text-slate-300"
                                }`}
                            >
                                Posts
                            </button>
                            
                            {isOwnProfile && (
                                <button
                                    onClick={() => setActiveTab("saved")}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                        activeTab === "saved"
                                            ? "bg-[#895af6] text-white shadow-lg shadow-[#895af6]/20"
                                            : "text-slate-500 hover:text-slate-300"
                                    }`}
                                >
                                    Saved
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Posts list */}
                    {activeTab === "posts" && (
                        <>
                            {postsLoading && posts.length === 0 && (
                                <div className="text-center text-slate-500 py-8">Loading...</div>
                            )}
                            {!postsLoading && posts.length === 0 && (
                                <div className="text-center text-slate-500 py-8">No posts yet</div>
                            )}
                            <div className="flex flex-col gap-6">
                                {posts.map((post: any) => (
                                    <PostCard
                                        key={post.feedItemId || post.id}
                                        {...post}
                                        currentUser={currentUser}
                                    />
                                ))}
                            </div>
                            <div ref={postsLoaderRef} className="py-4 flex justify-center">
                                {postsLoading && posts.length > 0 && (
                                    <div className="text-slate-500 text-sm animate-pulse">Loading more...</div>
                                )}
                                {!hasMorePosts && posts.length > 0 && (
                                    <div className="text-slate-600 text-sm">No more posts</div>
                                )}
                            </div>
                        </>
                    )}
                    
                    {activeTab === "saved" && isOwnProfile && (
                        <>
                            {savedLoading && savedPosts.length === 0 && (
                                <div className="text-center text-slate-500 py-8">Loading...</div>
                            )}
                            {!savedLoading && savedPosts.length === 0 && (
                                <div className="text-center text-slate-500 py-8">No saved posts</div>
                            )}
                            <div className="flex flex-col gap-6">
                                {savedPosts.map((post: any) => (
                                    <PostCard
                                        key={post.feedItemId || post.id}
                                        {...post}
                                        currentUser={currentUser}
                                    />
                                ))}
                            </div>
                            <div ref={savedLoaderRef} className="py-4 flex justify-center">
                                {savedLoading && savedPosts.length > 0 && (
                                    <div className="text-slate-500 text-sm animate-pulse">Loading more...</div>
                                )}
                                {!hasMoreSaved && savedPosts.length > 0 && (
                                    <div className="text-slate-600 text-sm">No more saved posts</div>
                                )}
                            </div>
                        </>
                    )}
                    {/* at the bottom of the return */}
                    {followModal?.open && (
                      <FollowListModal
                        profileId={profile.id}
                        profileUsername={profile.username}
                        initialTab={followModal.tab}
                        followerCount={profile._count?.followers ?? 0}
                        followingCount={profile._count?.following ?? 0}
                        handleClose={() => setFollowModal(null)}
                        onFollowChange={handleFollowChangeFromModal} // ← add this
                      />
                    )}
                </div>
            </main>
        </div>
    );
}