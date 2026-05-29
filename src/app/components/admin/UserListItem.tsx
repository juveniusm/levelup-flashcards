"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export interface UserRow {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    username: string | null;
    role: string;
}

interface UserListItemProps {
    user: UserRow;
    isSuperAdmin: boolean;
    onUpdate: () => void;
    setMessage: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export default function UserListItem({ user, isSuperAdmin, onUpdate, setMessage }: UserListItemProps) {
    const { data: session, update: updateSession } = useSession();
    const [mode, setMode] = useState<"view" | "edit" | "delete">("view");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        username: user.username || "",
        newPassword: "",
        role: user.role
    });

    const saveEdit = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    email: editForm.email,
                    username: editForm.username,
                    role: editForm.role,
                    ...(editForm.newPassword ? { newPassword: editForm.newPassword } : {})
                }),
            });
            const data = await res.json();
            if (res.ok) {
                // If the admin edited their own profile, refresh the session
                if (user.id === session?.user?.id) await updateSession();
                setMessage({ type: "success", text: "User updated." });
                setMode("view");
                onUpdate();
            } else {
                setMessage({ type: "error", text: data.error || "Failed to update." });
            }
        } catch {
            setMessage({ type: "error", text: "Network error." });
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        setDeleting(true);
        setMessage(null);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: "User deleted." });
                onUpdate();
            } else {
                setMessage({ type: "error", text: data.error || "Failed to delete user." });
            }
        } catch {
            setMessage({ type: "error", text: "Network error." });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4">
            {mode === "edit" ? (
                /* ── Edit mode ── */
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} placeholder="First name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors" />
                        <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} placeholder="Last name" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors" />
                        <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="Username" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="password" value={editForm.newPassword} onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })} placeholder="New password (leave blank to keep current)" className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors" />

                        {isSuperAdmin ? (
                            <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 transition-colors cursor-pointer"
                            >
                                <option value="STUDENT">STUDENT</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        ) : (
                            <div className="bg-muted border border-border rounded-lg px-3 py-2 text-[10px] text-muted-foreground flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Role management restricted to Super Admin
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={saving} className="bg-gold hover:bg-gold/90 text-foreground font-bold text-sm px-5 py-2 rounded-full transition-all disabled:opacity-50">
                            {saving ? "Saving…" : "Save"}
                        </button>
                        <button onClick={() => setMode("view")} className="bg-secondary hover:bg-muted text-foreground font-medium text-sm px-5 py-2 rounded-lg transition-all border border-border">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : mode === "delete" ? (
                /* ── Delete confirmation ── */
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-destructive font-medium">
                        Delete <span className="text-foreground">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}</span>? This cannot be undone.
                    </p>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={confirmDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-sm px-4 py-1.5 rounded-lg transition-all disabled:opacity-50">
                            {deleting ? "Deleting…" : "Yes, Delete"}
                        </button>
                        <button onClick={() => setMode("view")} className="bg-secondary hover:bg-muted text-foreground font-medium text-sm px-4 py-1.5 rounded-lg transition-all border border-border">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                /* ── View mode ── */
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gold text-foreground flex items-center justify-center font-bold font-mono text-sm shrink-0">
                            {(user.firstName || user.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-foreground font-medium">
                                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${user.role === "ADMIN" ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"}`}>
                                    {user.role}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-muted-foreground">{user.email || "—"}</span>
                                {user.username && <span className="text-xs text-muted-foreground">@{user.username}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                        <button onClick={() => { setMode("edit"); setMessage(null); }} className="text-sm font-medium text-muted-foreground hover:text-gold transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">
                            Edit
                        </button>
                        <button onClick={() => { setMode("delete"); setMessage(null); }} className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors px-3 py-1.5 rounded-lg hover:bg-muted">
                            Delete
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
