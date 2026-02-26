"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Home, Settings, PenTool, Clock, Library, ChevronDown, BarChart3, Users } from 'lucide-react';

export default function Sidebar() {
    const [isHoverCollapsed, setIsHoverCollapsed] = useState(true);
    const pathname = usePathname();
    const { data: session } = useSession();

    if (pathname === '/login' || pathname === '/') return null;

    // Game sessions are /:deckId/study — collapse sidebar there
    const isGameSession = /^\/[^/]+\/study/.test(pathname);
    const isStudyPage = pathname === '/study';
    const isStatsPage = pathname === '/stats';
    const isAdmin = session?.user && (session.user as { role?: string }).role === 'ADMIN';

    // Always expanded on non-game pages; collapsible only during game sessions
    const isCollapsed = isGameSession ? isHoverCollapsed : false;

    return (
        <aside
            onMouseEnter={() => isGameSession && setIsHoverCollapsed(false)}
            onMouseLeave={() => isGameSession && setIsHoverCollapsed(true)}
            className={`bg-[#111111] border-r border-[#333] transition-all duration-300 ease-in-out flex flex-col sticky top-0 h-screen flex-shrink-0 ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
                {/* Study - Main Nav */}
                <Link
                    href="/study"
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isStudyPage
                        ? 'bg-[#222] text-[#f9c111] font-semibold shadow-sm'
                        : 'text-gray-400 hover:bg-[#222] hover:text-white'
                        } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                    title={isCollapsed ? 'Study' : undefined}
                >
                    <Home size={22} className="shrink-0" />
                    {!isCollapsed && (
                        <div className="flex items-center justify-between flex-1">
                            <span>Study</span>
                            {isStudyPage && <ChevronDown size={14} className="text-neutral-500" />}
                        </div>
                    )}
                </Link>

                {/* Study Submenu - visible when expanded and on study page */}
                {!isCollapsed && isStudyPage && (
                    <div className="ml-5 pl-4 border-l border-neutral-700/50 flex flex-col gap-1 mt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        <a
                            href="#due-cards"
                            className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-neutral-400 hover:text-[#f9c111] hover:bg-[#1a1a1a] transition-all whitespace-nowrap"
                        >
                            <Clock size={16} className="shrink-0" />
                            <span>Due Cards</span>
                        </a>
                        <a
                            href="#all-decks"
                            className="flex items-center gap-3 p-2.5 rounded-lg text-sm text-neutral-400 hover:text-[#f9c111] hover:bg-[#1a1a1a] transition-all whitespace-nowrap"
                        >
                            <Library size={16} className="shrink-0" />
                            <span>All Decks</span>
                        </a>
                    </div>
                )}

                {/* Stats */}
                <Link
                    href="/stats"
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isStatsPage
                        ? 'bg-[#222] text-[#f9c111] font-semibold shadow-sm'
                        : 'text-gray-400 hover:bg-[#222] hover:text-white'
                        } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                    title={isCollapsed ? 'Stats' : undefined}
                >
                    <BarChart3 size={22} className="shrink-0" />
                    {!isCollapsed && <span>Stats</span>}
                </Link>

                {isAdmin && (
                    <Link
                        href="/creator"
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === '/creator' || pathname.startsWith('/creator/')
                            ? 'bg-[#222] text-[#f9c111] font-semibold shadow-sm'
                            : 'text-gray-400 hover:bg-[#222] hover:text-white'
                            } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                        title={isCollapsed ? 'Creator' : undefined}
                    >
                        <PenTool size={22} className="shrink-0" />
                        {!isCollapsed && <span>Creator</span>}
                    </Link>
                )}

                {/* Manage Users - Admin only */}
                {isAdmin && (
                    <Link
                        href="/admin/users"
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${pathname === '/admin/users'
                            ? 'bg-[#222] text-[#f9c111] font-semibold shadow-sm'
                            : 'text-gray-400 hover:bg-[#222] hover:text-white'
                            } ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                        title={isCollapsed ? 'Manage Users' : undefined}
                    >
                        <Users size={22} className="shrink-0" />
                        {!isCollapsed && <span>Users</span>}
                    </Link>
                )}
            </nav>

            <div className={`p-4 border-t border-[#333] flex flex-col gap-2 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                {session ? (
                    <div className={`flex items-center gap-3 p-2 rounded-xl bg-neutral-900 border border-neutral-800 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-[#f9c111] text-black flex items-center justify-center font-bold font-mono text-sm shrink-0">
                            {(session.user?.name || session.user?.email || '?').charAt(0).toUpperCase()}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium text-white truncate">{session.user?.name || 'User'}</span>
                                <span className="text-xs text-neutral-500 truncate">{(session.user as { role?: string })?.role}</span>
                            </div>
                        )}
                    </div>
                ) : null}

                <Link
                    href="/settings"
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all ${pathname === '/settings'
                        ? 'bg-[#222] text-[#f9c111] font-semibold'
                        : 'text-gray-400 hover:bg-[#222] hover:text-white'
                        } ${isCollapsed ? 'justify-center w-full' : 'w-full'}`}
                    title={isCollapsed ? 'Settings' : undefined}
                >
                    <Settings size={22} className="shrink-0" />
                    {!isCollapsed && <span>Settings</span>}
                </Link>

                <button
                    onClick={() => session ? signOut({ callbackUrl: '/login' }) : null}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-all text-gray-400 hover:bg-[#222] hover:text-white ${isCollapsed ? 'justify-center w-full' : 'w-full'}`}
                    title={isCollapsed ? 'Sign Out' : undefined}
                >
                    <LogOut size={22} className="shrink-0 text-red-400" />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}

