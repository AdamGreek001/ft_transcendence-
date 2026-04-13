"use client";

import React, { useState } from "react";
// import Navbar from "@/components/Navbar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/utils";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

const LoginPage = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data.accessToken;
      const userData = res.data.user;

      if (token) {
        Cookies.set("token", token, { expires: 7, path: "/" });

        setAuth(token, userData);
        localStorage.setItem("user", JSON.stringify(userData));
        router.push("/settings");
      } else {
        console.error("Token not found in response:", res.data);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert(error.response?.data?.message || "Email or password incorrect!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* <header className="bg-gray-800">
        <Navbar buttonText="Sign in" paragraph="Don't have an account ?" />
      </header> */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4">
        <Card className="w-90 max-w-sm bg-gray-900">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              Welcom back
            </CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Enter your details to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-white" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Image
                    src="/email.png"
                    alt="email icon"
                    width={16}
                    height={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 brightness-150"
                  />
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className=" border border-gray-600 rounded-lg w-80 h-10 pl-10 bg-gray-800 text-white"
                    type="email"
                    placeholder="Bandit@example.com"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-white" htmlFor="pass">
                  Password
                </label>
                <div className="relative">
                  <Image
                    src="/lock.png"
                    alt="user icon"
                    width={16}
                    height={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 brightness-150"
                  />
                  <Input
                    id="pass"
                    className="border border-gray-600 rounded-lg w-80 h-10  pl-10 pr-10 bg-gray-800 pt-3 text-white"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="**********"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 w-80 h-12 mt-6 text-lg"
                size="lg"
              >
                {loading ? "Logging in..." : "Log In"}
              </Button>
            </form>
            <div className="flex items-center gap-2 mt-3">
              <div className=" w-20 border-t border-gray-800 my-4"></div>
              <p className="text-gray-400 font-bold text-xs">
                OR CONTINUE WITH
              </p>
              <div className=" w-20 border-t border-gray-800 my-4"></div>
            </div>
            <div className="flex items-center justify-center mt-2 mb-3 gap-6 w-full">
              <Button
                type="button"
                onClick={() =>
                  (window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`)
                }
                className="w-64 bg-gray-900 hover:bg-gray-800 border border-gray-800"
              >
                Google
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-5">
          <a
            className="text-sm text-gray-400"
            href="http://localhost:3000/privacy-policy"
          >
            Privacy Policy
          </a>
          <a
            className="text-sm text-gray-400"
            href="http://localhost:3000/terms-of-service"
          >
            Terms of service
          </a>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
