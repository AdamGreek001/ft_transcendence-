"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { api } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";

const SignUpPage = () => {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [check, setCheck] = useState(false);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/feed");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (isHydrated && isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!check) {
      toast.info("you must agree to the Terms of service!");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", formData);
      if (res.status === 201) {
        toast.success("Account created successfully!");
        router.push("/login");
      }
    } catch (error: any) {
      console.log("Full Error Object:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Something went wrong";
        toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 grid place-items-center px-4 py-6">
        <Card className="w-full max-w-sm bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">
              Create Account
            </CardTitle>
            <CardAction className="flex items-center justify-between gap-2">
              <CardDescription className="text-gray-400 text-sm">
                already have an account?
              </CardDescription>
              <Link
                href="/login"
                className="text-gray-300 hover:text-white transition text-sm font-medium"
              >
                Log in
              </Link>
            </CardAction>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-2">
                <label className="text-sm text-white" htmlFor="full-name">
                  Full Name
                </label>
                <div className="relative">
                  <Image
                    src="/person.png"
                    alt="user icon"
                    width={16}
                    height={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 brightness-150"
                  />
                  <Input
                    id="full-name"
                    name="username"
                    onChange={handleChange}
                    className="border border-gray-600 rounded-lg w-full h-10 pl-10 bg-gray-800 text-white"
                    type="text"
                    placeholder="Bandit Klm"
                    required
                  />
                </div>
              </div>
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
                    name="email"
                    onChange={handleChange}
                    className=" border border-gray-600 rounded-lg w-full h-10 pl-10 bg-gray-800 text-white"
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
                    name="password"
                    onChange={handleChange}
                    className="border border-gray-600 rounded-lg w-full h-10 pl-10 pr-10 bg-gray-800 pt-3 text-white"
                    type="password"
                    placeholder="**********"
                    required
                  />
                </div>
              </div>
              <FieldGroup className="mt-3">
                <Field
                  orientation="horizontal"
                  className="items-center gap-2 mt-2"
                >
                  <Checkbox
                    onClick={() => setCheck((prev) => !prev)}
                    className="rounded-full bg-gray-800"
                  />
                  <FieldLabel className="items-center gap-1 text-xs text-gray-500 leading-relaxed">
                    I agree to the{" "}
                    <a
                      className="text-purple-900"
                      href="http://localhost:3000/terms-of-service"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      className="text-purple-900"
                      href="http://localhost:3000/privacy-policy"
                    >
                      Privacy Policy
                    </a>
                  </FieldLabel>
                </Field>
              </FieldGroup>
              <Button
                type="submit"
                disabled={loading}
                className="hover:bg-purple-700 bg-purple-600 w-full h-12 mt-4 text-lg"
                size="lg"
              >
                {loading ? "Creating..." : "Create Account"}
                <Image
                  className="ml-1.5"
                  src="/arrow.png"
                  alt="arrow icon"
                  width={30}
                  height={30}
                />
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
                className="w-full sm:w-64 bg-gray-900 hover:bg-gray-800 border border-gray-800"
              >
                Google
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SignUpPage;
