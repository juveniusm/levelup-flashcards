"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isLogin, setIsLogin] = useState(true);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [university, setUniversity] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (searchParams) {
            const action = searchParams.get("action");
            const tokenParam = searchParams.get("token");
            const emailParam = searchParams.get("email");

            if (action === "verify" && tokenParam && emailParam) {
                // Scrub the raw token from the URL history
                router.replace("/login");

                setIsLoading(true);
                setSuccessMsg("Verifying your email and logging you in...");
                setIsLogin(true);

                signIn("credentials", {
                    redirect: false,
                    email: emailParam,
                    token: tokenParam,
                    isVerifying: "true",
                }).then((result) => {
                    if (result?.error) {
                        setErrorMsg("This verification link has expired or is invalid.");
                        setSuccessMsg("");
                        setIsLoading(false);
                    } else if (result?.ok) {
                        router.push("/study?toast=verified");
                    }
                }).catch(() => {
                    setErrorMsg("An unexpected error occurred during verification.");
                    setSuccessMsg("");
                    setIsLoading(false);
                });

                return;
            }

            if (searchParams.get("verified") === "true") {
                // eslint-disable-next-line
                setSuccessMsg("Email successfully verified! You may now sign in.");
                setIsLogin(true);
            } else if (searchParams.get("error")) {
                const err = searchParams.get("error");
                if (err === "unverified") {
                    setErrorMsg("Please verify your email address before signing in.");
                } else if (err !== "CredentialsSignin") {
                    setErrorMsg("Authentication error: " + err);
                }
            }
        }
    }, [searchParams, router]);

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            if (!isLogin) {
                // Register flow
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password, firstName, lastName, username, university }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setErrorMsg(data.message || "Something went wrong.");
                    setIsLoading(false);
                    return;
                }

                // Registration successful - do not auto login.
                setSuccessMsg(data.message || "Registration successful. Please check your email.");
                setIsLogin(true); // switch view to login
                setIsLoading(false);
                // Clear password field just in case
                setPassword("");
                return;
            }

            // Logging in
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                if (result.error === "unverified") {
                    setErrorMsg("Please verify your email address before signing in.");
                } else {
                    setErrorMsg("Invalid credentials. Please try again.");
                }
                setIsLoading(false);
                return;
            }

            if (result?.ok) {
                router.push("/study");
            }
        } catch (error) {
            console.error("Login error:", error);
            setErrorMsg("An unexpected error occurred.");
            setIsLoading(false);
        }

        setIsLoading(false);
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        await signIn("google", {
            callbackUrl: "/study",
        });
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            {/* Logo on pure black background */}
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="w-32 md:w-40 mx-auto">
                    <Image
                        src="/logo4.svg"
                        alt="LevelUp Auth"
                        width={400}
                        height={242}
                        className="w-full h-auto object-contain drop-shadow-lg"
                        priority
                    />
                </div>
            </div>

            {/* Gray box starting from Continue with Google */}
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-white text-black font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                        <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                        <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                        <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                        <path d="M12.0004 24C15.2404 24 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26537 14.29L1.27539 17.385C3.25539 21.31 7.3104 24 12.0004 24Z" fill="#34A853" />
                    </svg>
                    Continue with Google
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-neutral-900 text-neutral-500">Or continue with email</span>
                    </div>
                </div>

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">

                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-400">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full bg-black border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f9c111] transition-colors"
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-neutral-400">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full bg-black border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f9c111] transition-colors"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-neutral-400">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full bg-black border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f9c111] transition-colors"
                                    placeholder="johndoe123"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-neutral-400">University</label>
                                <input
                                    type="text"
                                    required
                                    value={university}
                                    onChange={(e) => setUniversity(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full bg-black border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f9c111] transition-colors"
                                    placeholder="Harvard University"
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-neutral-400">{isLogin ? "Username or Email" : "Email Address"}</label>
                        <input
                            type="text"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-black border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#f9c111] transition-colors"
                            placeholder="student@example.com"
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
                        <p className="text-red-400 text-sm bg-red-900/30 p-3 rounded-lg border border-red-500/50">{errorMsg}</p>
                    )}

                    {successMsg && (
                        <p className="text-green-400 text-sm bg-green-900/30 p-3 rounded-lg border border-green-500/50">{successMsg}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-[#f9c111] hover:bg-[#e0ad0e] text-black font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isLogin ? "Sign In" : "Create Account"}
                    </button>
                </form>

                <div className="space-y-1 pt-2">
                    <p className="text-center text-sm text-neutral-400">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[#f9c111] hover:underline transition-all"
                        >
                            {isLogin ? "Sign Up" : "Sign In"}
                        </button>
                    </p>

                    {isLogin && (
                        <p className="text-center text-sm text-neutral-500">
                            <Link href="/admin/login" className="hover:text-white transition-colors">
                                Admin Sign In
                            </Link>
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center p-4" />}>
            <LoginContent />
        </Suspense>
    );
}
