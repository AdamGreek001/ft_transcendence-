"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { api, apiClient } from "@/lib/api";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuth } from "@/hooks/useAuth";

// ============================================================
// TYPES — ready for real API data later
// ============================================================

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
  isHidden?: boolean;
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
  profile_image: string;
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

function useRelativeTime(date: Date): string {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000); // update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return getRelativeTime(date);
}


function CreatePost({ profile_image, currentUser, onSubmit }: CreatePostProps) {
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
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImage(null);
    setImagePreview(null);
  }

  function handlePost() {
  if (!canPost) return;
    console.log("Posting:", text, image);
  onSubmit(text, image ?? undefined);
  setText("");
  setImage(null);
  setImagePreview(null);
  if (fileInputRef.current) fileInputRef.current.value = ""; // reset input
}

  return (
    <section className="bg-[#1a1a1a] rounded-2xl border border-slate-800 shadow-lg p-4 flex flex-col gap-4">
      <div className="flex gap-4">
        <div className="size-10 rounded-full overflow-hidden shrink-0">
          <Image 
            src={avatarUrl}
            alt="Your profile picture" 
            width={40} 
            height={40} 
            className="rounded-full object-cover"
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
          <Image
            src={normalizeAvatarUrl(comment.author.avatarUrl, comment.author.username)}
            alt={comment.author.username}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div 
            className="px-3 py-2 rounded-2xl rounded-tl-none"
            style={{ backgroundColor: "#242424" }}
          >
            <span className="font-bold text-xs text-white block mb-0.5"
              style={{ color: currentUser?.username === comment.author.username ? "#895af6" : "#fff" }}>
              {comment.author.username}
            </span>
            <p className="text-sm text-slate-400 break-all">
              {comment.content}
            </p>
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

      {/* Replies — indented, no reply button */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 flex flex-col gap-3 border-l-2 border-slate-800 pl-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              isReply={true}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMMENT SECTION
// ============================================================

function CommentSection({ postId, currentUser }: { postId: string; currentUser: any }) {
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ name: string; commentId: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const MAX_COMMENT_LENGTH = 500;
  const isCommentTooLong = commentText.length > MAX_COMMENT_LENGTH;
  const canComment = commentText.trim().length > 0 && !isCommentTooLong;

  
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


  async function handleSend() {
  if (!canComment) return;
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
    } else {
      setCommentsList((prev) => [created, ...prev]);
    }

    setCommentText("");
    setReplyingTo(null);
  } catch (err) {
    console.error("Comment error:", err);
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
          <Image
            src={normalizeAvatarUrl(currentUser?.avatarUrl, currentUser?.username)}
            alt="you"
            width={36}
            height={36}
            className="rounded-full object-cover"
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

// ============================================================
// POST CARD
// ============================================================

export function PostCard({ id, content, imageUrl, createdAt, author, _count,
  isLikedByMe, isSharedByMe, isSavedByMe, isHidden, sharedBy, currentUser }: Post & {
  currentUser: any;
}) {
  const [liked, setLiked] = useState(isLikedByMe ?? false);
  const [likeCount, setLikeCount] = useState(_count?.likes ?? 0);
  const [saved, setSaved] = useState(isSavedByMe ?? false);
  const [showComments, setShowComments] = useState(false);
  const [shared, setShared] = useState(isSharedByMe ?? false);
  const [shareCount, setShareCount] = useState(_count?.shares ?? 0);
  const isOwnPost = currentUser?.id === author.id;
  const [hidden, setHidden] = useState(false);

  const relativeTime = useRelativeTime(new Date(createdAt));

  async function handleLike() {
  // optimistic update — change UI immediately
  setLiked(!liked);
  setLikeCount(liked ? likeCount - 1 : likeCount + 1);

  try {
    await api.posts.like(id);
  } catch (err) {
    // revert if API fails
    setLiked(liked);
    setLikeCount(likeCount);
    console.error("Like error:", err);
  }
}

  async function handleSave() {
  const wasSaved = saved;
  setSaved(!wasSaved);
  try {
    await api.posts.save(id);
  } catch (err) {
    setSaved(wasSaved);
    console.error("Save error:", err);
  }
}

  async function handleShare() {
  // optimistic update
  const wasShared = shared;
  setShared(!wasShared);
  setShareCount(wasShared ? shareCount - 1 : shareCount + 1);

  try {
    await api.posts.share(id);
  } catch (err) {
    // revert on fail
    setShared(wasShared);
    setShareCount(shareCount);
    console.error("Share error:", err);
  }
}

async function handleDelete() {
    try {
        await api.posts.delete(id);
        setHidden(true); // remove from UI after delete
    } catch (err) {
        console.error("Delete error:", err);
    }
}

async function handleHide() {
    try {
        await api.posts.hide(id);
        setHidden(true);
    } catch (err) {
        console.error("Hide error:", err);
    }
}

async function handleUnhide() {
    try {
        await api.posts.unhide(id);
        setHidden(false);
    } catch (err) {
        console.error("Unhide error:", err);
    }
}

    if (hidden) return (
        <div className="bg-[#1a1a1a] rounded-2xl border border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <img src="/icons/close.svg" alt="hidden" className="w-4 h-4 opacity-40" />
                <span className="text-sm text-slate-500">Post hidden</span>
            </div>
            {!isOwnPost && (
                <button
                    onClick={handleUnhide}
                    className="text-xs font-bold text-[#895af6] hover:opacity-80 transition-opacity"
                >
                    Show post
                </button>
            )}
        </div>
    );
  return (
    <article className="bg-[#1a1a1a] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">

      {/* Shared by banner */}
      {sharedBy && (
  <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-xs text-slate-500">
    <img src="/icons/share.svg" alt="share" className="w-3 h-3 opacity-50" />
    <span>
      <span className="text-[#895af6] font-semibold">{sharedBy.username}</span>
      {" "}shared this
    </span>
  </div>
)}

      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full overflow-hidden shrink-0">
            <Image
              src={normalizeAvatarUrl(author.avatarUrl, author.username)}
              alt={`${author.username}'s profile picture`}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">{author.username}</span>
            <span className="text-xs text-slate-500">{relativeTime}</span>
          </div>
        </div>
        {/* Own post — delete button */}
        {isOwnPost && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-red-500/10 
                         text-slate-400 hover:text-red-400 
                         transition-all duration-200 
                         backdrop-blur-sm"
           >
              <img src="/icons/delete.svg" alt="delete" className="w-4 h-4" />
            </button>
        )}

        {/* Other's post — hide button */}
        {!isOwnPost && (
            <button
                onClick={handleHide}
                className="text-slate-500 hover:text-white transition-colors"
            >
                <img src="/icons/close.svg" alt="hide" className="w-5 h-5" />
            </button>
        )}
      </div>

      {/* Text content */}
      {content && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed text-slate-300 break-all">{content}</p>
        </div>
      )}

      {/* Image content */}
      {imageUrl && (
        console.log("Rendering image with URL:", imageUrl),
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
            <span className="text-xs font-bold">{_count?.comments}</span>
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
      {showComments && <CommentSection postId={id} currentUser={currentUser} />}

    </article>
  );
}


// ============================================================
// FEED PAGE
// ============================================================

export default function FeedPage() {
  const { user: authUser, isHydrated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useState<Record<string, string>>({});
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>("/images/2.jpeg");

  async function loadFeed() {
    try {
      setLoading(true);
      const res = await api.posts.getFeed();
      const nextPosts = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      setPosts(nextPosts);
      sessionStorage.setItem("feed_cache", JSON.stringify(nextPosts));
      setError(null);
    } catch (err: any) {
      console.error("Feed error:", err);

      // Keep feed populated on transient API failures (including 429 rate limits).
      try {
        const cached = sessionStorage.getItem("feed_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPosts(parsed);
            // Don't show error banner when we have cached data to display
            setError(null);
            return;
          }
        }
      } catch {
        // Ignore cache parse errors.
      }

      // Only set error when we have no cached data to show
      setError(err.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }

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
  if (!isHydrated) return;

  async function init() {
    setLoading(true);

    try {
      const cached = sessionStorage.getItem("feed_cache");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts(parsed);
        }
      }
    } catch {
      // Ignore cache parse errors.
    }

    await Promise.all([loadFeed(), fetchCurrentUser()]);
    setLoading(false);
  }
  init();

  const interval = setInterval(() => {
    Promise.all([loadFeed(), fetchCurrentUser()]);
  }, 30000);
  return () => clearInterval(interval);
}, [isHydrated]);

  useEffect(() => {
    if (authUser && !currentUser) {
      setCurrentUser(authUser);
    }
  }, [authUser, currentUser]);

 async function handleAddPost(text: string, image?: File) {
  try {
    let imageUrl: string | undefined;

    if (image) {
      const uploaded = await api.media.uploadPost(image);
      imageUrl = uploaded.url;
    }

    const created = await api.posts.create(text, imageUrl);
    setPosts((prev) => [created, ...prev]);
  } catch (err: any) {
    console.error("Create post error:", err);
  }
}

  return (
    <div className="flex h-screen bg-[#0d0d0f]">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0f0f0f]">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-8">

            <CreatePost
              profile_image={normalizeAvatarUrl(currentUser?.avatarUrl, currentUser?.username)}
              currentUser={currentUser || { username: "user", avatarUrl: null }}
              onSubmit={handleAddPost}
            />

            {loading && (
              <div className="rounded-2xl border border-slate-800 bg-[#1a1a1a] p-6 text-center text-sm text-slate-400">
                Loading feed...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-6 text-center text-sm text-red-300">
                Failed to load feed. Refresh again in a moment.
              </div>
            )}

            {!loading && !error && posts.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-[#1a1a1a] p-6 text-center text-sm text-slate-400">
                No posts yet.
              </div>
            )}

            {posts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                currentUser={currentUser}
              />
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}