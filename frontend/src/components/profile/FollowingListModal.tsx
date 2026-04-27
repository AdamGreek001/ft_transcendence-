"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { normalizeAvatarUrl } from "@/app/feed/page";

type Tab = "followers" | "following";

interface FollowUser {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isFollowing: boolean;
}

interface Props {
  profileId: string;
  profileUsername: string;
  initialTab: Tab;
  followerCount: number;
  followingCount: number;
  onClose: () => void;
}

export function FollowListModal({
  profileId,
  profileUsername,
  initialTab,
  followerCount,
  followingCount,
  onClose,
}: Props) {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [lists, setLists] = useState<Record<Tab, FollowUser[] | null>>({
    followers: null,
    following: null,
  });
  const [loading, setLoading] = useState(false);
  const [followBusy, setFollowBusy] = useState<Record<string, boolean>>({});
  const [hoverUnfollow, setHoverUnfollow] = useState<Record<string, boolean>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (lists[tab] !== null) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await apiClient.get<FollowUser[]>(
          `/users/${profileId}/${tab}`
        );
        if (!cancelled)
          setLists((prev) => ({ ...prev, [tab]: data }));
      } catch (err) {
        console.error("Failed to load", tab, err);
        if (!cancelled) setLists((prev) => ({ ...prev, [tab]: [] }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tab, profileId, lists]);

  const handleToggleFollow = async (u: FollowUser) => {
    if (u.userId === currentUser?.id) return;
    setFollowBusy((p) => ({ ...p, [u.userId]: true }));
    try {
      if (u.isFollowing) {
        await apiClient.delete(`/users/${u.userId}/follow`);
      } else {
        await apiClient.post(`/users/${u.userId}/follow`);
      }
      const patch = (list: FollowUser[] | null) =>
        list?.map((x) =>
          x.userId === u.userId ? { ...x, isFollowing: !x.isFollowing } : x
        ) ?? null;
      setLists((prev) => ({
        followers: patch(prev.followers),
        following: patch(prev.following),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setFollowBusy((p) => ({ ...p, [u.userId]: false }));
      setHoverUnfollow((p) => ({ ...p, [u.userId]: false }));
    }
  };

  const users = lists[tab];

  const modal = (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onMouseDown={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full rounded-2xl overflow-hidden shadow-2xl"
        style={{
          maxWidth: 400,
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid #222" }}
        >
          <span className="text-white font-semibold text-sm">
            @{profileUsername}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: "#2a2a2a" }}
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: "1px solid #222" }}>
          {(["followers", "following"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-xs font-bold text-center transition-colors"
              style={{
                color: tab === t ? "#895af6" : "#555",
                background: "none",
                border: "none",
                borderBottom: tab === t ? "2px solid #895af6" : "2px solid transparent",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
            >
              {t === "followers" ? "Followers" : "Following"}
              <span
                className="ml-1"
                style={{
                  fontSize: 11,
                  color: tab === t ? "#6b47b8" : "#444",
                  fontWeight: 400,
                }}
              >
                {t === "followers" ? followerCount : followingCount}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div
          className="overflow-y-auto"
          style={{ height: 300 }}
        >
          {loading || users === null ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-xs">
              Loading...
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-600 text-xs">
              {tab === "followers" ? "No followers yet" : "Not following anyone"}
            </div>
          ) : (
            users.map((u) => {
              const isYou = u.userId === currentUser?.id;
              const busy = followBusy[u.userId];
              const hovering = hoverUnfollow[u.userId];
              return (
                <div
                  key={u.userId}
                  className="flex items-center gap-3 px-4 py-2 transition-colors"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div className="rounded-full overflow-hidden flex-shrink-0 w-[38px] h-[38px]">
                    <Image
                      src={normalizeAvatarUrl(u.avatarUrl, u.username)}
                      alt={u.username}
                      width={38}
                      height={38}
                      className="rounded-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate leading-tight">
                      {u.displayName || u.username}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#555", marginTop: 1 }}>
                      @{u.username}
                    </p>
                  </div>

                  {isYou ? (
                    <span
                      className="text-xs px-3 py-1 rounded-full flex-shrink-0"
                      style={{ border: "1px solid #222", color: "#444" }}
                    >
                      You
                    </span>
                  ) : (
                    <button
                      onClick={() => handleToggleFollow(u)}
                      disabled={busy}
                      onMouseEnter={() =>
                        u.isFollowing &&
                        setHoverUnfollow((p) => ({ ...p, [u.userId]: true }))
                      }
                      onMouseLeave={() =>
                        setHoverUnfollow((p) => ({ ...p, [u.userId]: false }))
                      }
                      className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all"
                      style={{
                        background: u.isFollowing
                          ? hovering ? "rgba(127,29,29,0.2)" : "transparent"
                          : "#895af6",
                        color: u.isFollowing
                          ? hovering ? "#fca5a5" : "#999"
                          : "#fff",
                        border: u.isFollowing
                          ? hovering ? "1px solid #7f1d1d" : "1px solid #333"
                          : "none",
                        cursor: busy ? "not-allowed" : "pointer",
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      {busy ? "..." : u.isFollowing
                        ? hovering ? "Unfollow" : "Following"
                        : "Follow"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return typeof window !== "undefined"
    ? createPortal(modal, document.body)
    : null;
}