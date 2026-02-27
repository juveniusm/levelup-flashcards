"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function AdminLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setErrorMsg("Invalid credentials. Please try again.");
            } else {
                router.push("/study");
            }
        } catch {
            setErrorMsg("An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            {/* Logo on pure black background */}
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="w-64 md:w-80 mx-auto">
                    <Image
                        src="/logo4.svg"
                        alt="LevelUp Admin Auth"
                        width={400}
                        height={242}
                        className="w-full h-auto object-contain drop-shadow-lg"
                        priority
                    />
                </div>
            </div>

            {/* Gray box */}
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Admin Sign In</h2>
                    <p className="text-neutral-400">Sign in to your admin account</p>
                </div>

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-400">Email Address</label>
                        <input
                            type="text"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-black border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f9c111] transition-colors"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-400">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-black border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f9c111] transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {errorMsg && (
                        <p className="text-red-400 text-sm">{errorMsg}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#f9c111] hover:bg-[#e0ad0e] text-black font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Sign In
                    </button>
                </form>

                <p className="text-center text-sm text-neutral-500 pt-2">
                    <Link href="/login" className="hover:text-white transition-colors">
                        ← Back to User Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}
