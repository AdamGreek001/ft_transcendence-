'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/utils';
import Cookies from 'js-cookie';

export default function TwoFactorVerify() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleVerify2FA = async () => {
    try {
      const res = await api.post("/auth/2fa/verify", { userId, code });
      const token = res.data.accessToken;

      if (token) {
        Cookies.set("token", token, { expires: 7, path: "/" });
        router.push("/feed");
      }
    } catch (error: any) {
      alert("Code incorrect!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Two-Factor Authentication</h1>
      <p className="mb-4">Enter the 6-digit code from your app</p>
      <input 
        type="text"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border p-2 rounded text-center text-2xl tracking-widest w-48 mb-4 text-black"
        placeholder="000000"
      />
      <button 
        onClick={handleVerify2FA}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Verify Code
      </button>
    </div>
  );
}