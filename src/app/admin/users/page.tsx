"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserRow {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    username: string | null;
    role: string;
}

interface EditForm {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    newPassword: string;
    role: string;
}

const USERS_PER_PAGE = 10;

type SearchField = "all" | "name" | "email" | "username" | "role";

const searchFieldLabels: Record<SearchField, string> = {
    all: "Search All Fields",
    name: "Name",
    email: "Email",
    username: "Username",
    role: "Role",
};

export default function AdminUsersPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const isAdmin = session?.user && (session.user as { role?: string }).role === "ADMIN";

    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({ firstName: "", lastName: "", email: "", username: "", newPassword: "", role: "STUDENT" });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchField, setSearchField] = useState<SearchField>("all");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);

    // Delete confirmation
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (session && !isAdmin) { router.push("/study"); return; }
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    // Close dropdown on outside click
    useEffect(() => {
        const handle = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    const fetchUsers = () => {
        fetch("/api/admin/users")
            .then((r) => r.json())
            .then((data) => { if (Array.isArray(data)) setUsers(data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    // ── Filter ──────────────────────────────────────────────────────────────
    const filteredUsers = users.filter((u) => {
        const q = searchQuery.toLowerCase();
        if (!q) return true;
        const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").toLowerCase();
        if (searchField === "name") return fullName.includes(q);
        if (searchField === "email") return (u.email ?? "").toLowerCase().includes(q);
        if (searchField === "username") return (u.username ?? "").toLowerCase().includes(q);
        if (searchField === "role") return u.role.toLowerCase().includes(q);
        return fullName.includes(q) || (u.email ?? "").toLowerCase().includes(q) || (u.username ?? "").toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    });

    // ── Pagination ───────────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginated = filteredUsers.slice((safePage - 1) * USERS_PER_PAGE, safePage * USERS_PER_PAGE);

    // ── Edit ─────────────────────────────────────────────────────────────────
    const startEdit = (user: UserRow) => {
        setEditingId(user.id);
        setEditForm({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            username: user.username || "",
            newPassword: "",
            role: user.role
        });
        setMessage(null);
        setConfirmDeleteId(null);
    };

    const cancelEdit = () => { setEditingId(null); setMessage(null); };

    const saveEdit = async () => {
        if (!editingId) return;
        setSaving(true); setMessage(null);
        try {
            const res = await fetch(`/api/admin/users/${editingId}`, {
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
            if (res.ok) { setMessage({ type: "success", text: "User updated." }); setEditingId(null); fetchUsers(); }
            else setMessage({ type: "error", text: data.error || "Failed to update." });
        } catch { setMessage({ type: "error", text: "Network error." }); }
        finally { setSaving(false); }
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const confirmDelete = async () => {
        if (!confirmDeleteId) return;
        setDeleting(true); setMessage(null);
        try {
            const res = await fetch(`/api/admin/users/${confirmDeleteId}`, { method: "DELETE" });
            const data = await res.json();
            if (res.ok) { setMessage({ type: "success", text: "User deleted." }); setConfirmDeleteId(null); fetchUsers(); }
            else setMessage({ type: "error", text: data.error || "Failed to delete user." });
        } catch { setMessage({ type: "error", text: "Network error." }); }
        finally { setDeleting(false); }
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
            <main className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
                <header className="border-b border-neutral-800 pb-6">
                    <h1 className="text-3xl font-black tracking-tight">Manage Users</h1>
                    <p className="text-neutral-500 mt-1">{users.length} user{users.length !== 1 ? "s" : ""} registered</p>
                </header>

                {message && (
                    <div className={`rounded-xl px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                        {message.text}
                    </div>
                )}

                {/* ── Search bar ── */}
                <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                    {/* Cascading dropdown */}
                    <div className="relative sm:w-52 z-20" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className={`w-full bg-neutral-900 border ${isDropdownOpen ? "border-[#f9c111]" : "border-neutral-800"} hover:border-neutral-700 rounded-lg px-4 py-3 text-white text-left focus:outline-none focus:ring-2 focus:ring-[#f9c111]/50 transition-all cursor-pointer text-sm flex justify-between items-center min-h-[46px]`}
                        >
                            <span className="truncate pr-2">{searchFieldLabels[searchField]}</span>
                            <svg className={`flex-shrink-0 w-4 h-4 text-neutral-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden py-1 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                                {(Object.keys(searchFieldLabels) as SearchField[]).map((key) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => { setSearchField(key); setCurrentPage(1); setIsDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-neutral-800/80 flex items-center gap-2 ${searchField === key ? "text-[#f9c111] bg-neutral-800/40 font-medium" : "text-neutral-300"}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${searchField === key ? "bg-[#f9c111]" : "bg-transparent"}`} />
                                        {searchFieldLabels[key]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Search input */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder={`Search by ${searchField === "all" ? "any field" : searchField}…`}
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#f9c111] transition-all text-sm"
                        />
                    </div>
                </div>

                {/* ── User list ── */}
                <div className="space-y-3">
                    {paginated.length === 0 ? (
                        <p className="text-neutral-500 text-center py-12">No users found matching your search.</p>
                    ) : paginated.map((user) => (
                        <div key={user.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                            {editingId === user.id ? (
                                /* ── Edit mode ── */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input type="text" value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} placeholder="First name" className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f9c111] transition-colors" />
                                        <input type="text" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} placeholder="Last name" className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f9c111] transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f9c111] transition-colors" />
                                        <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="Username" className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f9c111] transition-colors" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input type="password" value={editForm.newPassword} onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })} placeholder="New password (leave blank to keep current)" className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f9c111] transition-colors" />
                                        <select
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                            className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f9c111] transition-colors cursor-pointer"
                                        >
                                            <option value="STUDENT">STUDENT</option>
                                            <option value="ADMIN">ADMIN</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={saveEdit} disabled={saving} className="bg-[#f9c111] hover:bg-yellow-400 text-black font-bold text-sm px-5 py-2 rounded-lg transition-all disabled:opacity-50">
                                            {saving ? "Saving…" : "Save"}
                                        </button>
                                        <button onClick={cancelEdit} className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm px-5 py-2 rounded-lg transition-all border border-neutral-700">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : confirmDeleteId === user.id ? (
                                /* ── Delete confirmation ── */
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-sm text-red-400 font-medium">
                                        Delete <span className="text-white">{[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}</span>? This cannot be undone.
                                    </p>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={confirmDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white font-bold text-sm px-4 py-1.5 rounded-lg transition-all disabled:opacity-50">
                                            {deleting ? "Deleting…" : "Yes, Delete"}
                                        </button>
                                        <button onClick={() => setConfirmDeleteId(null)} className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-sm px-4 py-1.5 rounded-lg transition-all border border-neutral-700">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* ── View mode ── */
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#f9c111] text-black flex items-center justify-center font-bold font-mono text-sm shrink-0">
                                            {(user.firstName || user.email || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">
                                                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "—"}
                                                </span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${user.role === "ADMIN" ? "bg-[#f9c111]/20 text-[#f9c111]" : "bg-neutral-800 text-neutral-500"}`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-xs text-neutral-500">{user.email || "—"}</span>
                                                {user.username && <span className="text-xs text-neutral-600">@{user.username}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <button onClick={() => startEdit(user)} className="text-sm font-medium text-neutral-500 hover:text-[#f9c111] transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-800">
                                            Edit
                                        </button>
                                        <button onClick={() => { setConfirmDeleteId(user.id); setEditingId(null); }} className="text-sm font-medium text-neutral-600 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-neutral-800">
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-4 border-t border-neutral-800 mt-4">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-neutral-900 transition-colors text-sm"
                        >
                            Previous
                        </button>
                        <span className="text-neutral-400 text-sm">Page {safePage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white hover:bg-neutral-800 disabled:opacity-40 disabled:hover:bg-neutral-900 transition-colors text-sm"
                        >
                            Next
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
