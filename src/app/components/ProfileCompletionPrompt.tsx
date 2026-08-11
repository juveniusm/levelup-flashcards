"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import UniversitySearchableDropdown from "@/app/components/auth/UniversitySearchableDropdown";

// The signup form collects a username and university from everyone who registers with a password.
// Google sign-ins skip that form entirely and land with both empty, and nothing else in the app
// ever asks. This prompt closes that gap after the fact.
const DISMISS_KEY = "profile-completion-dismissed";

export default function ProfileCompletionPrompt() {
    const { status } = useSession();
    const pathname = usePathname();
    const hasChecked = useRef(false);

    const [needsUsername, setNeedsUsername] = useState(false);
    const [needsUniversity, setNeedsUniversity] = useState(false);
    const [username, setUsername] = useState("");
    const [university, setUniversity] = useState("");
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [dismissed, setDismissed] = useState(false);

    const isAuthPage = pathname === "/login" || pathname === "/admin/login" || pathname === "/";

    useEffect(() => {
        if (status !== "authenticated" || isAuthPage || hasChecked.current) return;
        hasChecked.current = true;

        if (sessionStorage.getItem(DISMISS_KEY) === "true") {
            setDismissed(true);
            return;
        }

        fetch("/api/profile")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (!data || data.error) return;
                setNeedsUsername(!data.username);
                setNeedsUniversity(!data.university);
            })
            // A failed check must never put a dialog in front of the app.
            .catch(() => undefined);
    }, [status, isAuthPage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        const payload: { username?: string; university?: string } = {};

        if (needsUsername) {
            if (!username.trim()) {
                setErrorMsg("Please choose a username.");
                return;
            }
            payload.username = username.trim();
        }

        if (needsUniversity) {
            if (!university) {
                setErrorMsg("Please select your university.");
                return;
            }
            payload.university = university;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Could not save. Please try again.");
                return;
            }

            setNeedsUsername(false);
            setNeedsUniversity(false);
        } catch {
            setErrorMsg("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDismiss = () => {
        sessionStorage.setItem(DISMISS_KEY, "true");
        setDismissed(true);
    };

    if (status !== "authenticated" || isAuthPage || dismissed) return null;
    if (!needsUsername && !needsUniversity) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold tracking-tight">Finish setting up</h2>
                    <p className="text-muted-foreground text-sm">
                        We just need {needsUsername && needsUniversity ? "a couple of details" : "one more detail"} to complete your profile.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {needsUsername && (
                        <div className="space-y-1">
                            <label htmlFor="onboarding-username" className="text-sm font-medium text-muted-foreground">Username</label>
                            <input
                                id="onboarding-username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={saving}
                                className="w-full bg-background border border-border text-foreground rounded-xl px-4 py-3 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                                placeholder="johndoe123"
                            />
                            <p className="text-xs text-muted-foreground/80">
                                3–20 characters: letters, numbers or underscores.
                            </p>
                        </div>
                    )}

                    {needsUniversity && (
                        <UniversitySearchableDropdown
                            value={university}
                            onChange={setUniversity}
                            disabled={saving}
                        />
                    )}

                    {errorMsg && (
                        <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg border border-destructive/30">{errorMsg}</p>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-gold hover:bg-gold/90 text-foreground font-bold py-3 px-4 rounded-full transition-colors disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save and continue"}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    I&apos;ll do this later
                </button>
            </div>
        </div>
    );
}
