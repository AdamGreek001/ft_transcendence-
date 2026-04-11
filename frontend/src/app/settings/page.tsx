"use client";

import { useState, useEffect } from "react";
import { Avatar } from "@/components/ui";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { apiClient as api } from "@/lib/api";

interface UserData {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  twoFactorEnabled?: boolean;
  avatarUrl?: string;
}

const activityLog = [
  {
    id: "1",
    icon: "login",
    title: "Logged in from Safari on Mac",
    time: "Today, 10:24 AM",
  },
  {
    id: "2",
    icon: "security",
    title: "Security update applied",
    time: "Yesterday, 4:15 PM",
  },
];

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await api.get<UserData>("/users/me");
        if (user) {
          setDisplayName(user.displayName || "");
          setUsername(user.username || "");
          setBio(user.bio || "");
          setTwoFactorEnabled(user.twoFactorEnabled || false);
          setAvatarUrl(user.avatarUrl || "");
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSaveProfile = async () => {
    try {
      await api.patch("/users/settings/update", {
        displayName: displayName,
        username: username,
        bio: bio,
      });

      alert("Profile updated successfully!");
    } catch (err: any) {
      console.error("Save Error:", err.response?.data);
      alert(
        err.response?.data?.message || "Something went wrong while saving.",
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post<{ avatarUrl: string }>(
        "/users/avatar/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setAvatarUrl(res.avatarUrl);
      alert("Avatar updated!");
    } catch (err: any) {
      console.error("Upload error:", err);
      alert("Error: " + (err.response?.data?.message || "Failed to upload"));
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await api.delete("/users/avatar/remove");
      setAvatarUrl("");
      alert("Avatar removed");
    } catch (err) {
      alert("Error removing avatar");
    }
  };

  const handleToggle2FA = async () => {
    if (twoFactorEnabled) {
      if (!window.confirm("Are you sure you want to disable 2FA?")) return;

      try {
        await api.post("/users/2fa/turn-off");
        setTwoFactorEnabled(false);
        alert("2FA Disabled successfully.");
      } catch (err: any) {
        console.error("Disable 2FA Error:", err);
        alert("Error disabling 2FA");
      }
    } else {
      try {
        const res = await api.post<{ qrCodeDataUrl: string }>(
          "/users/2fa/generate",
        );
        setQrCodeUrl(res.qrCodeDataUrl);
        setIs2FAModalOpen(true);
      } catch (err: any) {
        console.error("Generate 2FA Error:", err);
        alert("Error generating QR code");
      }
    }
  };

  const handleVerify2FA = async () => {
    if (twoFactorCode.length !== 6) {
      alert("Please enter a valid 6-digit code.");
      return;
    }

    try {
      await api.post("/users/2fa/turn-on", { code: twoFactorCode });
      setTwoFactorEnabled(true);
      setIs2FAModalOpen(false);
      setTwoFactorCode("");
      alert("2FA Successfully Enabled!");
    } catch (err: any) {
      console.error("Verify 2FA Error:", err);
      alert("Invalid code. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d0d0f]">
        <div className="text-white text-lg animate-pulse">
          Loading your data...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0d0d0f] flex-col lg:flex-row">
      <div className="hidden md:block lg:block">
        <AppSidebar />
      </div>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="sticky top-0 bg-[#0d0d0f]/95 backdrop-blur z-10 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-[#1a1a1f] rounded-full text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-gray-800/50"
              />
            </div>
            <button className="p-2 hover:bg-gray-800/50 rounded-full transition text-gray-400 relative hidden sm:block">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <button className="bg-violet-600 text-white px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-violet-700 transition whitespace-nowrap">
              Post
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="p-4 sm:p-6 max-w-2xl w-full mx-auto flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
            Manage your StitchSocial experience and account security.
          </p>

          {/* Tabs */}
          <div className="border-b border-gray-800/50 mb-6 sm:mb-8">
            <button className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-violet-400 border-b-2 border-violet-500">
              Account
            </button>
          </div>

          {/* Public Profile Section */}
          <section className="mb-8 sm:mb-10">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">
              Public Profile
            </h2>

            <div className="bg-[#1a1a1f] rounded-xl sm:rounded-2xl p-4 sm:p-6">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-4 mb-4 sm:mb-6">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center overflow-hidden">
                    <Avatar
                      src={
                        avatarUrl ||
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder"
                      }
                      alt="User Avatar"
                      size={80}
                    />
                  </div>

                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-violet-500 rounded-full flex items-center justify-center border-2 border-[#1a1a1f] cursor-pointer hover:bg-violet-600 transition shadow-lg"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </label>

                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="flex-1">
                  <p className="font-medium text-white mb-1">Avatar Image</p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3">
                    Min 400×400px, PNG or JPG.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        document.getElementById("avatar-upload")?.click()
                      }
                      className="px-3 sm:px-4 py-1.5 bg-[#2a2a2f] border border-gray-700 rounded-lg text-xs sm:text-sm font-medium text-white hover:bg-[#3a3a3f] transition"
                    >
                      Change Avatar
                    </button>

                    <button
                      onClick={handleRemoveAvatar}
                      className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-orange-400 hover:text-orange-300 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#2a2a2f] border border-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-7 sm:pl-8 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-[#2a2a2f] border border-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[#2a2a2f] border border-gray-700 rounded-lg sm:rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 sm:gap-3">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 sm:px-5 py-2 bg-violet-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-violet-700 transition"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </section>

          {/* Security & Preferences Section */}
          <section className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6">
              Security & Preferences
            </h2>

            <div className="bg-[#1a1a1f] rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                    <svg
                      className="w-5 h-5 text-violet-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm sm:text-base">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Add an extra layer of security.
                    </p>
                  </div>
                </div>
                {/* 👇 Hna beddelna l-onClick */}
                <button
                  onClick={handleToggle2FA} 
                  className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
                    twoFactorEnabled ? "bg-violet-600" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      twoFactorEnabled ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>
          {is2FAModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-[#1a1a1f] border border-gray-800 rounded-xl sm:rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Enable 2FA</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Scan this QR code with Google Authenticator or Authy, then enter the 6-digit code below.
                </p>

                <div className="bg-white p-4 rounded-xl mb-6 flex justify-center">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-gray-500 animate-pulse">
                      Loading QR...
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2 text-center">
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-[#2a2a2f] border border-gray-700 rounded-xl text-center text-2xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="000000"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIs2FAModalOpen(false);
                      setTwoFactorCode("");
                    }}
                    className="flex-1 py-2.5 px-4 bg-[#2a2a2f] hover:bg-[#3a3a3f] text-white rounded-xl text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerify2FA}
                    disabled={twoFactorCode.length !== 6}
                    className="flex-1 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Activity */}
      <aside className="w-64 sm:w-72 border-l border-gray-800/50 p-4 sm:p-6 hidden xl:block overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">
          Last Activity
        </h3>
        <div className="space-y-3 sm:space-y-4">
          {activityLog.map((activity) => (
            <div key={activity.id} className="flex items-start gap-2 sm:gap-3">
              <div className="w-8 h-8 bg-[#1a1a1f] rounded-full flex items-center justify-center flex-shrink-0">
                {activity.icon === "login" ? (
                  <svg
                    className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-white">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
