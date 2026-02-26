"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user && (session.user as { role?: string }).role === "ADMIN";

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    useEffect(() => {
        fetch("/api/profile")
            .then((res) => res.json())
            .then((data) => {
                if (!data.error) {
                    setFirstName(data.firstName || "");
                    setLastName(data.lastName || "");
                    setEmail(data.email || "");
                    setUsername(data.username || "");
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match." });
            return;
        }

        if (newPassword && newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }

        setSaving(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = { firstName, lastName };

        if (isAdmin) {
            payload.email = email;
            payload.username = username;
        }

        if (newPassword) {
            payload.currentPassword = currentPassword;
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
                setMessage({ type: "success", text: "Profile updated successfully." });
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
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <span className="text-neutral-500 text-lg">Loading…</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <main className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-700">
                <header className="border-b border-neutral-800 pb-6">
                    <h1 className="text-3xl font-black tracking-tight">Settings</h1>
                    <p className="text-neutral-500 mt-1">Manage your profile and security</p>
                </header>

                <form onSubmit={handleSave} className="space-y-10">
                    {/* Profile Section */}
                    <section className="space-y-5">
                        <h2 className="text-lg font-bold text-neutral-300 uppercase tracking-widest text-sm">Profile</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="firstName" className="text-sm font-medium text-neutral-400">First Name</label>
                                <input
                                    id="firstName"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f9c111] transition-colors"
                                    placeholder="First name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lastName" className="text-sm font-medium text-neutral-400">Last Name</label>
                                <input
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f9c111] transition-colors"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-neutral-400">
                                Email
                                {!isAdmin && <span className="text-neutral-600 ml-2 text-xs">(Admin only)</span>}
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!isAdmin}
                                className={`w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors ${isAdmin ? "focus:border-[#f9c111]" : "opacity-50 cursor-not-allowed"
                                    }`}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="username" className="text-sm font-medium text-neutral-400">
                                Username
                                {!isAdmin && <span className="text-neutral-600 ml-2 text-xs">(Admin only)</span>}
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={!isAdmin}
                                className={`w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none transition-colors ${isAdmin ? "focus:border-[#f9c111]" : "opacity-50 cursor-not-allowed"
                                    }`}
                            />
                        </div>
                    </section>

                    {/* Password Section */}
                    <section className="space-y-5">
                        <h2 className="text-lg font-bold text-neutral-300 uppercase tracking-widest text-sm">Change Password</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="currentPassword" className="text-sm font-medium text-neutral-400">Current Password</label>
                                <input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f9c111] transition-colors"
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label htmlFor="newPassword" className="text-sm font-medium text-neutral-400">New Password</label>
                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f9c111] transition-colors"
                                        placeholder="New password"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-400">Confirm Password</label>
                                    <input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#f9c111] transition-colors"
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Message */}
                    {message && (
                        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === "success"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#f9c111] hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-xl transition-all shadow-[0_4px_14px_0_rgba(249,193,17,0.39)] hover:shadow-[0_6px_20px_rgba(249,193,17,0.23)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? "Saving…" : "Save Changes"}
                    </button>
                </form>
            </main>
        </div>
    );
}
