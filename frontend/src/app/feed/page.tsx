"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";

// ============================================================
// TYPES — ready for real API data later
// ============================================================

interface User {
  username: string;
  image_profile: string;
}

interface Comment {
  id: number;
  name: string;
  text: string;
  createdAt: Date;
  avatar: string | null;
  replies?: Comment[];
}

interface Post {
  id: number;
  username: string;
  image_profile: string;
  createdAt: Date;
  location: string;
  content?: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  priority?: boolean;
  sharedBy?: {          // ← if present = this is a shared post
    username: string;
    image_profile: string;
  };
  originalPostId?: number;  // ← to track and unshare
}

// ============================================================
// CREATE POST
// ============================================================

interface CreatePostProps {
  profile_image: string;
  onSubmit: (text: string, image?: File) => void;
}

interface CreatePostProps {
  profile_image: string;
  onSubmit: (text: string) => void;
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


function CreatePost({ profile_image, onSubmit }: CreatePostProps) {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canPost = text.trim().length > 0 || image !== null;

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
          <Image src={profile_image} alt="Your profile picture" width={40} height={40} className="rounded-full" />
        </div>
        <textarea
          className="w-full bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 resize-none py-2 text-sm outline-none"
          placeholder="What's on your mind?"
          rows={2}
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
    </section>
  );
}

// ============================================================
// COMMENT ITEM
// ============================================================

function CommentItem({ comment, onReply, isReply = false }: {
  comment: Comment;
  onReply: (name: string, commentId: number) => void;
  isReply?: boolean;
}) {
  const relativeTime = useRelativeTime(comment.createdAt);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {comment.avatar
            ? <Image src={comment.avatar} alt={comment.name} width={32} height={32} className="rounded-full" />
            : comment.name[0]
          }
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <div className="px-3 py-2 rounded-2xl rounded-tl-none" style={{ backgroundColor: "#242424" }}>
            <span className="font-bold text-xs text-white block mb-0.5">{comment.name}</span>
            <p className="text-sm text-slate-400">{comment.text}</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-slate-500 px-1">
            {/* Hide reply button for nested replies */}
            {!isReply && (
              <button
                onClick={() => onReply(comment.name, comment.id)}
                className="uppercase tracking-wider hover:text-[#895af6] transition-colors"
              >
                REPLY
              </button>
            )}
            <span>{relativeTime}</span>
          </div>
        </div>
      </div>

      {/* Replies — pass isReply=true */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-10 flex flex-col gap-3 border-l-2 border-slate-800 pl-3">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onReply={onReply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMMENT SECTION
// ============================================================

function CommentSection({ postId }: { postId: number }) {
  const [commentsList, setCommentsList] = useState<Comment[]>(MOCK_COMMENTS);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ name: string; commentId: number } | null>(null);

  const canComment = commentText.trim().length > 0;

  function handleReply(name: string, commentId: number) {
    setReplyingTo({ name, commentId });
    setCommentText(`@${name} `);
  }

  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
  const val = e.target.value;

  if (replyingTo) {
    if (val.trim().length === 0) {
      // everything deleted — cancel reply mode
      setReplyingTo(null);
      setCommentText("");
    } else {
      // still has text — keep reply mode active no matter what
      setCommentText(val);
    }
    return;
  }

  setCommentText(val);
}


  function handleSend() {
    if (!canComment) return;

    const newComment: Comment = {
      id: Date.now(),
      name: "Mohamed amine",
      text: replyingTo
        ? commentText.replace(`@${replyingTo.name} `, "").trim()
        : commentText.trim(),
      createdAt: new Date(),
      avatar: "/images/2.jpeg",
      replies: [],
    };

    if (replyingTo) {
      // attach reply under parent comment
      setCommentsList((prev) =>
        prev.map((c) =>
          c.id === replyingTo.commentId
            ? { ...c, replies: [...(c.replies || []), newComment] }
            : c
        )
      );
    } else {
      // new top-level comment on top
      setCommentsList((prev) => [newComment, ...prev]);
    }

    setCommentText("");
    setReplyingTo(null);
    // TODO: call POST /posts/:id/comments
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
          <CommentItem key={c.id} comment={c} onReply={handleReply} />
        ))}
      </div>

      {/* Input — at bottom */}
      <div className="flex gap-3 items-end border-t border-slate-800 pt-4">
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mb-1">
          <Image src="/images/2.jpeg" alt="you" width={36} height={36} className="rounded-full" />
        </div>
        <div className="flex-1 relative">

          {/* Replying to banner */}
          {replyingTo && (
            <div
              className="flex items-center justify-between text-[10px] text-[#895af6] font-semibold px-3 py-1 mb-1 rounded-lg"
              style={{ backgroundColor: "#1a1a2e" }}
            >
              <span>Replying to @{replyingTo.name}</span>
              <button
                onClick={() => { setReplyingTo(null); setCommentText(""); }}
                className="hover:opacity-70 ml-2"
              >✕</button>
            </div>
          )}

          <textarea
            className="w-full border-none rounded-xl text-sm px-3 py-3 pr-12 resize-none text-slate-100 outline-none min-h-[44px] leading-relaxed placeholder-slate-500"
            style={{
              backgroundColor: "#242424",
              outline: canComment ? "1px solid #895af6" : "none",
            }}
            placeholder="Add a comment..."
            rows={1}
            value={commentText}
            onChange={handleCommentChange}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-3 flex items-center gap-1" 
            style={{ 
              top: replyingTo ? "calc(50% + 12px)" : "45%",  // shift down when banner visible
              transform: "translateY(-50%)" 
            }}
>
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
  );
}

// ============================================================
// POST CARD
// ============================================================

// Hardcoded mock comments — replace with API call later
const MOCK_COMMENTS: Comment[] = [
  { id: 1, name: "Elena Rodriguez", text: "The texture here is incredible!", createdAt: new Date(Date.now() - 15 * 60 * 1000), avatar: null },
  { id: 2, name: "Marcus Stone", text: "Are these available as prints?", createdAt: new Date(Date.now() - 32 * 60 * 1000), avatar: null },
  { id: 3, name: "Sophia Lane", text: "The violet palette is everything 💜", createdAt: new Date(Date.now() - 60 * 60 * 1000), avatar: null },
  { id: 4, name: "Liam Carter", text: "This is pure art 🔥", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), avatar: null },
];

function PostCard({ id, username, image_profile, createdAt, location, content, image, likes, comments, shares, priority = false, sharedBy, originalPostId, onShare, onUnshare, sharedPostId }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [shareCount, setShareCount] = useState(shares);
  const [shared, setShared] = useState(false);
  const relativeTime = useRelativeTime(createdAt);
  
  if (hidden) return null;

  function handleLike() {
    setLiked(!liked);
    // TODO: call POST /posts/:id/like or DELETE /posts/:id/like
  }
  function handleShare() {
    if (shared) {
      setShareCount(shareCount - 1);
      setShared(false);
      if (sharedPostId) onUnshare(sharedPostId);
    } else {
      setShareCount(shareCount + 1);
      setShared(true);
      onShare({
        id: Date.now(),
        username,
        image_profile,
        createdAt,
        location,
        content,
        image,
        likes: 0,
        comments: 0,
        shares: 0,
        sharedBy: {
          username: "@m.e.d_a.m.i.n.e",       // TODO: replace with logged in user
          image_profile: "/images/2.jpeg",      // TODO: replace with logged in user
        },
        originalPostId: id,
      });
    }
    // TODO: call POST /posts/:id/share or DELETE /posts/:id/share
  }
  function handleSave() {
    setSaved(!saved);
    // TODO: call POST /posts/:id/save or DELETE /posts/:id/save
  }

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
              src={image_profile}
              alt={`${username}'s profile picture`}
              width={40}
              height={40}
              className="rounded-full"
              priority={priority}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white">{username}</span>
            <span className="text-xs text-slate-500">
              {relativeTime} {location ? `· ${location}` : ""}
            </span>
          </div>
        </div>
        <button
          onClick={() => setHidden(true)}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <img src="/icons/close.svg" alt="close" className="w-5 h-5" />
        </button>
      </div>

      {/* Text content */}
      {content && (
        <div className="px-4 pb-3">
          <p className="text-sm leading-relaxed text-slate-300">{content}</p>
        </div>
      )}

      {/* Image content */}
      {image && (
        <div className="w-full overflow-hidden">
          <Image
            src={image}
            alt="Post image"
            width={600}
            height={400}
            style={{ width: "100%", height: "auto" }}
            priority={priority}
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
            <img
              src="/icons/like.svg"
              alt="like"
              className="w-5 h-5"
              style={{ filter: liked ? "invert(40%) sepia(80%) saturate(500%) hue-rotate(230deg)" : "none" }}
            />
            <span className="text-xs font-bold">{likes}</span>
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
            <span className="text-xs font-bold">{comments}</span>
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
      {showComments && <CommentSection postId={id} />}

    </article>
  );
}

// ============================================================
// MOCK POSTS — replace with API call later
// ============================================================

const MOCK_POSTS: Post[] = [
  {
    id: 1,
    username: "@m.e.d_a.m.i.n.e",
    image_profile: "/images/2.jpeg",
    createdAt: new Date(new Date(Date.now() - 15 * 60 * 1000)), // 15 minutes ago
    location: "Vancouver, BC",
    content: "Just finished this summer cardigan! #knitting #handmade #summerstyle",
    image: "/images/tabi3a.jpeg",
    likes: 1240,
    comments: 84,
    shares: 12,
    priority: true,
  },
  {
    id: 2,
    username: "@re.m.a",
    image_profile: "/images/2.jpeg",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    location: "Montreal, QC",
    content: "Had an amazing day exploring the city! #cityadventures #foodie",
    image: "/images/2.jpeg",
    likes: 980,
    comments: 50,
    shares: 8,
  },
  {
    id: 3,
    username: "@s.a.m.i",
    image_profile: "/images/2.jpeg",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    location: "Toronto, ON",
    likes: 1500,
    comments: 120,
    shares: 20,
  },
];

// ============================================================
// FEED PAGE
// ============================================================

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [sharedPostIds, setSharedPostIds] = useState<Record<number, number>>({});
  function handleAddPost(text: string, image?: File) {
  const newPost: Post = {
    id: Date.now(),
    username: "@m.e.d_a.m.i.n.e",
    image_profile: "/images/2.jpeg",
    createdAt: new Date(),   // ← exact moment of posting
    location: "",
    content: text,
    image: image ? URL.createObjectURL(image) : undefined,
    likes: 0,
    comments: 0,
    shares: 0,
  };
  setPosts([newPost, ...posts]);
}
function handleShare(sharedPost: Post) {
  setPosts((prev) => [sharedPost, ...prev]);
  setSharedPostIds((prev) => ({
    ...prev,
    [sharedPost.originalPostId!]: sharedPost.id,
  }));
}

function handleUnshare(sharedPostId: number) {
  setPosts((prev) => prev.filter((p) => p.id !== sharedPostId));
  setSharedPostIds((prev) => {
    const updated = { ...prev };
    const key = Object.keys(updated).find((k) => updated[+k] === sharedPostId);
    if (key) delete updated[+key];
    return updated;
  });
}
  return (
    <div className="flex h-screen bg-[#0d0d0f]">
      <AppSidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0f0f0f]">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-400/20 scrollbar-track-transparent">
          <div className="max-w-2xl mx-auto py-8 px-4 flex flex-col gap-8">

            <CreatePost profile_image="/images/2.jpeg" onSubmit={handleAddPost} />

            {posts.map((post) => (
              <PostCard
                key={post.id}
                {...post}
                onShare={handleShare}
                onUnshare={handleUnshare}
                sharedPostId={sharedPostIds[post.id]}
              />
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}