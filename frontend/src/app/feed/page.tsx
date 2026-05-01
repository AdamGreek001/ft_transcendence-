"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { api, apiClient } from "@/lib/api";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { toast } from "@/lib/toast";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { PostProvider, usePostContext } from "@/context/PostContext";

// ============================================================
// TYPES — ready for real API data later
// ============================================================

interface UserSuggestion {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isFollowing: boolean;
}

interface User {
  username: string;
  image_profile: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  replies?: Comment[];
}

interface Post {
  id: string;
  feedItemId?: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  _count?: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLikedByMe?: boolean;
  isSharedByMe?: boolean;
  isSavedByMe?: boolean;
  sharedBy?: {
    username: string;
    avatarUrl: string | null;
  } | null;
  originalPostId?: string;
}



// ============================================================
// AVATAR URL NORMALIZER (same as AppSidebar)
// ============================================================

export function normalizeAvatarUrl(avatarUrl?: string | null, username?: string): string {
  if (!avatarUrl) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || "user"}`;
  }
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

   if (avatarUrl.startsWith("/images/")) {
    return avatarUrl;
  }
  
  const mediaBaseUrl = process.env.NEXT_PUBLIC_MEDIA_URL || "http://localhost:8080/uploads";
  const cleanBase = mediaBaseUrl.replace(/\/+$/, "");

  if (avatarUrl.startsWith("/uploads/")) {
    return avatarUrl;
  }
  if (avatarUrl.startsWith("/avatars/")) {
    return avatarUrl;
  }
  if (avatarUrl.startsWith("avatars/")) {
    return `/${avatarUrl}`;
  }
  return `/uploads/${avatarUrl.replace(/^\/+/, "")}`;
}

// ============================================================
// CREATE POST
// ============================================================

interface CreatePostProps {
  currentUser?: {
    avatarUrl: string | null;
    username: string;
  };
  onSubmit: (text: string, image?: File) => void;
}

interface PostCardProps extends Post {
  onShare: (post: Post) => void;
  onUnshare: (originalPostId: number) => void;
  sharedPostId?: number; // id of the shared copy in feed
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  
  return date.toLocaleDateString("en-US", { day: "numeric", month: "long" });
}

let globalTick = 0;
let listeners: (() => void)[] = [];

setInterval(() => {
  globalTick++;
  listeners.forEach((fn) => fn());
}, 60000);

function useRelativeTime(date: Date): string {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const update = () => forceUpdate((t) => t + 1);
    listeners.push(update);

    return () => {
      listeners = listeners.filter((l) => l !== update);
    };
  }, []);

  return getRelativeTime(date);
}


function CreatePost({ currentUser, onSubmit }: CreatePostProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_CONTENT_LENGTH = 2000;
  const isContentTooLong = text.length > MAX_CONTENT_LENGTH;
  const canPost = (text.trim().length > 0 || image !== null) && !isContentTooLong;

  const avatarUrl = normalizeAvatarUrl(
    currentUser?.avatarUrl,
    currentUser?.username
  );
  console.log("currentUser:", currentUser);
  console.log("avatarUrl:", avatarUrl);

    function CharCounter({ current, max }: { current: number; max: number }) {
  const remaining = max - current;
  const percentage = Math.min(current / max, 1);
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference;
  const isNearLimit = remaining <= 20;
  const isOverLimit = remaining < 0;
  const displayValue = remaining < -1000 ? "..." : remaining;

  const strokeColor = isOverLimit ? "#ef4444" : isNearLimit ? "#f59e0b" : "#895af6";

  return (
    <div className="flex items-center gap-2">
      {isNearLimit && (
        <span className={`text-xs font-bold ${isOverLimit ? "text-red-400" : "text-slate-400"}`}>
          {displayValue}
        </span>
      )}
      <svg width="24" height="24" className="-rotate-90">
        {/* background circle */}
        <circle
          cx="12" cy="12" r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth="2"
        />
        {/* progress circle */}
        <circle
          cx="12" cy="12" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={isOverLimit ? 0 : strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.2s, stroke 0.2s" }}
        />
      </svg>
    </div>
  );
}
function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    toast.error("Only PNG, JPG, JPEG, WEBP images are allowed");
    setImage(null);
    setImagePreview(null);
    e.target.value = ""
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error("Image is too large (max 5MB)");
    setImage(null);
    setImagePreview(null);
    e.target.value = ""
    return;
  }

  setImage(file);
  setImagePreview(URL.createObjectURL(file));
}

  function handleRemoveImage() {
    setImage(null);
    setImagePreview(null);
  }

  async function handlePost() {
    if (!canPost) return;
  
    try {
      console.log("Posting:", text, image);
  
      await onSubmit(text, image ?? undefined);
      toast.success("Your post was sent");
  
      setText("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error("Slow down! Too many requests");
      }
      else {
      console.error("Create post error:", error);
      toast.error("Failed to create post. Please try again.");
      }
    }
  }

  return (
    <section className="bg-[#1a1a1a] rounded-2xl border border-slate-800 shadow-lg p-4 flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="size-10 rounded-full overflow-hidden shrink-0">
          <Avatar
            src={avatarUrl}
            alt="Your profile picture"
            size={40}
          />
        </div>
        <textarea
          className="w-full bg-transparent text-slate-100 resize-none py-2 text-sm custom-scrollbar outline-none overflow-y-auto max-h-32"
          placeholder="What's on your mind?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative w-full rounded-xl overflow-hidden">
          <img src={imagePreview} alt="preview" className="w-full h-auto max-h-64 object-cover rounded-xl" />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
          >
            <img src="/icons/close.svg" alt="remove" className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-800 pt-3">
        
        {/* Hidden file input */}
        <label className="flex items-center gap-2 text-slate-400 hover:text-[#895af6] transition-colors text-sm font-medium cursor-pointer">
          <img src="/icons/add-image.svg" alt="add image" className="w-5 h-5" />
          <span>Add Image</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />
        </label>
        <div className="flex items-center gap-3">
          {text.length > 0 && <CharCounter current={text.length} max={MAX_CONTENT_LENGTH} />}
        {/* Post button — disabled state when nothing to post */}
        <button
          onClick={handlePost}
          disabled={!canPost}
          className="bg-[#895af6] text-white px-6 py-2 rounded-full font-bold text-sm transition-opacity"
          style={{
            opacity: canPost ? 1 : 0.4,
            cursor: canPost ? "pointer" : "not-allowed",
          }}
        >
          Post
        </button>
        </div>

      </div>
    </section>
  );
}

// ============================================================
// COMMENT ITEM
// ============================================================

function CommentItem({ comment, onReply, isReply = false , currentUser}: {
  comment: Comment;
  onReply: (name: string, commentId: string) => void;
  isReply?: boolean;
  currentUser: any;
}) {
  const relativeTime = useRelativeTime(new Date(comment.createdAt));
  const router = useRouter();

return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <ProfileHoverCard author={comment.author} currentUser={currentUser}>
          <div 
              className="w-8 h-8 rounded-full overflow-hidden shrink-0 cursor-pointer"
              onClick={() => router.push(`/profile/${comment.author.username}`)}>
            <Avatar
              src={normalizeAvatarUrl(comment.author.avatarUrl, comment.author.username)}
              alt={comment.author.username}
              size={32}
              onClick={() => router.push(`/profile/${comment.author.username}`)}
            />
          </div>
        </ProfileHoverCard>
        <div className="flex flex-col gap-1 flex-1">
          <div className="px-3 py-2 rounded-2xl rounded-tl-none" style={{ backgroundColor: "#242424" }}>
            <ProfileHoverCard author={comment.author} currentUser={currentUser}>
              <span
                className="font-bold text-xs text-white block mb-0.5 cursor-pointer hover:underline"
                onClick={() => router.push(`/profile/${comment.author.username}`)}
              >
                {comment.author.username}
              </span>
            </ProfileHoverCard>
            <p className="text-sm text-slate-400 break-all">{comment.content}</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-slate-500 px-1">
            {!isReply && (
              <button
                onClick={() => onReply(comment.author.username, comment.id)}
                className="uppercase tracking-wider hover:text-[#895af6] transition-colors"
              >
                REPLY
              </button>
            )}
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 flex flex-col gap-3 border-l-2 border-slate-800 pl-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} isReply={true} currentUser={currentUser} />
          ))}
        </div>
      )}
    </div>
  );
}


// ============================================================
// COMMENT SECTION
// ============================================================

function CommentSection({ postId, currentUser, onCommentAdded }: {
  postId: string;
  currentUser: any;
  onCommentAdded?: () => void;
}) {
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ name: string; commentId: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const MAX_COMMENT_LENGTH = 500;
  const isCommentTooLong = commentText.length > MAX_COMMENT_LENGTH;
  const canComment = commentText.trim().length > 0 && !isCommentTooLong;
  const router = useRouter();

  
  useEffect(() => {
    async function loadComments() {
      try {
        const res = await api.comments.getAll(postId);
        // reverse so newest on top
        setCommentsList(res.data.reverse());
      } catch (err) {
        console.error("Load comments error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadComments();
  }, [postId]);

  
  function handleReply(name: string, commentId: string) {
  setReplyingTo({ name, commentId });
  setCommentText("");  // ← clean input, no @name prefix
}
  function CharCounter({ current, max }: { current: number; max: number }) {
  const remaining = max - current;
  const percentage = Math.min(current / max, 1);
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference;
  const isNearLimit = remaining <= 20;
  const isOverLimit = remaining < 0;
  const displayValue = remaining < -500 ? "..." : remaining;

  const strokeColor = isOverLimit ? "#ef4444" : isNearLimit ? "#f59e0b" : "#895af6";

  return (
    <div className="flex items-center gap-2">
      {isNearLimit && (
        <span className={`text-xs font-bold ${isOverLimit ? "text-red-400" : "text-slate-400"}`}>
          {displayValue}
        </span>
      )}
      <svg width="24" height="24" className="-rotate-90">
        {/* background circle */}
        <circle
          cx="12" cy="12" r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth="2"
        />
        {/* progress circle */}
        <circle
          cx="12" cy="12" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={isOverLimit ? 0 : strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.2s, stroke 0.2s" }}
        />
      </svg>
    </div>
  );
}
  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
  setCommentText(e.target.value);
  if (replyingTo && e.target.value.trim().length === 0) {
    setReplyingTo(null);
  }
}

  const [loadingComments, setLoadingComments] = useState(false);
  async function handleSend() {
  if (!canComment || loadingComments) return;
  setLoadingComments(true);
  try {
    const text = replyingTo
      ? commentText.replace(`@${replyingTo.name} `, "").trim()
      : commentText.trim();

    const created = await api.comments.create(
      postId,
      text,
      replyingTo?.commentId ?? undefined
    );

    if (replyingTo) {
      // attach reply under parent
      setCommentsList((prev) =>
        prev.map((c) =>
          c.id === replyingTo.commentId
            ? { ...c, replies: [...(c.replies || []), created] }
            : c
        )
      );
      toast.success(`Reply sent to @${replyingTo.name}`);
    } else {
      setCommentsList((prev) => [created, ...prev]);
      toast.success("Comment posted successfully");
    }
    onCommentAdded?.();

    setCommentText("");
    setReplyingTo(null);
  } catch (err : any) {
    if (err.response?.status === 429) {
      toast.error("You're commenting too fast! Please slow down.");
      return;
    }
    else {
    toast.error("Failed to send comment. Please try again.");
    }
  }
  finally {
    setLoadingComments(false);
  }
}

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-slate-800 flex flex-col gap-4 p-4" style={{ backgroundColor: "#0f0f0f" }}>

      {/* Comments list — on top */}
      <div className="flex flex-col gap-4">
        {commentsList.map((c) => (
          <CommentItem key={c.id} comment={c} onReply={handleReply} currentUser={currentUser} />
        ))}
      </div>

      {/* Input — at bottom */}
      <div className="flex gap-3 items-end border-t border-slate-800 pt-4">
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mb-1">
          <Avatar
            src={normalizeAvatarUrl(currentUser?.avatarUrl, currentUser?.username)}
            alt="you"
            size={36}
          />
        </div>
        <div className="flex-1">
  {replyingTo && (
    <div
      className="flex items-center justify-between text-[10px] text-[#895af6] font-semibold px-3 py-1 mb-1 rounded-lg"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <span>Replying to {replyingTo.name}</span>
      <button onClick={() => { setReplyingTo(null); setCommentText(""); }} className="hover:opacity-70 ml-2">✕</button>
    </div>
  )}

  {/* textarea + actions in a bordered box */}
  <div className="rounded-xl" style={{ backgroundColor: "#242424", outline: canComment ? "1px solid #895af6" : "none" }}>
    <textarea
      className="w-full border-none rounded-xl text-sm px-3 pt-3 pb-1 resize-none text-slate-100 custom-scrollbar outline-none min-h-[44px] leading-relaxed placeholder-slate-500"
      style={{ backgroundColor: "transparent" }}
      placeholder="Add a comment..."
      rows={1}
      value={commentText}
      onChange={handleCommentChange}
      onKeyDown={handleKeyDown}
    />

    {/* bottom row — counter + send */}
    <div className="flex items-center justify-end gap-2 px-3 pb-2">
      {commentText.length > 0 && (
        <CharCounter current={commentText.length} max={MAX_COMMENT_LENGTH} />
      )}
      <button
        onClick={handleSend}
        disabled={!canComment}
        style={{
          color: canComment ? "#895af6" : "#475569",
          cursor: canComment ? "pointer" : "not-allowed",
        }}
      >
        <img src="/icons/send.svg" alt="send" className="w-5 h-5" />
      </button>
    </div>
  </div>
</div>
      </div>

    </div>
  );
}


function ProfileHoverCard({ author, currentUser, children }: {
  author: { id: string; username: string; avatarUrl: string | null };
  currentUser: any;
  children: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hoverFollowing, setHoverFollowing] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const isOwnProfile = currentUser?.id === author.id;

  function updatePos() {
  if (!triggerRef.current) return;
  const rect = triggerRef.current.getBoundingClientRect();
  const cardHeight = 280;
  const isBottomHalf = rect.top > window.innerHeight / 2;
  setFlipped(isBottomHalf);

  setPos({
    top: isBottomHalf
      ? rect.top + window.scrollY - cardHeight - 8
      : rect.bottom + window.scrollY + 8,
    left: Math.min(
      Math.max(rect.left + window.scrollX, 8),
      window.innerWidth - 300 - 8
    ),
  });
}

  async function handleMouseEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePos();
    setShow(true);
    if (!profile) {
      try {
        const data = await apiClient.get<any>(
          `/users/${author.username}?currentUserId=${currentUser?.id}`
        );
        
        setProfile(data);
        setIsFollowing(data.isFollowing);
      } catch (err : any) {
        if (err.response?.status === 429) {
          toast.error("Too many requests. Please slow down.");
        } else {
          toast.error("Failed to load profile.");
        }
      }
    }
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => setShow(false), 200);
  }

  async function handleFollow() {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await apiClient.delete(`/users/${author.id}/follow`);
        setIsFollowing(false);
        toast.success(`Unfollowed @${author.username}`);
      } else {
        await apiClient.post(`/users/${author.id}/follow`);
        setIsFollowing(true);
        toast.success(`following @${author.username}`);
      }
    } catch (err : any) {
      if (err.response?.status === 429) {
        toast.error("You're doing that too fast. Please slow down.");
      } else {
        toast.error("Action failed. Please try again.");
      }
    } finally {
      setFollowLoading(false);
      setHoverFollowing(false);
    }
  }

  const card = show ? (
    <div
      className="fixed w-72 rounded-2xl border border-slate-700 shadow-2xl p-4 flex flex-col gap-3"
      style={{
        top: pos.top,
        left: pos.left,
        backgroundColor: "#1a1a1a",
        zIndex: 99999,
        transformOrigin: flipped ? "bottom left" : "top left",
        animation: "fadeIn 0.15s ease",
      }}
      onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <Avatar
          src={normalizeAvatarUrl(author.avatarUrl, author.username)}
          alt={author.username}
          size={52}
          onClick={() => router.push(`/profile/${author.username}`)}
        />
        {!isOwnProfile && currentUser && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            onMouseEnter={() => isFollowing && setHoverFollowing(true)}
            onMouseLeave={() => setHoverFollowing(false)}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
            style={{
              backgroundColor: isFollowing
                ? hoverFollowing ? "#7f1d1d" : "#1e293b"
                : "#895af6",
              color: isFollowing
                ? hoverFollowing ? "#fca5a5" : "#e2e8f0"
                : "#ffffff",
              border: isFollowing ? "1px solid #334155" : "none",
            }}
          >
            {followLoading ? "..." : isFollowing
              ? (hoverFollowing ? "Unfollow" : "Following")
              : "Follow"}
          </button>
        )}
      </div>

      {/* Name + username */}
      <div
        className="flex flex-col gap-0.5 cursor-pointer break-all"
        onClick={() => router.push(`/profile/${author.username}`)}
      >
        <span className="font-bold text-sm text-white hover:underline">
          {profile?.displayName || author.username}
        </span>
        <span className="text-xs text-slate-500 break-all">@{author.username}</span>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <p className="text-xs text-slate-300 leading-relaxed break-all">{profile.bio}</p>
      )}

      {/* Stats */}
      {profile && (
        <div className="flex gap-4 text-xs border-t border-slate-800 pt-3">
          <div className="flex gap-1">
            <span className="font-bold text-white">{profile._count?.following ?? 0}</span>
            <span className="text-slate-500">Following</span>
          </div>
          <div className="flex gap-1">
            <span className="font-bold text-white">{profile._count?.followers ?? 0}</span>
            <span className="text-slate-500">Followers</span>
          </div>
        </div>
      )}

      {/* View profile button */}
      <button
        onClick={() => router.push(`/profile/${author.username}`)}
        className="w-full py-2 rounded-full text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors mt-1"
      >
        View profile
      </button>

      {!profile && (
        <div className="text-xs text-slate-500 text-center py-2">Loading...</div>
      )}
    </div>
  ) : null;

  return (
    <div
      ref={triggerRef}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {typeof window !== "undefined" && createPortal(card, document.body)}
    </div>
  );
}

// ============================================================
// POST CARD
// ============================================================

export function PostCard({ id, content, imageUrl, createdAt, author, _count,
  isLikedByMe, isSharedByMe, isSavedByMe, sharedBy, currentUser, feedItemId, followingIds }: Post & {
  currentUser: any;
  feedItemId?: string;
  followingIds?: Set<string>;
}) {
  const { getState, setState } = usePostContext();

  const contextState = getState(id);
  const liked = contextState?.liked ?? (isLikedByMe ?? false);
  const likeCount = contextState?.likeCount ?? (_count?.likes ?? 0);
  const shared = contextState?.shared ?? (isSharedByMe ?? false);
  const shareCount = contextState?.shareCount ?? (_count?.shares ?? 0);
  const saved = contextState?.saved ?? (isSavedByMe ?? false);
  const commentCount = contextState?.commentCount ?? (_count?.comments ?? 0)

  const [showComments, setShowComments] = useState(false);
  const isFollowing = followingIds?.has(author.id) ?? false;
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwnPost = currentUser?.id === author.id;
  const relativeTime = useRelativeTime(new Date(createdAt));
  const router = useRouter();
  const deleted = contextState?.deleted ?? false;
  const hidden = contextState?.hidden ?? false;

  

  async function handleLike() {
    if (loading) return;
    setLoading(true);
    const wasLiked = liked;
    setState(id, {
      liked: !wasLiked,
      likeCount: wasLiked ? likeCount - 1 : likeCount + 1,
    });
    try {
      await api.posts.like(id);
    } catch (err: any) {
      setState(id, { liked: wasLiked, likeCount });
      toast.error("Failed to update like");
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    const wasShared = shared;
    setState(id, {
      shared: !wasShared,
      shareCount: wasShared ? shareCount - 1 : shareCount + 1,
    });
    try {
      await api.posts.share(id);
      toast.success(!wasShared ? "Post shared" : "Share removed");
      if (!wasShared) {
        window.dispatchEvent(new CustomEvent("post:shared", { detail: { postId: id } }));
      } else {
        window.dispatchEvent(new CustomEvent("post:unshared", { detail: { postId: id } }));
      }
    } catch (err: any) {
      setState(id, { shared: wasShared, shareCount });
      if (err.response?.status === 429) {
        toast.error("You're sharing too fast. Please slow down.");
      } else {
        toast.error("Failed to update share. Try again.");
      }
    }
  }

  async function handleSave() {
    const wasSaved = saved;
    setState(id, { saved: !wasSaved });
    try {
      await api.posts.save(id);
      toast.info(!wasSaved ? "Post saved" : "Post unsaved");
    } catch (err: any) {
      setState(id, { saved: wasSaved });
      if (err.response?.status === 429) {
        toast.error("You're saving too fast. Please slow down.");
      } else {
        toast.error("Failed to update saved posts. Try again.");
      }
    }
  }

  async function handleDelete() {
    try {
      await api.posts.delete(id);
      setState(id, { deleted: true, hidden: true }); // ← both
      toast.info("Post deleted");
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error("You're doing that too fast. Please slow down.");
      } else {
        toast.error("Failed to delete post. Please try again.");
      }
    }
  }
  
  async function handleHide() {
    try {
      await api.posts.hide(id);
      setState(id, { hidden: true }); // ← updates all cards with same id
      toast.info("Post hidden");
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error("You're doing that too fast. Please slow down.");
      } else {
        toast.error("Failed to hide post. Try again.");
      }
    }
  }
  
  async function handleUnhide() {
    try {
      await api.posts.unhide(id);
      setState(id, { hidden: false }); // ← restores all cards with same id
      toast.info("Post restored");
    } catch (err: any) {
      if (err.response?.status === 429) {
        toast.error("You're doing that too fast. Please slow down.");
      } else {
        toast.error("Failed to restore post. Try again.");
      }
    }
  }
  if (deleted) return null;
  if (hidden && sharedBy) return null;
  if (hidden && isOwnPost) return null;
  if (hidden) return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-slate-800 p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/icons/close.svg" alt="hidden" className="w-4 h-4 opacity-40" />
        <span className="text-sm text-slate-500">Post hidden</span>
      </div>
      <button onClick={handleUnhide} className="text-xs font-bold text-[#895af6] hover:opacity-80 transition-opacity">
        Show post
      </button>
    </div>
  );

  function handleCommentAdded() {
    const current = contextState?.commentCount ?? (_count?.comments ?? 0);
    setState(id, { commentCount: current + 1 });
  }

  return (
    <article className="bg-[#1a1a1a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">

      {/* Shared by banner */}
      {sharedBy && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-slate-500">
          <img src="/icons/share.svg" alt="share" className="w-3 h-3 opacity-50" />
          <span>
            <span
              className="text-[#895af6] font-semibold cursor-pointer hover:underline"
              onClick={() => router.push(`/profile/${sharedBy.username}`)}
            >
              {sharedBy.username}
            </span>
            {" "}shared this
          </span>
        </div>
      )}

      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProfileHoverCard author={author} currentUser={currentUser}>
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => router.push(`/profile/${author.username}`)}
            >
              <div className="size-10 rounded-full overflow-hidden shrink-0">
                <Avatar
                  src={normalizeAvatarUrl(author.avatarUrl, author.username)}
                  alt={author.username}
                  size={40}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-white hover:underline">{author.username}</span>
                <span className="text-xs text-slate-500">{relativeTime}</span>
              </div>
            </div>
          </ProfileHoverCard>
        </div>

        <div className="flex items-center gap-2">
          {isOwnPost ? (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all duration-200"
            >
              <img src="/icons/delete.svg" alt="delete" className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleHide} className="text-slate-500 hover:text-white transition-colors">
              <img src="/icons/close.svg" alt="hide" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Text content */}
      {content && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed text-slate-300 break-all">{content}</p>
        </div>
      )}

      {/* Image content */}
      {imageUrl && (
        <div className="w-full overflow-hidden">
          <Image
            src={normalizeAvatarUrl(imageUrl)}
            alt="Post image"
            width={600}
            height={400}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      )}

      {/* Action bar */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">

          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-2 transition-colors cursor-pointer"
            style={{ color: liked ? "#895af6" : "#94a3b8" }}
          >
            <span className="like-icon">
              <img
                src="/icons/like.svg"
                alt="like"
                className="w-5 h-5"
                style={{ filter: liked ? "invert(40%) sepia(80%) saturate(500%) hue-rotate(230deg)" : "none" }}
              />
            </span>
            <span className="text-xs font-bold">{likeCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 transition-colors cursor-pointer"
            style={{ color: showComments ? "#895af6" : "#94a3b8" }}
          >
            <img
              src="/icons/comment.svg"
              alt="comment"
              className="w-5 h-5"
              style={{ filter: showComments ? "invert(40%) sepia(80%) saturate(500%) hue-rotate(230deg)" : "none" }}
            />
            <span className="text-xs font-bold">{commentCount}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 transition-colors cursor-pointer"
            style={{ color: shared ? "#895af6" : "#94a3b8" }}
          >
            <img
              src="/icons/share.svg"
              alt="share"
              className="w-5 h-5"
              style={{ filter: shared ? "invert(40%) sepia(80%) saturate(500%) hue-rotate(230deg)" : "none" }}
            />
            <span className="text-xs font-bold">{shareCount}</span>
          </button>

        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="transition-colors cursor-pointer"
          style={{ color: saved ? "#895af6" : "#94a3b8" }}
        >
          <img
            src="/icons/bookmark.svg"
            alt="save"
            className="w-5 h-5"
            style={{ filter: saved ? "invert(40%) sepia(80%) saturate(500%) hue-rotate(230deg)" : "none" }}
          />
        </button>
      </div>

      {/* Comments section */}
      {showComments && <CommentSection postId={id} currentUser={currentUser} onCommentAdded={handleCommentAdded} />}

    </article>
  );
}


// ============================================================
// FEED PAGE
// ============================================================

export default function FeedPage() {
  const { user: authUser, isHydrated } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSuggestion[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchUsersError, setSearchUsersError] = useState<string>("");
  const [isFollowBusyId, setIsFollowBusyId] = useState<string | null>(null);
  const [isFindUsersOpen, setIsFindUsersOpen] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<UserSuggestion[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  

  useState<Record<string, string>>({});
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>("/images/2.jpeg");

  const { items: posts, isLoading: loading, hasMore, ref: loaderRef, setItems: setPosts } = useInfiniteScroll<Post>({
    fetchUrl: "/posts/feed",
    limit: 20,
});

  async function fetchCurrentUser() {
    try {
      const user = await apiClient.get<{ avatarUrl: string | null; username: string }>("/users/me");
      setCurrentUser(user);
      localStorage.setItem("feed_current_user_cache", JSON.stringify(user));
    } catch (err) {
      console.error("Failed to fetch current user:", err);

      // Fallback so CreatePost does not disappear when /users/me intermittently fails.
      if (authUser) {
        setCurrentUser(authUser);
        return;
      }

      try {
        const cached = localStorage.getItem("feed_current_user_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.username) {
            setCurrentUser(parsed);
          }
        }
      } catch {
        // Ignore cache parse errors.
      }
    }
  }

    useEffect(() => {
      if (!currentUser?.id) return;
      async function fetchFollowing() {
        try {
          const data = await apiClient.get<any[]>(`/users/${currentUser.id}/following`);
          const ids = new Set(data.map((f: any) => f.followingId || f.following?.id).filter(Boolean));
          setFollowingIds(ids as Set<string>);
        } catch (err) {
          console.error("Failed to fetch following:", err);
        }
      }
      fetchFollowing();
    }, [currentUser?.id]);

    useEffect(() => {
      if (isHydrated && authUser) {
        fetchCurrentUser();
      }
    }, [isHydrated, authUser?.id]);
  useEffect(() => {
    async function handleShared(e: Event) {
      const { postId } = (e as CustomEvent).detail;
      try {
        // fetch the post to get full data
        const res = await api.posts.getFeed(1, 5);
        const sharedPost = res?.data?.find((p: any) => p.id === postId && p.sharedBy);
        if (sharedPost) {
          setPosts((prev) => {
            const existingIds = new Set(prev.map((p) => p.feedItemId || p.id));
            if (existingIds.has(sharedPost.feedItemId || sharedPost.id)) return prev;
            return [sharedPost, ...prev];
          });
        }
      } catch (err) {
        console.error("Share event error:", err);
      }
    }
  
    function handleUnshared(e: Event) {
      const { postId } = (e as CustomEvent).detail;
      setPosts((prev) => prev.filter((p) => !(p.originalPostId === postId && p.sharedBy)));
    }
  
    window.addEventListener("post:shared", handleShared);
    window.addEventListener("post:unshared", handleUnshared);
    return () => {
      window.removeEventListener("post:shared", handleShared);
      window.removeEventListener("post:unshared", handleUnshared);
    };
  }, []);

  useEffect(() => {
    if (authUser && !currentUser?.avatarUrl) {
      setCurrentUser((prev: any) => prev?.id ? prev : authUser);
    }
  }, [authUser]);

  useEffect(() => {
    if (!isHydrated || !authUser) return;

    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchUsersError("");
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearchingUsers(true);
      setSearchUsersError("");
      try {
        const results = await apiClient.get<UserSuggestion[]>(
          `/users/find?q=${encodeURIComponent(query)}`
        );
        setSearchResults(results);
      } catch (error) {
        console.error("Failed to search users:", error);
        setSearchResults([]);
        setSearchUsersError("Search is unavailable right now");
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery, isHydrated, authUser]);

  useEffect(() => {
    if (!isHydrated || !authUser) return;

    const fetchSuggestions = async () => {
      try {
        const data = await apiClient.get<UserSuggestion[]>("/users/suggestions");
        setSuggestedUsers(data || []);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      }
    };

    fetchSuggestions();
  }, [isHydrated, authUser]);

  const toggleFollowSearch = async (target: UserSuggestion) => {
    setIsFollowBusyId(target.id);
    try {
      if (target.isFollowing) {
        await apiClient.delete(`/users/${target.id}/follow`);
        toast.success(`Unfollowed @${target.username}`);
      } else {
        await apiClient.post(`/users/${target.id}/follow`);
        toast.success(`following @${target.username}`);
      }

      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === target.id ? { ...u, isFollowing: !target.isFollowing } : u
        )
      );
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setIsFollowBusyId(null);
    }
  };

  const [newPostsAvailable, setNewPostsAvailable] = useState(false);

  useEffect(() => {
    async function checkNew() {
        try {
            const res = await api.posts.getFeed(1, 1);
            const latest = res?.data?.[0];
            if (!latest) return;
            setPosts((prev) => {
                const firstId = (prev[0] as any)?.feedItemId || prev[0]?.id;
                const latestId = latest.feedItemId || latest.id;
                if (prev.length > 0 && latestId !== firstId) {
                    setNewPostsAvailable(true);
                }
                return prev;
            });
        } catch (err) {
            console.error(err);
        }
    }

    const interval = setInterval(checkNew, 30000);
    return () => clearInterval(interval);
}, []);
  
  function handleLoadNew() {
      setNewPostsAvailable(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      // reset hook by reloading page or resetting state
      window.location.reload(); // simple for now — TODO: proper reset
  }

  const findUsersPanel = (
    <>
    <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-6 border border-slate-800">
      <h3 className="text-lg font-semibold text-white mb-3">Find users</h3>
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-3 py-2 bg-[#0f0f0f] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#895af6]/50 border border-slate-800"
        />
      </div>

      <div className="mt-3 space-y-3">
        {isSearchingUsers && <p className="text-xs text-slate-500">Searching...</p>}
        {!isSearchingUsers && !!searchUsersError && (
          <p className="text-xs text-red-400">{searchUsersError}</p>
        )}
        {!isSearchingUsers && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <p className="text-xs text-slate-500">No users found</p>
        )}
        {!isSearchingUsers && searchResults.map((u) => (
          <div key={u.id} className="flex items-center gap-3">
            <Avatar
              src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
              alt={u.displayName || u.username}
              size={34}
            />
            <div className="flex-1 min-w-0">
              <Link href={`/profile/${u.username}`} className="block text-sm text-white font-medium truncate hover:text-[#895af6] transition">
                {u.displayName || u.username}
              </Link>
              <Link href={`/profile/${u.username}`} className="block text-xs text-slate-500 truncate hover:text-slate-300 transition">
                @{u.username}
              </Link>
            </div>
            <button
              onClick={() => toggleFollowSearch(u)}
              disabled={isFollowBusyId === u.id}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${u.isFollowing ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-[#895af6] text-white hover:bg-[#7344d9]"}`}
            >
              {isFollowBusyId === u.id ? "..." : u.isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </div>

    {/* Who to follow */}
    <div className="bg-[#1a1a1a] rounded-2xl p-4 mb-6 border border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Who to follow</h3>
        {suggestedUsers.length === 0 ? (
            <p className="text-sm text-slate-500">No suggestions yet</p>
        ) : (
            <div className="space-y-4">
                {suggestedUsers.map((suggested) => {
                    const handle = suggested.username?.startsWith("@")
                        ? suggested.username
                        : `@${suggested.username}`;
                    const profilePath = `/profile/${handle.replace(/^@/, "")}`;
                    const displayName = suggested.displayName || suggested.username;
                    const avatarSrc = normalizeAvatarUrl(suggested.avatarUrl, suggested.username);
                    
                    return (
                        <div key={suggested.id} className="flex items-center gap-3">
                            <Avatar src={avatarSrc} alt={displayName} size={40} />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-white truncate">{displayName}</p>
                                <p className="text-sm text-slate-500 truncate">{handle}</p>
                            </div>
                            <Link
                                href={profilePath}
                                className="px-3 py-1.5 bg-slate-800 text-white rounded-full text-xs font-medium hover:bg-slate-700 transition"
                            >
                                View
                            </Link>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
    </>
  );

  async function handleAddPost(text: string, image?: File) {
    try {
        let imageUrl: string | undefined;
        if (image) {
            const uploaded = await api.media.uploadPost(image);
            imageUrl = uploaded.url;
        }
        const created = await api.posts.create(text, imageUrl);
        setPosts((prev) => [created, ...prev]); // prepend only
    } catch (err: any) {
        console.error("Create post error:", err);
    }
}

  return (
    <div className="flex h-screen bg-[#0d0d0f]">
      <PostProvider>
        <AppSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0f0f0f]">
          <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            <div className="xl:hidden sticky top-0 z-10 bg-[#0f0f0f]/95 backdrop-blur px-4 py-3 border-b border-slate-800 flex justify-end">
              <button
                onClick={() => setIsFindUsersOpen(true)}
                className="px-3 py-1.5 rounded-full border border-slate-700 text-xs font-medium text-[#895af6] hover:bg-slate-800/50 transition"
              >
                Find users
              </button>
            </div>
            <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-8">

              <CreatePost
                currentUser={currentUser}
                onSubmit={handleAddPost}
              />
              {newPostsAvailable && (
                <div className="sticky top-0 z-50 bg-[#0f0f0f] pb-2">
                  <button
                    onClick={handleLoadNew}
                    className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all"
                    style={{ backgroundColor: "#895af6" }}
                  >
                    New posts available — tap to refresh
                  </button>
                </div>
              )}
              {/* Initial loading — only show when no posts yet */}
              {loading && posts.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-[#1a1a1a] p-6 text-center text-sm text-slate-400">
                      Loading feed...
                  </div>
              )}

              {!loading && feedError && (
                  <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 text-center text-sm text-red-300">
                      Failed to load feed. Refresh again in a moment.
                  </div>
              )}

              {!feedError && posts.length === 0 && !loading && (
                  <div className="rounded-2xl border border-slate-800 bg-[#1a1a1a] p-6 text-center text-sm text-slate-400">
                      No posts yet.
                  </div>
              )}

              {posts.length > 0 && (
                  <>
                      {posts.map((post) => (
                          <PostCard
                              key={post.feedItemId || post.id}
                              {...post}
                              currentUser={currentUser}
                              followingIds={followingIds}
                          />
                      ))}

                      <div ref={loaderRef} className="py-6 flex justify-center">
                          {/* scroll loading — shows at bottom only */}
                          {loading && posts.length > 0 && (
                              <div className="text-slate-500 text-sm animate-pulse">
                                  Loading more posts...
                              </div>
                          )}
                          {!hasMore && posts.length > 0 && (
                              <div className="text-slate-600 text-sm">
                                  You're all caught up ✓
                              </div>
                          )}
                      </div>
                  </>
              )}
            </div>
          </div>
        </div>

        {isFindUsersOpen && (
            <div className="fixed inset-0 z-50 xl:hidden">
                <button
                    type="button"
                    onClick={() => setIsFindUsersOpen(false)}
                    className="absolute inset-0 bg-black/60"
                    aria-label="Close find users panel"
                />
                <aside className="absolute right-0 top-0 h-full w-[min(90vw,24rem)] overflow-y-auto border-l border-slate-800/60 bg-[#0f0f0f] p-4 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Find users</h2>
                        <button
                            type="button"
                            onClick={() => setIsFindUsersOpen(false)}
                            className="p-2 rounded-full text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition"
                            aria-label="Close"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {findUsersPanel}
                </aside>
            </div>
        )}

        {/* Right Sidebar */}
        <aside className="w-72 xl:w-80 p-4 xl:p-6 hidden xl:block overflow-y-auto bg-[#0f0f0f] border-l border-slate-800/50 custom-scrollbar">
          {findUsersPanel}
        </aside>
      </PostProvider>
    </div>
  );
}
