"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UserListItem, { UserRow } from "@/app/components/admin/UserListItem";



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
    const isSuperAdmin = session?.user?.email === "juveniusm@gmail.com";

    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchField, setSearchField] = useState<SearchField>("all");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [currentPage, setCurrentPage] = useState(1);

    const fetchUsers = useCallback(() => {
        fetch("/api/admin/users")
            .then((r) => r.json())
            .then((data) => { if (Array.isArray(data)) setUsers(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (session && !isAdmin) { router.push("/study"); return; }
        fetchUsers();
    }, [session, isAdmin, router, fetchUsers]);

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



    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <span className="text-neutral-500 text-lg">Loading…</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
            <main className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pt-12 lg:pt-0">
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
                        <UserListItem 
                            key={user.id} 
                            user={user} 
                            isSuperAdmin={isSuperAdmin} 
                            onUpdate={fetchUsers} 
                            setMessage={setMessage} 
                        />
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
