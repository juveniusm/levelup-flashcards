"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import UniversitySearchableDropdown from "@/app/components/auth/UniversitySearchableDropdown";

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [university, setUniversity] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Both default to the restrictive shape, so a failed profile fetch leaves the form exactly as
    // it behaved before rather than offering fields the server will reject.
    const [hadUsername, setHadUsername] = useState(true);
    const [hasPassword, setHasPassword] = useState(true);

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Admins can rename anyone; everyone else may claim a username only while theirs is empty,
    // which is the state every Google signup starts in.
    const canEditUsername = isAdmin || !hadUsername;

    useEffect(() => {
        fetch("/api/profile")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setLoadError(true);
                } else {
                    setFirstName(data.firstName || "");
                    setLastName(data.lastName || "");
                    setEmail(data.email || "");
                    setUsername(data.username || "");
                    setUniversity(data.university || "");
                    setHadUsername(Boolean(data.username));
                    setHasPassword(data.hasPassword !== false);
                }
                setLoading(false);
            })
            .catch(() => {
                setLoadError(true);
                setLoading(false);
            });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match." });
            return;
        }

        // Matches the API's minimum; the old value of 6 only produced a server-side rejection.
        if (newPassword && newPassword.length < 8) {
            setMessage({ type: "error", text: "Password must be at least 8 characters." });
            return;
        }

        setSaving(true);

        const payload: {
            firstName: string;
            lastName: string;
            email?: string;
            username?: string;
            university?: string;
            currentPassword?: string;
            newPassword?: string;
        } = { firstName, lastName };

        if (isAdmin) {
            payload.email = email;
            payload.username = username;
        } else if (!hadUsername && username.trim()) {
            // Claim-once: sending this when the user already has a username would be a 403.
            payload.username = username.trim();
        }

        // Only sent when set, so a save can't blank out an existing university.
        if (university) payload.university = university;

        if (newPassword) {
            if (hasPassword) payload.currentPassword = currentPassword;
            payload.newPassword = newPassword;
        }

        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (res.ok) {
                await update(); // Refresh session so sidebar shows new name instantly
                setMessage({ type: "success", text: "Profile updated successfully." });
                // Reflect what the account now has, so the fields settle into their locked /
                // "change password" shape without a reload.
                if (payload.username) setHadUsername(true);
                if (payload.newPassword) setHasPassword(true);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: "error", text: data.error || "Failed to update profile." });
            }
        } catch {
            setMessage({ type: "error", text: "Network error. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <span className="text-muted-foreground text-lg">Loading…</span>
            </div>
        );
    }

    // Rendering the form after a failed load would show every field empty, and saving from
    // there would write those blanks over the user's real name.
    if (loadError) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
                    <h1 className="text-2xl font-display font-bold tracking-tight">Couldn&apos;t load your profile</h1>
                    <p className="text-muted-foreground text-sm">
                        Your settings are hidden rather than shown blank, so a save can&apos;t overwrite them with empty values.
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="bg-gold hover:bg-gold/90 text-foreground font-bold py-3 px-8 rounded-full transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <main className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-700">
                <header className="border-b border-border pb-6">
                    <h1 className="text-3xl font-display font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground mt-1">Manage your profile and security</p>
                </header>

                <form onSubmit={handleSave} className="space-y-10">
                    {/* Profile Section */}
                    <section className="space-y-5">
                        <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-widest text-sm">Profile</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                                    placeholder="First name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                                Email
                                {!isAdmin && <span className="text-muted-foreground/60 ml-2 text-xs">(Admin only)</span>}
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!isAdmin}
                                className={`w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none transition-colors ${isAdmin ? "focus:border-gold focus:ring-2 focus:ring-gold/30" : "opacity-50 cursor-not-allowed"
                                    }`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="username" className="text-sm font-medium text-muted-foreground">
                                Username
                                {!canEditUsername && <span className="text-muted-foreground/60 ml-2 text-xs">(Admin only)</span>}
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={!canEditUsername}
                                placeholder={canEditUsername && !isAdmin ? "Choose a username" : undefined}
                                className={`w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none transition-colors ${canEditUsername ? "focus:border-gold focus:ring-2 focus:ring-gold/30" : "opacity-50 cursor-not-allowed"
                                    }`}
                            />
                            {canEditUsername && !isAdmin && (
                                <p className="text-xs text-muted-foreground/80">
                                    3–20 characters: letters, numbers or underscores. You can only set this once — an admin can change it later.
                                </p>
                            )}
                        </div>

                        <UniversitySearchableDropdown
                            value={university}
                            onChange={setUniversity}
                            disabled={saving}
                        />
                    </section>

                    {/* Password Section */}
                    <section className="space-y-5">
                        <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-widest text-sm">
                            {hasPassword ? "Change Password" : "Set a Password"}
                        </h2>

                        <div className="space-y-4">
                            {hasPassword ? (
                                <div className="space-y-2">
                                    <label htmlFor="currentPassword" className="text-sm font-medium text-muted-foreground">Current Password</label>
                                    <input
                                        id="currentPassword"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                                        placeholder="Enter current password"
                                    />
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    You sign in with Google. Setting a password lets you also sign in with your email — Google will keep working either way.
                                </p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="newPassword" className="text-sm font-medium text-muted-foreground">New Password</label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                                        placeholder="New password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Message */}
                    {message && (
                        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-500/30"
                            : "bg-destructive/10 text-destructive border border-destructive/30"
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-gold hover:bg-gold/90 text-foreground font-bold py-3 px-8 rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </form>
            </main>
        </div>
    );
}
