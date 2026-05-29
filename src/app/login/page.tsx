"use client";

import { Suspense } from "react";
import Link from "next/link";
import UniversitySearchableDropdown from "@/app/components/auth/UniversitySearchableDropdown";
import { useAuthForm } from "@/hooks/useAuthForm";
import { useOAuthFlow } from "@/hooks/useOAuthFlow";

function LoginContent() {
    const {
        isLoading, setIsLoading,
        isLogin, setIsLogin,
        email, setEmail,
        password, setPassword,
        firstName, setFirstName,
        lastName, setLastName,
        username, setUsername,
        university, setUniversity,
        errorMsg, setErrorMsg,
        successMsg, setSuccessMsg,
        handleCredentialsSubmit
    } = useAuthForm();

    const { handleGoogleLogin } = useOAuthFlow(
        setIsLoading,
        setIsLogin,
        setErrorMsg,
        setSuccessMsg
    );

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            {/* Wordmark */}
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight">
                    LevelUp<span className="text-gold">.</span>
                </h1>
                <p className="text-muted-foreground mt-2">Master any subject, faster than ever.</p>
            </div>

            {/* Auth card */}
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">

                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full bg-background border border-border text-foreground font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-muted transition-colors disabled:opacity-50"
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
                        <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-card text-muted-foreground">Or continue with email</span>
                    </div>
                </div>

                <form onSubmit={handleCredentialsSubmit} className="space-y-4">

                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-muted-foreground">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        disabled={isLoading}
                                        className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-muted-foreground">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                                    placeholder="johndoe123"
                                />
                            </div>

                            <UniversitySearchableDropdown
                                value={university}
                                onChange={setUniversity}
                                disabled={isLoading}
                            />
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">{isLogin ? "Username or Email" : "Email Address"}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                            placeholder="student@example.com"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                            placeholder="••••••••"
                        />
                    </div>

                    {errorMsg && (
                        <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/30">{errorMsg}</p>
                    )}

                    {successMsg && (
                        <p className="text-green-700 text-sm bg-green-50 p-3 rounded-lg border border-green-500/30">{successMsg}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gold hover:bg-gold/90 text-foreground font-bold py-3 px-4 rounded-full transition-colors disabled:opacity-50"
                    >
                        {isLogin ? "Sign In" : "Create Account"}
                    </button>
                </form>

                <div className="space-y-1 pt-2">
                    <p className="text-center text-sm text-muted-foreground">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-semibold text-foreground hover:text-gold transition-all"
                        >
                            {isLogin ? "Sign Up" : "Sign In"}
                        </button>
                    </p>

                    {isLogin && (
                        <p className="text-center text-sm text-muted-foreground">
                            <Link href="/admin/login" className="hover:text-foreground transition-colors">
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
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4" />}>
            <LoginContent />
        </Suspense>
    );
}
