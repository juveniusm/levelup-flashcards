"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, PenTool, Clock, Library, ChevronDown, BarChart3, Users, Search } from "lucide-react";

interface SidebarNavProps {
    isCollapsed: boolean;
    isMobileMenuOpen: boolean;
    isAdmin: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

export default function SidebarNav({ isCollapsed, isMobileMenuOpen, isAdmin, setIsMobileMenuOpen }: SidebarNavProps) {
    const pathname = usePathname();
    const isStudyPage = pathname === "/study";
    const isStatsPage = pathname === "/stats";

    return (
        <nav className="flex-1 py-6 flex flex-col gap-1 px-3 mt-4 lg:mt-0 overflow-y-auto">
            {/* Study - Main Nav */}
            <Link
                href="/study"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isStudyPage
                    ? "bg-[#222] text-[#f9c111] font-semibold shadow-sm"
                    : "text-gray-400 hover:bg-[#222] hover:text-white"
                    } ${isCollapsed ? "lg:justify-center" : "justify-start"}`}
                title={isCollapsed ? "Study" : undefined}
            >
                <Home size={22} className="shrink-0" />
                {(!isCollapsed || isMobileMenuOpen) && (
                    <div className="flex items-center justify-between flex-1">
                        <span>Study</span>
                        {isStudyPage && <ChevronDown size={14} className="text-neutral-500" />}
                    </div>
                )}
            </Link>

            {/* Study Submenu */}
            {(!isCollapsed || isMobileMenuOpen) && isStudyPage && (
                <div className="ml-5 pl-4 border-l border-neutral-700/50 flex flex-col gap-1 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    <a
                        href="#due-cards"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-neutral-400 hover:text-[#f9c111] hover:bg-[#1a1a1a] transition-all whitespace-nowrap"
                    >
                        <Clock size={16} className="shrink-0" />
                        <span>Due Cards</span>
                    </a>
                    <a
                        href="#all-decks"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-neutral-400 hover:text-[#f9c111] hover:bg-[#1a1a1a] transition-all whitespace-nowrap"
                    >
                        <Library size={16} className="shrink-0" />
                        <span>All Decks</span>
                    </a>
                </div>
            )}
            {/* Search Trigger */}
            <button
                onClick={() => {
                    setIsMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent("open-command-palette"));
                }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-gray-400 hover:bg-[#222] hover:text-white ${isCollapsed ? "lg:justify-center" : "justify-start"}`}
                title={isCollapsed ? "Search (Ctrl+K)" : undefined}
            >
                <Search size={22} className="shrink-0" />
                {(!isCollapsed || isMobileMenuOpen) && (
                    <div className="flex items-center justify-between flex-1">
                        <span>Search</span>
                        <span className="text-[10px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-700 font-mono">Ctrl+K</span>
                    </div>
                )}
            </button>

            {/* Stats */}
            <Link
                href="/stats"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isStatsPage
                    ? "bg-[#222] text-[#f9c111] font-semibold shadow-sm"
                    : "text-gray-400 hover:bg-[#222] hover:text-white"
                    } ${isCollapsed ? "lg:justify-center" : "justify-start"}`}
                title={isCollapsed ? "Stats" : undefined}
            >
                <BarChart3 size={22} className="shrink-0" />
                {(!isCollapsed || isMobileMenuOpen) && <span>Stats</span>}
            </Link>

            {isAdmin && (
                <Link
                    href="/creator"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === "/creator" || pathname.startsWith("/creator/")
                        ? "bg-[#222] text-[#f9c111] font-semibold shadow-sm"
                        : "text-gray-400 hover:bg-[#222] hover:text-white"
                        } ${isCollapsed ? "lg:justify-center" : "justify-start"}`}
                    title={isCollapsed ? "Creator" : undefined}
                >
                    <PenTool size={22} className="shrink-0" />
                    {(!isCollapsed || isMobileMenuOpen) && <span>Creator</span>}
                </Link>
            )}

            {/* Manage Users - Admin only */}
            {isAdmin && (
                <Link
                    href="/admin/users"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === "/admin/users"
                        ? "bg-[#222] text-[#f9c111] font-semibold shadow-sm"
                        : "text-gray-400 hover:bg-[#222] hover:text-white"
                        } ${isCollapsed ? "lg:justify-center" : "justify-start"}`}
                    title={isCollapsed ? "Manage Users" : undefined}
                >
                    <Users size={22} className="shrink-0" />
                    {(!isCollapsed || isMobileMenuOpen) && <span>Users</span>}
                </Link>
            )}
        </nav>
    );
}
