"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Settings } from "lucide-react";
import { Session } from "next-auth";

interface SidebarFooterProps {
    session: Session | null;
    isCollapsed: boolean;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

export default function SidebarFooter({ session, isCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarFooterProps) {
    const pathname = usePathname();

    return (
        <div className={`p-4 border-t border-[#333] flex flex-col gap-2 shrink-0 ${isCollapsed ? "lg:justify-center" : "justify-start"}`}>
            {session ? (
                <div className={`flex items-center gap-3 p-2 rounded-xl bg-neutral-900 border border-neutral-800 ${isCollapsed ? "lg:justify-center" : ""}`}>
                    <div className="w-8 h-8 rounded-full bg-[#f9c111] text-black flex items-center justify-center font-bold font-mono text-sm shrink-0">
                        {(session.user?.name || session.user?.email || "?").charAt(0).toUpperCase()}
                    </div>
                    {(!isCollapsed || isMobileMenuOpen) && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium text-white truncate">{session.user?.name || "User"}</span>
                            <span className="text-xs text-neutral-500 truncate">{(session.user as any)?.role}</span>
                        </div>
                    )}
                </div>
            ) : null}

            <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${pathname === "/settings"
                    ? "bg-[#222] text-[#f9c111] font-semibold"
                    : "text-gray-400 hover:bg-[#222] hover:text-white"
                    } ${isCollapsed ? "lg:justify-center w-full" : "w-full"}`}
                title={isCollapsed ? "Settings" : undefined}
            >
                <Settings size={22} className="shrink-0" />
                {(!isCollapsed || isMobileMenuOpen) && <span>Settings</span>}
            </Link>

            <button
                onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (session) signOut({ callbackUrl: "/login" });
                }}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all text-gray-400 hover:bg-[#222] hover:text-white ${isCollapsed ? "lg:justify-center w-full" : "w-full"}`}
                title={isCollapsed ? "Sign Out" : undefined}
            >
                <LogOut size={22} className="shrink-0 text-red-400" />
                {(!isCollapsed || isMobileMenuOpen) && <span>Sign Out</span>}
            </button>
        </div>
    );
}
